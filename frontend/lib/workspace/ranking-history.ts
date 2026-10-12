/**
 * AageOnline — Business Workspace Ranking History Domain Service
 *
 * Implements server-side authorized queries for business ranking movement history:
 * - Strict business membership resolution and authorization
 * - Cross-business isolation (user cannot inspect other businesses' history)
 * - Clear, neutral wording without objective quality claims
 * - Paid visibility disclosure permanently attached
 * - Bounded pagination and filtering
 */

import { getMembership } from '../memberships/store.ts';
import { PostgresPositionHistoryRepository } from '../db/repositories/position-history-repository.ts';
import { getPositionHistoryByBusiness } from '../ranking-settlement/position-history.ts';
import { getMarketById } from '../taxonomy/markets.ts';
import { getCityById } from '../taxonomy/locations.ts';
import { getCategoryById } from '../taxonomy/categories.ts';
import { isDatabaseConfigured } from '../db/client.ts';

const positionHistoryRepo = new PostgresPositionHistoryRepository();

export interface RankingHistoryItem {
  id: string;
  businessId: string;
  marketId: string;
  marketName: string;
  marketSlug: string;
  previousPosition: number | null;
  newPosition: number;
  direction: 'UP' | 'DOWN' | 'ENTRY' | 'NO_CHANGE';
  cause: string;
  movementText: string;
  disclosure: string;
  createdAt: string;
}

export interface GetBusinessRankingHistoryOptions {
  marketId?: string;
  direction?: 'UP' | 'DOWN' | 'ENTRY' | 'ALL';
  page?: number;
  limit?: number;
}

export interface BusinessRankingHistoryResponse {
  history: RankingHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export async function getBusinessRankingHistory(
  businessId: string,
  userId: string,
  options: GetBusinessRankingHistoryOptions = {}
): Promise<BusinessRankingHistoryResponse> {
  // 1. Authorize user membership in business
  const membership = getMembership(businessId, userId);
  if (!membership || membership.status !== 'ACTIVE') {
    const error = new Error(`Access Denied: You are not an active member of business "${businessId}".`);
    (error as unknown as { statusCode: number }).statusCode = 403;
    throw error;
  }

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));

  // 2. Load position history records
  let allRecords = isDatabaseConfigured()
    ? await positionHistoryRepo.getHistoryByBusiness(businessId, 500)
    : getPositionHistoryByBusiness(businessId);

  // 3. Filter by market if specified
  if (options.marketId) {
    allRecords = allRecords.filter((r) => r.marketId === options.marketId);
  }

  // 4. Map into enriched domain presentation items
  const mappedItems: RankingHistoryItem[] = allRecords.map((r) => {
    const market = getMarketById(r.marketId);
    let marketName = r.marketId;
    let marketSlug = '';
    if (market) {
      marketSlug = market.slug;
      const city = getCityById(market.cityId);
      const cat = getCategoryById(market.categoryId);
      marketName = city && cat ? `${city.name} · ${cat.name}` : market.slug;
    }

    const direction: RankingHistoryItem['direction'] =
      r.previousPosition === null
        ? 'ENTRY'
        : r.newPosition < r.previousPosition
        ? 'UP'
        : r.newPosition > r.previousPosition
        ? 'DOWN'
        : 'NO_CHANGE';

    let movementText: string;
    if (r.previousPosition === null) {
      movementText = `Entered market at position #${r.newPosition} following verified visibility settlement.`;
    } else if (direction === 'UP') {
      movementText = `Advanced from position #${r.previousPosition} to position #${r.newPosition} following verified visibility settlement.`;
    } else if (direction === 'DOWN') {
      movementText = `Moved from position #${r.previousPosition} to position #${r.newPosition} following an updated market ranking settlement.`;
    } else {
      movementText = `Maintained position #${r.newPosition}.`;
    }

    return {
      id: r.id,
      businessId: r.businessId,
      marketId: r.marketId,
      marketName,
      marketSlug,
      previousPosition: r.previousPosition,
      newPosition: r.newPosition,
      direction,
      cause: r.cause,
      movementText,
      disclosure: 'Placement reflects paid competitive visibility positioning and does not represent an endorsement or objective quality assessment.',
      createdAt: r.createdAt,
    };
  });

  // 5. Filter by direction if specified
  let filtered = mappedItems;
  if (options.direction && options.direction !== 'ALL') {
    filtered = mappedItems.filter((i) => i.direction === options.direction);
  }

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    history: paginated,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
    },
  };
}
