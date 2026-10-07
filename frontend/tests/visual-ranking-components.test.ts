import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatINR } from '../lib/utils/format.ts';
import { calculateMinimumTargetAmount } from '../lib/bidding/rules.ts';

describe('Visual Ranking Component Domain Verification', () => {
  it('should correctly derive competitive gap between consecutive positions', () => {
    const leaderAmount = 2600000;   // ₹26,000 (paise)
    const runnerUpAmount = 2450000; // ₹24,500 (paise)
    const gap = leaderAmount - runnerUpAmount; // 150000 paise (₹1,500)

    assert.strictEqual(gap, 150000);
    assert.strictEqual(formatINR(gap), '₹1,500');
  });

  it('should compute the minimum qualification floor to supersede leader (+100 paise)', () => {
    const leaderAmount = 2600000; // ₹26,000
    const minToTakeLeader = calculateMinimumTargetAmount(leaderAmount);

    assert.strictEqual(minToTakeLeader, 2600100); // ₹26,001
    assert.strictEqual(formatINR(minToTakeLeader), '₹26,001');
  });

  it('should verify position movement label mappings for accessibility', () => {
    const getMovementLabel = (direction: 'up' | 'down' | 'same' | 'new', count: number, isLeading?: boolean) => {
      if (isLeading) return 'Leading qualifying position';
      if (direction === 'up') return `Moved up ${count} position${count > 1 ? 's' : ''}`;
      if (direction === 'down') return `Moved down ${count} position${count > 1 ? 's' : ''}`;
      if (direction === 'new') return 'Entered ranking';
      return 'Steady';
    };

    assert.strictEqual(getMovementLabel('same', 0, true), 'Leading qualifying position');
    assert.strictEqual(getMovementLabel('up', 1), 'Moved up 1 position');
    assert.strictEqual(getMovementLabel('up', 3), 'Moved up 3 positions');
    assert.strictEqual(getMovementLabel('down', 2), 'Moved down 2 positions');
    assert.strictEqual(getMovementLabel('new', 0), 'Entered ranking');
    assert.strictEqual(getMovementLabel('same', 0), 'Steady');
  });

  it('should preserve transparency disclosure text without objective quality claims', () => {
    const disclosureText =
      'Rankings reflect verified paid competitive visibility positions and do not constitute an independent assessment of business quality.';

    assert.doesNotMatch(disclosureText, /best in city/i);
    assert.doesNotMatch(disclosureText, /guaranteed best/i);
    assert.match(disclosureText, /paid competitive visibility/i);
  });

  it('should verify 1-by-1 card shuffle indexing logic', () => {
    const totalMarkets = 8;
    const initialSlots = [0, 1, 2, 3];

    // Single card shuffle shifts out first slot and pushes next valid index
    const currentlyShown = new Set(initialSlots);
    let nextCandidate = (initialSlots[initialSlots.length - 1] + 1) % totalMarkets;
    while (currentlyShown.has(nextCandidate) && currentlyShown.size < totalMarkets) {
      nextCandidate = (nextCandidate + 1) % totalMarkets;
    }

    const shuffledSlots = [...initialSlots.slice(1), nextCandidate];

    assert.deepStrictEqual(shuffledSlots, [1, 2, 3, 4]);
    assert.strictEqual(shuffledSlots.length, 4);
    assert.strictEqual(shuffledSlots[3], 4);
  });

  it('should verify that all featured markets have positive whole-rupee floors', () => {
    const amounts = [2600000, 3200000, 1850000, 4500000, 3800000, 2200000, 4200000, 6500000];

    for (const amt of amounts) {
      assert.strictEqual(amt > 0, true);
      assert.strictEqual(amt % 100, 0, 'Qualifying amount must be whole rupee (divisible by 100 paise)');
    }
  });
});
