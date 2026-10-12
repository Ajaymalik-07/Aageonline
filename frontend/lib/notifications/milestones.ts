/**
 * AageOnline — Ranking Movement Downward Milestone Definitions & Evaluator
 *
 * Implements strict milestone threshold evaluation:
 * #1  → #5
 * #5  → #10
 * #10 → #20
 * #20 → #30
 * #30 → #50
 * #50 → #75
 * #75 → #100
 *
 * Non-negotiable rules:
 * - Only downward movements (previousPosition !== null && newPosition > previousPosition) can trigger drop milestones.
 * - Same position (no-op) or upward movement NEVER triggers drop milestones.
 * - Businesses already below a threshold do not receive false milestone alerts.
 * - Multi-threshold crossing selects the primary (deepest) threshold with consolidated details.
 * - Paid visibility disclosure is permanently attached.
 */

import type {
  MilestoneDefinition,
  NotificationMilestoneKey,
} from '../../types/notification.ts';

export const DOWNWARD_MILESTONES: readonly MilestoneDefinition[] = [
  { key: '#1_TO_#5', threshold: 5, label: 'Top 5' },
  { key: '#5_TO_#10', threshold: 10, label: 'Top 10' },
  { key: '#10_TO_#20', threshold: 20, label: 'Top 20' },
  { key: '#20_TO_#30', threshold: 30, label: 'Top 30' },
  { key: '#30_TO_#50', threshold: 50, label: 'Top 50' },
  { key: '#50_TO_#75', threshold: 75, label: 'Top 75' },
  { key: '#75_TO_#100', threshold: 100, label: 'Top 100' },
] as const;

export interface MilestoneEvaluationResult {
  isDownward: boolean;
  crossedMilestones: MilestoneDefinition[];
  primaryMilestone: MilestoneDefinition | null;
  notificationTitle: string;
  notificationMessage: string;
}

/**
 * Evaluates whether a position change crosses any downward-movement milestone.
 */
export function evaluateDownwardMilestones(
  previousPosition: number | null,
  newPosition: number,
  marketName?: string
): MilestoneEvaluationResult | null {
  // 1. Must have a previous position and must strictly be downward movement (higher rank number)
  if (previousPosition === null || newPosition <= previousPosition) {
    return null;
  }

  // 2. Identify all thresholds crossed: previousPosition <= threshold AND newPosition > threshold
  const crossedMilestones = DOWNWARD_MILESTONES.filter(
    (m) => previousPosition <= m.threshold && newPosition > m.threshold
  );

  if (crossedMilestones.length === 0) {
    return null;
  }

  // 3. Deepest crossed milestone (highest threshold value) is the primary milestone
  const primaryMilestone = crossedMilestones[crossedMilestones.length - 1];

  const marketLabel = marketName ? `in ${marketName}` : 'in your market';
  const notificationTitle = `Market Ranking Update: Dropped below ${primaryMilestone.label}`;
  const notificationMessage =
    `Your business moved from position #${previousPosition} to position #${newPosition} ${marketLabel} following an updated ranking settlement. ` +
    `Transparency Notice: Visibility rankings are paid competitive positions and do not represent objective quality or endorsements.`;

  return {
    isDownward: true,
    crossedMilestones,
    primaryMilestone,
    notificationTitle,
    notificationMessage,
  };
}
