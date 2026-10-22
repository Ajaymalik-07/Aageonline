/**
 * AageOnline — Authenticated Business Owner's Owned Listings API
 * Milestone 0.20.30: Business Owner Identity & Registration Flow
 *
 * GET /api/business/owned
 *
 * Returns all businesses associated with the authenticated session owner.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/server-session.ts';
import { PostgresBusinessRepository } from '../../../../lib/db/repositories/business-repository.ts';
import { isDatabaseConfigured } from '../../../../lib/db/client.ts';
import { getMembershipsByUser } from '../../../../lib/memberships/store.ts';
import { getBusinessById } from '../../../../lib/taxonomy/businesses.ts';
import { getCityById } from '../../../../lib/taxonomy/locations.ts';
import { getCategoryById } from '../../../../lib/taxonomy/categories.ts';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const userId = session.userId;

    // 1. Read from PostgreSQL if configured
    if (isDatabaseConfigured()) {
      const bizRepo = new PostgresBusinessRepository();
      const owned = await bizRepo.getBusinessesByOwner(userId);
      return NextResponse.json({
        success: true,
        businesses: owned.map((item) => ({
          id: item.business.id,
          slug: item.business.slug,
          name: item.business.name,
          legalName: item.business.legalName,
          cityName: item.cityName || item.business.primaryCityId,
          categoryName: item.categoryName,
          verificationStatus: item.business.verificationStatus,
          publicationStatus: item.business.publicationStatus,
          role: item.membershipRole,
          phone: item.business.phone,
          whatsappPhone: item.business.socialLinks?.whatsapp,
          createdAt: item.business.createdAt,
        })),
      });
    }

    // 2. In-memory fallback
    const memberships = getMembershipsByUser(userId).filter((m) => m.status === 'ACTIVE');
    const businesses = memberships
      .map((m) => {
        const biz = getBusinessById(m.businessId);
        if (!biz) return null;
        const city = biz.primaryCityId ? getCityById(biz.primaryCityId) : undefined;
        return {
          id: biz.id,
          slug: biz.slug,
          name: biz.name,
          legalName: biz.legalName,
          cityName: city?.name || biz.primaryCityId,
          categoryName: undefined,
          verificationStatus: biz.verificationStatus,
          publicationStatus: biz.publicationStatus,
          role: m.role,
          phone: biz.phone,
          whatsappPhone: biz.socialLinks?.whatsapp,
          createdAt: biz.createdAt,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      businesses,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve owned businesses';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
