/**
 * AageOnline — Market Pricing Calculator
 * Authoritative read-only calculation engine for required qualifying amounts.
 *
 * Implements:
 * 1. Target position validation against market capacity.
 * 2. Strict superseding rule (+100 paise / +₹1).
 * 3. Base initial floor for vacant positions.
 * 4. Informational states when targeting already held or lower positions.
 * 5. Zero mutation guarantee.
 */

import { InvalidMarketError, MarketUnavailableError } from './errors.ts';
import {
  calculateSupersedingAmountMinor,
  calculateSupersedingAmountRupees,
  PRICING_DISCLAIMER,
  validateTargetPosition,
} from './rules.ts';
import type {
  MarketPricingRequest,
  MarketPricingResult,
  RankingStateProvider,
} from './types.ts';

export class PricingCalculator {
  private readonly provider: RankingStateProvider;

  constructor(provider: RankingStateProvider) {
    this.provider = provider;
  }

  async calculateRequiredQualifyingAmount(
    req: MarketPricingRequest
  ): Promise<MarketPricingResult> {
    const market = await this.provider.getMarket(req.marketId);
    if (!market) {
      throw new InvalidMarketError(req.marketId);
    }

    // Verify market is published/active
    const isAvailable =
      market.status === 'PUBLISHED' ||
      market.status === 'ACTIVE' ||
      market.publicationStatus === 'PUBLISHED';

    if (!isAvailable) {
      throw new MarketUnavailableError(req.marketId, market.status || market.publicationStatus);
    }

    const config = await this.provider.getPricingConfig(req.marketId);
    const validatedPosition = validateTargetPosition(req.targetPosition, config.capacity);

    // Resolve requesting business's current position if provided
    let currentBusinessPosition: number | null = null;
    if (req.businessId) {
      currentBusinessPosition = await this.provider.getBusinessMarketPosition(
        req.marketId,
        req.businessId
      );
    }

    // Case 1: Business already holds this target position
    if (
      currentBusinessPosition !== null &&
      currentBusinessPosition === validatedPosition
    ) {
      const rankings = await this.provider.getMarketRankings(req.marketId);
      const currentEntry = rankings.find((r) => r.position === validatedPosition);

      const amountMinor = currentEntry ? currentEntry.qualifyingAmountMinor : config.baseFloorMinor;
      const amountRupees = currentEntry ? currentEntry.qualifyingAmountRupees : config.baseFloorRupees;

      return {
        marketId: market.id,
        marketSlug: market.slug,
        targetPosition: validatedPosition,
        currentPosition: currentBusinessPosition,
        currentBusinessPosition,
        currentQualifyingAmountMinor: amountMinor,
        relevantCurrentQualifyingAmountMinor: amountMinor,
        relevantCurrentQualifyingAmountRupees: amountRupees,
        requiredQualifyingAmountMinor: amountMinor,
        requiredQualifyingAmountRupees: amountRupees,
        currency: 'INR',
        calculationMode: 'ALREADY_HOLDING_POSITION',
        status: 'ALREADY_HOLDING_POSITION',
        reason: `Your business already holds Position #${validatedPosition} in this market.`,
        calculatedAt: new Date().toISOString(),
        disclaimer: PRICING_DISCLAIMER,
      };
    }

    // Case 2: Business already holds a higher visibility position (e.g. holds #2 and targets #5)
    if (
      currentBusinessPosition !== null &&
      currentBusinessPosition < validatedPosition
    ) {
      const rankings = await this.provider.getMarketRankings(req.marketId);
      const targetEntry = rankings.find((r) => r.position === validatedPosition);

      const amountMinor = targetEntry ? targetEntry.qualifyingAmountMinor : config.baseFloorMinor;
      const amountRupees = targetEntry ? targetEntry.qualifyingAmountRupees : config.baseFloorRupees;

      return {
        marketId: market.id,
        marketSlug: market.slug,
        targetPosition: validatedPosition,
        currentPosition: currentBusinessPosition,
        currentBusinessPosition,
        currentQualifyingAmountMinor: amountMinor,
        relevantCurrentQualifyingAmountMinor: amountMinor,
        relevantCurrentQualifyingAmountRupees: amountRupees,
        requiredQualifyingAmountMinor: amountMinor,
        requiredQualifyingAmountRupees: amountRupees,
        currency: 'INR',
        calculationMode: 'LOWER_POSITION',
        status: 'LOWER_POSITION',
        reason: `Targeting a lower visibility position (#${validatedPosition}) does not require a higher qualifying amount than your current position (#${currentBusinessPosition}).`,
        calculatedAt: new Date().toISOString(),
        disclaimer: PRICING_DISCLAIMER,
      };
    }

    // Case 3 & 4: Targeting an occupied or vacant position
    const rankings = await this.provider.getMarketRankings(req.marketId);
    const occupant = rankings.find((r) => r.position === validatedPosition);

    if (occupant) {
      // Position is occupied: Apply strict superseding rule (+100 paise / +₹1)
      const requiredMinor = calculateSupersedingAmountMinor(occupant.qualifyingAmountMinor);
      const requiredRupees = calculateSupersedingAmountRupees(occupant.qualifyingAmountRupees);

      return {
        marketId: market.id,
        marketSlug: market.slug,
        targetPosition: validatedPosition,
        currentPosition: currentBusinessPosition,
        currentBusinessPosition,
        currentQualifyingAmountMinor: occupant.qualifyingAmountMinor,
        relevantCurrentQualifyingAmountMinor: occupant.qualifyingAmountMinor,
        relevantCurrentQualifyingAmountRupees: occupant.qualifyingAmountRupees,
        occupantBusinessName: occupant.businessName,
        requiredQualifyingAmountMinor: requiredMinor,
        requiredQualifyingAmountRupees: requiredRupees,
        currency: 'INR',
        calculationMode: 'STRICT_SUPERSEDING',
        status: 'CALCULATED',
        reason: `Required amount must strictly exceed the qualifying amount of ₹${occupant.qualifyingAmountRupees.toLocaleString(
          'en-IN'
        )} currently associated with Position #${validatedPosition} by at least ₹1.`,
        calculatedAt: new Date().toISOString(),
        disclaimer: PRICING_DISCLAIMER,
      };
    }

    // Position is vacant: Use configured initial floor
    return {
      marketId: market.id,
      marketSlug: market.slug,
      targetPosition: validatedPosition,
      currentPosition: currentBusinessPosition,
      currentBusinessPosition,
      currentQualifyingAmountMinor: null,
      relevantCurrentQualifyingAmountMinor: null,
      relevantCurrentQualifyingAmountRupees: null,
      requiredQualifyingAmountMinor: config.baseFloorMinor,
      requiredQualifyingAmountRupees: config.baseFloorRupees,
      currency: 'INR',
      calculationMode: 'INITIAL_FLOOR',
      status: 'CALCULATED',
      reason: `Position #${validatedPosition} is currently unoccupied. Required amount is determined by this market's base entry floor of ₹${config.baseFloorRupees.toLocaleString(
        'en-IN'
      )}.`,
      calculatedAt: new Date().toISOString(),
      disclaimer: PRICING_DISCLAIMER,
    };
  }
}
