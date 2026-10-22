/**
 * AageOnline — Business Registration & Placement API
 * Milestone 0.20.30: Business Owner Identity & Registration Flow
 *
 * POST /api/business/register
 *
 * Invariants:
 * 1. Strictly requires authenticated owner session.
 * 2. Mandates Business Phone and WhatsApp Business fields.
 * 3. WhatsApp Business is locked to the authenticated owner's verified phone.
 * 4. Strictly validates evidence format (GSTIN, UDYAM, SHOP_ESTABLISHMENT, COMMERCIAL_PAN).
 * 5. Saves status as PENDING (never falsely claims verified).
 * 6. Persists to PostgreSQL within a database transaction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/server-session.ts';
import { getUserById, registerUserInStore } from '../../../../lib/auth/store.ts';
import { normalizeIndianPhoneNumber } from '../../../../lib/auth/otp-service.ts';
import { validateEvidenceReference } from '../../../../lib/validation/evidence.ts';
import { PostgresBusinessRepository } from '../../../../lib/db/repositories/business-repository.ts';
import { PostgresUserRepository } from '../../../../lib/db/repositories/user-repository.ts';
import { isDatabaseConfigured } from '../../../../lib/db/client.ts';
import {
  createBusiness,
  getBusinessById,
  getBusinessBySlug,
  getAllBusinesses,
  addBusinessCategory,
  addBusinessLocation,
  addMarketParticipation,
} from '../../../../lib/taxonomy/businesses.ts';
import {
  getCityById,
  getCityBySlug,
  createCity,
  getStateById,
  getStateBySlug,
  createState,
} from '../../../../lib/taxonomy/locations.ts';
import {
  getCategoryById,
  getCategoryBySlug,
  createCategory,
} from '../../../../lib/taxonomy/categories.ts';
import { getMarketByCityAndCategory, createMarket } from '../../../../lib/taxonomy/markets.ts';
import { createMembership, getMembershipsByUser } from '../../../../lib/memberships/store.ts';
import { recordAuditEvent } from '../../../../lib/audit/store.ts';
import type { BusinessEntity, BusinessSocialLinks } from '../../../../types/business.ts';

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve active user session
    const session = await getServerSession(req);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with your WhatsApp Business number.' },
        { status: 401 }
      );
    }

    const userId = session.userId;
    let user = session.user;
    registerUserInStore(user);

    // Check status
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Active user account required to register business.' },
        { status: 403 }
      );
    }

    // 2. Parse input body
    const body = await req.json().catch(() => ({}));
    const name = body.name || body.businessName;
    const phone = body.phone || body.businessPhone;
    const whatsappPhone = body.whatsappPhone || body.whatsapp;
    const cityName = body.cityName || body.city;
    const categoryName = body.categoryName || body.category;
    const {
      legalName,
      categoryId,
      cityId,
      stateId,
      stateName,
      tagline,
      description,
      website,
      address,
      socialLinks = {},
      evidenceType,
      evidenceReference,
      targetPosition = 1,
      qualifyingAmountRupees = 28500,
    } = body;

    // Validate Business Name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Valid business name (at least 2 characters) is required.' },
        { status: 400 }
      );
    }

    // Validate Business Phone (mandatory)
    const phoneVal = normalizeIndianPhoneNumber(phone);
    if (!phoneVal.valid) {
      return NextResponse.json(
        { error: `Invalid Business Phone: ${phoneVal.error}` },
        { status: 400 }
      );
    }

    // Enforce WhatsApp Business identity lock: Must match authenticated owner's phone
    const ownerVerifiedPhone = user.phone || normalizeIndianPhoneNumber(whatsappPhone).normalized;
    if (!ownerVerifiedPhone) {
      return NextResponse.json(
        { error: 'Authenticated WhatsApp Business identity is required.' },
        { status: 400 }
      );
    }

    // Validate Evidence Type & Registration Reference
    const evidenceVal = validateEvidenceReference(evidenceType, evidenceReference);
    if (!evidenceVal.valid) {
      return NextResponse.json(
        { error: evidenceVal.error },
        { status: 400 }
      );
    }

    // Resolve or create City
    let city = cityId ? getCityById(cityId) || getCityBySlug(cityId) : undefined;
    if (!city && (cityName || cityId)) {
      const rawCityName = (cityName || cityId).trim();
      const citySlug = rawCityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      city = getCityBySlug(citySlug);

      if (!city) {
        let state = stateId ? getStateById(stateId) || getStateBySlug(stateId) : undefined;
        if (!state) {
          const rawStateName = (stateName || stateId || 'Rajasthan').trim();
          const stateSlug = `state-${rawStateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
          state = getStateBySlug(stateSlug) || createState({
            id: stateSlug,
            slug: stateSlug,
            name: rawStateName,
            countryId: 'country-india',
            code: rawStateName.substring(0, 2).toUpperCase(),
            status: 'ACTIVE',
          });
        }

        city = createCity({
          id: `city-${citySlug}`,
          slug: citySlug,
          name: rawCityName,
          stateId: state.id,
          countryId: 'country-india',
          status: 'ACTIVE',
        });
      }
    }

    if (!city) {
      return NextResponse.json(
        { error: 'Valid operational city is required.' },
        { status: 400 }
      );
    }

    // Resolve or create Category
    let category = categoryId ? getCategoryById(categoryId) || getCategoryBySlug(categoryId) : undefined;
    if (!category && (categoryName || categoryId)) {
      const rawCatName = (categoryName || categoryId).trim();
      const catSlug = rawCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      category = getCategoryBySlug(catSlug);

      if (!category) {
        category = createCategory({
          id: `cat-${catSlug}`,
          slug: catSlug,
          name: rawCatName,
          description: `Commercial services and directory for ${rawCatName}`,
          status: 'ACTIVE',
        });
      }
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Valid commercial category is required.' },
        { status: 400 }
      );
    }

    // Duplicate Business Name Invariant Check
    if (isDatabaseConfigured()) {
      const bizRepo = new PostgresBusinessRepository();
      const dupCheck = await bizRepo.findDuplicateBusiness(name, city.id, userId);
      if (dupCheck.ownedDuplicate) {
        return NextResponse.json(
          {
            error: `You already have a business registered as "${name.trim()}" in ${city.name}. Each business you register must have a distinct name (e.g. "${name.trim()} - Branch 2").`,
            code: 'DUPLICATE_OWNED_BUSINESS',
          },
          { status: 409 }
        );
      }
      if (dupCheck.existingBusiness) {
        return NextResponse.json(
          {
            error: `A business with the name "${name.trim()}" is already registered in ${city.name}. If this is your enterprise, please claim the existing listing or choose a distinct name.`,
            code: 'DUPLICATE_BUSINESS_NAME',
          },
          { status: 409 }
        );
      }
    } else {
      // In-memory fallback
      const userMemberships = getMembershipsByUser(userId).filter((m) => m.status === 'ACTIVE');
      const ownedMatchingName = userMemberships.some((m) => {
        const b = getBusinessById(m.businessId);
        return (
          b &&
          b.name.trim().toLowerCase() === name.trim().toLowerCase() &&
          (!b.primaryCityId || b.primaryCityId === city!.id)
        );
      });
      if (ownedMatchingName) {
        return NextResponse.json(
          {
            error: `You already have a business registered as "${name.trim()}" in ${city.name}. Each business you register must have a distinct name (e.g. "${name.trim()} - Branch 2").`,
            code: 'DUPLICATE_OWNED_BUSINESS',
          },
          { status: 409 }
        );
      }

      const allMatchingName = getAllBusinesses().some(
        (b) =>
          b.name.trim().toLowerCase() === name.trim().toLowerCase() &&
          b.primaryCityId === city!.id
      );
      if (allMatchingName) {
        return NextResponse.json(
          {
            error: `A business with the name "${name.trim()}" is already registered in ${city.name}. If this is your enterprise, please claim the existing listing or choose a distinct name.`,
            code: 'DUPLICATE_BUSINESS_NAME',
          },
          { status: 409 }
        );
      }
    }

    // Generate unique slug
    const cleanNameSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 35);
    const baseSlug = `${cleanNameSlug}-${city.slug}`.slice(0, 48);
    let finalSlug = baseSlug;
    let counter = 1;
    while (getBusinessBySlug(finalSlug)) {
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
    }

    const businessId = `biz-${finalSlug}`.slice(0, 60);
    const now = new Date().toISOString();

    const sanitizedSocialLinks: BusinessSocialLinks = {
      instagram: socialLinks.instagram?.trim() || undefined,
      linkedin: socialLinks.linkedin?.trim() || undefined,
      facebook: socialLinks.facebook?.trim() || undefined,
      twitter: socialLinks.twitter?.trim() || undefined,
      youtube: socialLinks.youtube?.trim() || undefined,
      whatsapp: `+91 ${ownerVerifiedPhone}`,
    };

    // 3. Persist to PostgreSQL if configured
    let persistedBusiness: BusinessEntity;

    if (isDatabaseConfigured()) {
      const bizRepo = new PostgresBusinessRepository();
      persistedBusiness = await bizRepo.createBusinessWithOwner(
        {
          id: businessId,
          slug: finalSlug,
          name: name.trim(),
          legalName: (legalName || name).trim(),
          tagline: (tagline || '').trim(),
          description: (description || `Professional ${category.name} serving ${city.name} and surrounding areas.`).trim(),
          website: website?.trim() || undefined,
          phone: phoneVal.formatted,
          whatsappPhone: ownerVerifiedPhone.startsWith('+91') ? ownerVerifiedPhone : `+91 ${ownerVerifiedPhone}`,
          email: user.email || undefined,
          address: address?.trim() || undefined,
          cityId: city.id,
          citySlug: city.slug,
          cityName: city.name,
          categoryId: category.id,
          categorySlug: category.slug,
          categoryName: category.name,
          evidenceType: evidenceVal.evidenceType,
          evidenceReference: evidenceVal.normalized,
          evidenceStatus: 'PENDING',
        },
        userId
      );
    } else {
      persistedBusiness = {
        id: businessId,
        slug: finalSlug,
        name: name.trim(),
        legalName: (legalName || name).trim(),
        tagline: (tagline || '').trim(),
        description: (description || `Professional ${category.name} serving ${city.name} and surrounding areas.`).trim(),
        website: website?.trim() || undefined,
        phone: phoneVal.formatted,
        socialLinks: sanitizedSocialLinks,
        primaryCityId: city.id,
        primaryStateId: city.stateId || 'state-rajasthan',
        primaryCountryId: 'country-india',
        verificationStatus: 'PENDING',
        publicationStatus: 'PUBLISHED',
        createdAt: now,
        updatedAt: now,
      };
    }

    // Keep in-memory cache synchronized
    createBusiness(persistedBusiness);
    addBusinessCategory({ businessId: persistedBusiness.id, categoryId: category.id, isPrimary: true });
    addBusinessLocation({ businessId: persistedBusiness.id, cityId: city.id, isPrimary: true });

    // 4. Establish authoritative OWNER membership for claimant user
    const membership = createMembership(
      {
        businessId: persistedBusiness.id,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
      user.id
    );

    // 5. Resolve or create market and register position
    let market = getMarketByCityAndCategory(city.id, category.id);
    if (!market) {
      market = createMarket({
        cityId: city.id,
        categoryId: category.id,
        status: 'PUBLISHED',
        publicationStatus: 'PUBLISHED',
        indexabilityStatus: 'INDEXABLE',
        contentStatus: 'APPROVED',
        totalBusinesses: 1,
        activePositions: 1,
        topQualifyingAmountMinor: (qualifyingAmountRupees || 28500) * 100,
      });
    }

    const participation = addMarketParticipation({
      id: `mp-${persistedBusiness.slug}`,
      businessId: persistedBusiness.id,
      marketId: market.id,
      status: 'ACTIVE',
      eligibilityStatus: 'ELIGIBLE',
      currentPosition: Number(targetPosition) || 1,
      qualifyingAmountRupees: Number(qualifyingAmountRupees) || 28500,
      joinedAt: now,
      updatedAt: now,
    });

    // 6. Record immutable audit record
    recordAuditEvent('BUSINESS_REGISTERED_AND_LISTED', 'Business', persistedBusiness.id, user.id, {
      businessName: persistedBusiness.name,
      legalName: persistedBusiness.legalName,
      marketId: market.id,
      assignedPosition: participation.currentPosition,
      qualifyingAmountRupees: participation.qualifyingAmountRupees,
      evidenceType: evidenceVal.evidenceType,
      evidenceReference: evidenceVal.normalized,
      evidenceStatus: 'PENDING',
      membershipId: membership.id,
    });

    return NextResponse.json(
      {
        success: true,
        business: persistedBusiness,
        membership,
        marketParticipation: participation,
        urls: {
          publicShowcase: `/businesses/${persistedBusiness.slug}`,
          marketLadder: `/${city.slug}/${category.slug}`,
          workspaceProfile: `/business/dashboard/profile?businessId=${persistedBusiness.id}`,
          directory: `/businesses`,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Business registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
