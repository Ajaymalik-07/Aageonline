/**
 * AageOnline — Market Resolution Engine
 * Handles resolution of dynamic route requests (location + category),
 * canonical entity lookups, lifecycle verification, and automated demand discovery.
 */

import { findMatchingCity, findMatchingCategory, generateSlug } from './normalization.ts';
import { getCityById, getStateById, getCountryById } from './locations.ts';
import { getCategoryById } from './categories.ts';
import {
  getMarketByCityAndCategory,
  getMarketBySlug,
  createMarket,
} from './markets.ts';
import { recordDiscoveryRequest } from './discovery.ts';
import type { MarketResolutionResult } from '../../types/taxonomy';

export interface ResolveMarketOptions {
  autoDiscover?: boolean;
  clientId?: string;
}

/**
 * Authoritative market resolution logic.
 *
 * Scenarios:
 * 1. Existing City + Existing Category + Existing Market -> Returns Market, verifies publication status.
 * 2. Existing City + Existing Category + Missing Market -> (If autoDiscover) Creates DISCOVERED draft market + logs discovery.
 * 3. Missing City or Missing Category -> Logs discovery request (NEEDS_REVIEW) with demand count increment.
 */
export function resolveMarket(
  locationInput: string,
  categoryInput: string,
  options: ResolveMarketOptions = { autoDiscover: true }
): MarketResolutionResult {
  const cleanLocation = locationInput.trim();
  const cleanCategory = categoryInput.trim();

  const city = findMatchingCity(cleanLocation);
  const category = findMatchingCategory(cleanCategory);

  // Scenario: Unknown City and/or Unknown Category
  if (!city || !category) {
    if (options.autoDiscover) {
      if (!city) {
        recordDiscoveryRequest({
          requestType: 'CITY',
          rawInput: cleanLocation,
          clientId: options.clientId,
        });
      }
      if (!category) {
        recordDiscoveryRequest({
          requestType: 'CATEGORY',
          rawInput: cleanCategory,
          clientId: options.clientId,
        });
      }
      // Record overall market demand intent
      recordDiscoveryRequest({
        requestType: 'MARKET',
        rawInput: `${cleanLocation} x ${cleanCategory}`,
        cityId: city?.id,
        categoryId: category?.id,
        clientId: options.clientId,
      });
    }

    const missingParts = [
      !city ? `Location "${cleanLocation}"` : null,
      !category ? `Category "${cleanCategory}"` : null,
    ]
      .filter(Boolean)
      .join(' and ');

    return {
      found: false,
      city,
      category,
      isPublished: false,
      isIndexable: false,
      contentReady: false,
      discoveryCreated: !!options.autoDiscover,
      reason: `${missingParts} not recognized in canonical taxonomy.`,
    };
  }

  const state = getStateById(city.stateId);
  const country = getCountryById(city.countryId);

  // Look for existing market
  let market = getMarketByCityAndCategory(city.id, category.id);

  if (!market) {
    // Check by canonical slug
    const canonicalSlug = `${city.slug}/${category.slug}`;
    market = getMarketBySlug(canonicalSlug);
  }

  if (!market) {
    // Both city and category exist, but market record does not exist
    if (options.autoDiscover) {
      const marketId = `mkt-${city.slug}-${category.slug}`;
      market = createMarket({
        id: marketId,
        cityId: city.id,
        categoryId: category.id,
        slug: `${city.slug}/${category.slug}`,
        status: 'DISCOVERED',
        publicationStatus: 'DRAFT',
        indexabilityStatus: 'NOINDEX',
        contentStatus: 'MISSING',
        totalBusinesses: 0,
        activePositions: 0,
        topQualifyingAmountMinor: 100000, // ₹1,000 base entry floor
      });

      // Record discovery demand
      recordDiscoveryRequest({
        requestType: 'MARKET',
        rawInput: `${city.name} x ${category.name}`,
        cityId: city.id,
        categoryId: category.id,
        marketId: market.id,
        clientId: options.clientId,
      });

      return {
        found: true,
        market,
        city,
        state,
        country,
        category,
        isPublished: false, // DRAFT markets are not published
        isIndexable: false, // NOINDEX
        contentReady: false,
        discoveryCreated: true,
        reason: 'Market newly discovered and created in DRAFT/NOINDEX status.',
      };
    }

    return {
      found: false,
      city,
      state,
      country,
      category,
      isPublished: false,
      isIndexable: false,
      contentReady: false,
      reason: `Market "${city.name} x ${category.name}" does not exist.`,
    };
  }

  // Market exists: evaluate lifecycle invariants
  const isPublished = market.publicationStatus === 'PUBLISHED' && market.status === 'PUBLISHED';
  const isIndexable = isPublished && market.indexabilityStatus === 'INDEXABLE';
  const contentReady =
    market.contentStatus === 'READY' || market.contentStatus === 'APPROVED';

  return {
    found: true,
    market,
    city,
    state,
    country,
    category,
    isPublished,
    isIndexable,
    contentReady,
  };
}
