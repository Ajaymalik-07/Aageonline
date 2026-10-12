/**
 * AageOnline — Ranking Settlement Plan Calculator
 *
 * Pure, deterministic calculation of ranking mutation plans:
 * - Current market ranking state re-evaluation
 * - Strict greater-than competitive displacement check
 * - Dense and sparse ladder insertion algorithms
 * - Existing business upward/downward movement
 * - Same-position no-op detection
 * - Atomic validation of final position uniqueness
 */

import type {
  PositionChange,
  RankingMutationPlan,
} from '../../types/ranking-settlement.ts';
import {
  DEFAULT_BASE_FLOOR_RUPEES,
  DEFAULT_MARKET_CAPACITY,
  canDisplaceIncumbent,
  isPositionWithinCapacity,
  validateWholeRupeeAmount,
} from './rules.ts';
import {
  TargetBeyondCapacityError,
  TargetNoLongerAchievableError,
} from './errors.ts';

export interface RankedMarketOccupant {
  position: number;
  businessId: string;
  qualifyingAmountRupees: number;
}

export interface SettlementCalculationInput {
  marketId: string;
  targetBusinessId: string;
  targetPosition: number;
  paidAmountMinor: number;
  paidAmountRupees: number;
  currentRankings: RankedMarketOccupant[];
  marketCapacity?: number;
  baseFloorRupees?: number;
}

/**
 * Pure calculation function that determines the exact set of position mutations
 * required to settle a confirmed payment into a market.
 *
 * DOES NOT MUTATE THE DATABASE. Returns an immutable RankingMutationPlan.
 */
export function calculateSettlementPlan(
  input: SettlementCalculationInput
): RankingMutationPlan {
  const {
    marketId,
    targetBusinessId,
    targetPosition,
    paidAmountMinor,
    paidAmountRupees,
    currentRankings,
    marketCapacity = DEFAULT_MARKET_CAPACITY,
    baseFloorRupees = DEFAULT_BASE_FLOOR_RUPEES,
  } = input;

  // 1. Whole Rupee Invariant Validation
  if (!validateWholeRupeeAmount(paidAmountMinor)) {
    throw new Error(
      `Invalid paid amount minor units "${paidAmountMinor}". Amount must be a positive integer whole rupee multiple.`
    );
  }

  // 2. Capacity Bound Validation
  if (!isPositionWithinCapacity(targetPosition, marketCapacity)) {
    throw new TargetBeyondCapacityError(targetPosition, marketCapacity);
  }

  // 3. Current Position of Target Business
  const existingEntry = currentRankings.find((r) => r.businessId === targetBusinessId);
  const previousPosition = existingEntry ? existingEntry.position : null;

  // 4. Same-Position No-Op Detection
  if (previousPosition !== null && previousPosition === targetPosition) {
    return {
      marketId,
      targetBusinessId,
      previousPosition,
      targetPosition,
      finalPosition: targetPosition,
      qualifyingAmountMinor: paidAmountMinor,
      qualifyingAmountRupees: paidAmountRupees,
      isNoOp: true,
      positionChanges: [],
    };
  }

  // 5. Occupant Displacement & Qualification Check
  const currentOccupant = currentRankings.find((r) => r.position === targetPosition);

  if (currentOccupant && currentOccupant.businessId !== targetBusinessId) {
    // Current occupant exists: new payment must be STRICTLY GREATER than current occupant's qualifying amount
    if (!canDisplaceIncumbent(paidAmountRupees, currentOccupant.qualifyingAmountRupees)) {
      throw new TargetNoLongerAchievableError(
        targetPosition,
        paidAmountRupees,
        currentOccupant.qualifyingAmountRupees
      );
    }
  } else if (!currentOccupant) {
    // Vacant position: must satisfy market's minimum base floor
    if (paidAmountRupees < baseFloorRupees) {
      throw new TargetNoLongerAchievableError(
        targetPosition,
        paidAmountRupees,
        baseFloorRupees
      );
    }
  }

  // 6. Calculate Position Shifts
  const positionChanges: PositionChange[] = [];

  // Add target business movement
  positionChanges.push({
    businessId: targetBusinessId,
    previousPosition,
    newPosition: targetPosition,
    isTargetBusiness: true,
  });

  if (previousPosition === null) {
    // Case A: Target business is NEW to the market
    // Shift all occupied positions at or below targetPosition down by 1
    for (const occupant of currentRankings) {
      if (occupant.position >= targetPosition && occupant.businessId !== targetBusinessId) {
        const shiftedPosition = occupant.position + 1;
        if (shiftedPosition <= marketCapacity) {
          positionChanges.push({
            businessId: occupant.businessId,
            previousPosition: occupant.position,
            newPosition: shiftedPosition,
            isTargetBusiness: false,
          });
        }
      }
    }
  } else if (targetPosition < previousPosition) {
    // Case B: Existing business moving UPWARD (e.g. #10 -> #5)
    // Shift occupied positions in range [targetPosition, previousPosition - 1] down by 1
    for (const occupant of currentRankings) {
      if (
        occupant.businessId !== targetBusinessId &&
        occupant.position >= targetPosition &&
        occupant.position < previousPosition
      ) {
        const shiftedPosition = occupant.position + 1;
        if (shiftedPosition <= marketCapacity) {
          positionChanges.push({
            businessId: occupant.businessId,
            previousPosition: occupant.position,
            newPosition: shiftedPosition,
            isTargetBusiness: false,
          });
        }
      }
    }
  } else {
    // Case C: Existing business moving DOWNWARD (e.g. #3 -> #5)
    // Shift occupied positions in range [previousPosition + 1, targetPosition] up by 1
    for (const occupant of currentRankings) {
      if (
        occupant.businessId !== targetBusinessId &&
        occupant.position > previousPosition &&
        occupant.position <= targetPosition
      ) {
        const shiftedPosition = occupant.position - 1;
        positionChanges.push({
          businessId: occupant.businessId,
          previousPosition: occupant.position,
          newPosition: shiftedPosition,
          isTargetBusiness: false,
        });
      }
    }
  }

  // 7. Verify Invariant: No Duplicate New Positions
  const assignedPositions = new Set<number>();
  for (const change of positionChanges) {
    if (assignedPositions.has(change.newPosition)) {
      throw new Error(
        `Ranking calculation resulted in duplicate position #${change.newPosition} in market "${marketId}".`
      );
    }
    assignedPositions.add(change.newPosition);
  }

  return {
    marketId,
    targetBusinessId,
    previousPosition,
    targetPosition,
    finalPosition: targetPosition,
    qualifyingAmountMinor: paidAmountMinor,
    qualifyingAmountRupees: paidAmountRupees,
    isNoOp: false,
    positionChanges,
  };
}
