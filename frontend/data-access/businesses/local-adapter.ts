/**
 * AageOnline — Local Business Data Source Adapter
 *
 * Implements BusinessDataSource directly on top of the in-memory canonical
 * business, taxonomy, and market stores.
 * Enforces publication invariants and masks internal/private fields.
 */

import type { BusinessDataSource } from './service.ts';
import type {
  BusinessProfile,
  BusinessMarketParticipation,
  BusinessSearchParams,
  BusinessSearchResult,
  BusinessSummary,
  PaginatedResponse,
} from '../types.ts';
import {
  getAllBusinesses,
  getBusinessBySlug,
  getBusinessCategories,
  getBusinessLocations,
  getMarketParticipationsByBusiness,
} from '../../lib/taxonomy/businesses.ts';
import { getCityById } from '../../lib/taxonomy/locations.ts';
import { getCategoryById } from '../../lib/taxonomy/categories.ts';
import { getMarketById } from '../../lib/taxonomy/markets.ts';
import { canonicalizeText } from '../../lib/taxonomy/normalization.ts';

export class LocalBusinessDataSource implements BusinessDataSource {
  async getPublishedBusinesses(
    params: BusinessSearchParams = {}
  ): Promise<PaginatedResponse<BusinessSummary>> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(params.pageSize || 12, 50));

    const allBusinesses = getAllBusinesses().filter((b) => b.publicationStatus === 'PUBLISHED');

    const filtered = allBusinesses.filter((b) => {
      // 1. Text Query Filter
      if (params.query) {
        const q = canonicalizeText(params.query);
        const nameMatch = canonicalizeText(b.name).includes(q);
        const slugMatch = b.slug.toLowerCase().includes(q);
        const descMatch = canonicalizeText(b.description).includes(q);
        const taglineMatch = b.tagline ? canonicalizeText(b.tagline).includes(q) : false;
        if (!nameMatch && !slugMatch && !descMatch && !taglineMatch) {
          return false;
        }
      }

      // 2. Category Filter
      if (params.categorySlug) {
        const catCats = getBusinessCategories(b.id);
        const matchesCategory = catCats.some((c) => {
          const cat = getCategoryById(c.categoryId);
          return cat && cat.slug.toLowerCase() === params.categorySlug!.toLowerCase();
        });
        if (!matchesCategory) return false;
      }

      // 3. Location Filter
      if (params.locationSlug) {
        const locs = getBusinessLocations(b.id);
        const matchesLocation = locs.some((l) => {
          const city = getCityById(l.cityId);
          return city && city.slug.toLowerCase() === params.locationSlug!.toLowerCase();
        });
        if (!matchesLocation) return false;
      }

      // 4. Verification Status Filter
      if (params.verificationStatus) {
        if (b.verificationStatus !== params.verificationStatus) {
          return false;
        }
      }

      return true;
    });

    // Deterministic ordering: Verified first, then name ascending
    filtered.sort((a, b) => {
      if (a.verificationStatus === 'VERIFIED' && b.verificationStatus !== 'VERIFIED') return -1;
      if (b.verificationStatus === 'VERIFIED' && a.verificationStatus !== 'VERIFIED') return 1;
      return a.name.localeCompare(b.name);
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    const data: BusinessSummary[] = paginated.map((b) => {
      const cats = getBusinessCategories(b.id);
      const primaryCatRel = cats.find((c) => c.isPrimary) || cats[0];
      const primaryCatEntity = primaryCatRel ? getCategoryById(primaryCatRel.categoryId) : undefined;

      const locs = getBusinessLocations(b.id);
      const primaryLocRel = locs.find((l) => l.isPrimary) || locs[0];
      const primaryCityEntity = primaryLocRel ? getCityById(primaryLocRel.cityId) : undefined;

      // Only count participations in published markets
      const participations = getMarketParticipationsByBusiness(b.id).filter((p) => {
        const m = getMarketById(p.marketId);
        return m && m.publicationStatus === 'PUBLISHED' && m.status === 'PUBLISHED';
      });

      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        logo: b.logo,
        website: b.website,
        verificationStatus: b.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED',
        publicationStatus: 'PUBLISHED',
        primaryCategory: primaryCatEntity
          ? {
              id: primaryCatEntity.id,
              name: primaryCatEntity.name,
              slug: primaryCatEntity.slug,
            }
          : undefined,
        primaryLocation: primaryCityEntity
          ? {
              id: primaryCityEntity.id,
              name: primaryCityEntity.name,
              slug: primaryCityEntity.slug,
            }
          : undefined,
        activeMarketCount: participations.length,
        publicUrl: `/businesses/${b.slug}`,
      };
    });

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getPublishedBusinessBySlug(slug: string): Promise<BusinessProfile | null> {
    const b = getBusinessBySlug(slug);
    if (!b || b.publicationStatus !== 'PUBLISHED') {
      return null;
    }

    const cats = getBusinessCategories(b.id);
    const primaryCatRel = cats.find((c) => c.isPrimary) || cats[0];
    const primaryCatEntity = primaryCatRel ? getCategoryById(primaryCatRel.categoryId) : undefined;

    const locs = getBusinessLocations(b.id);
    const primaryLocRel = locs.find((l) => l.isPrimary) || locs[0];
    const primaryCityEntity = primaryLocRel ? getCityById(primaryLocRel.cityId) : undefined;

    // Resolve categories
    const categoriesList = cats
      .map((c) => {
        const entity = getCategoryById(c.categoryId);
        if (!entity || entity.status !== 'ACTIVE') return null;
        return {
          id: entity.id,
          name: entity.name,
          slug: entity.slug,
          publicUrl: `/categories/${entity.slug}`,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    // Resolve locations served
    const locationsList = locs
      .map((l) => {
        const city = getCityById(l.cityId);
        if (!city || city.status !== 'ACTIVE') return null;
        return {
          id: city.id,
          name: city.name,
          slug: city.slug,
          publicUrl: `/${city.slug}`,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    // Resolve market participations (strictly only published markets)
    const rawParticipations = getMarketParticipationsByBusiness(b.id);
    const marketParticipations: BusinessMarketParticipation[] = [];

    for (const p of rawParticipations) {
      const market = getMarketById(p.marketId);
      if (
        !market ||
        market.publicationStatus !== 'PUBLISHED' ||
        market.status !== 'PUBLISHED' ||
        p.status === 'REMOVED'
      ) {
        continue;
      }

      const city = getCityById(market.cityId);
      const cat = getCategoryById(market.categoryId);
      if (!city || !cat) continue;

      marketParticipations.push({
        id: p.id,
        marketId: market.id,
        marketSlug: market.slug,
        marketName: `${city.name} × ${cat.name}`,
        marketUrl: `/${market.slug}`,
        cityName: city.name,
        citySlug: city.slug,
        categoryName: cat.name,
        categorySlug: cat.slug,
        participationStatus: p.status,
        currentPosition: p.currentPosition ?? null,
        qualifyingAmountRupees: p.qualifyingAmountRupees,
      });
    }

    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      legalName: b.legalName,
      tagline: b.tagline,
      description: b.description,
      logo: b.logo,
      website: b.website,
      phone: b.phone,
      email: b.email,
      address: b.address,
      socialLinks: b.socialLinks,
      verificationStatus: b.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED',
      publicationStatus: 'PUBLISHED',
      primaryCategory: primaryCatEntity
        ? {
            id: primaryCatEntity.id,
            name: primaryCatEntity.name,
            slug: primaryCatEntity.slug,
          }
        : undefined,
      primaryLocation: primaryCityEntity
        ? {
            id: primaryCityEntity.id,
            name: primaryCityEntity.name,
            slug: primaryCityEntity.slug,
          }
        : undefined,
      activeMarketCount: marketParticipations.length,
      publicUrl: `/businesses/${b.slug}`,
      categories: categoriesList,
      locationsServed: locationsList,
      marketParticipations,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  }

  async searchPublishedBusinesses(query: string): Promise<BusinessSearchResult[]> {
    const q = canonicalizeText(query);
    if (!q) return [];

    const res = await this.getPublishedBusinesses({ query: q, pageSize: 8 });
    return res.data.map((b) => ({
      type: 'BUSINESS',
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      primaryCategory: b.primaryCategory?.name,
      primaryLocation: b.primaryLocation?.name,
      publicUrl: b.publicUrl,
      isVerified: b.verificationStatus === 'VERIFIED',
      found: true,
      query,
    }));
  }

  async getPublishedBusinessCount(): Promise<number> {
    const res = await this.getPublishedBusinesses({ pageSize: 1 });
    return res.pagination.total;
  }
}
