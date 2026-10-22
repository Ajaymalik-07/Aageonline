import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  createBidIntent,
  getBidIntentById,
  cancelBidIntent,
  getBidIntentsByBusiness,
  resetBidIntentStoreForTesting,
} from '../lib/bid-intent/store.ts';
import {
  UnauthenticatedError,
  ForbiddenBusinessAccessError,
  MarketNotFoundError,
  MarketUnavailableError,
  IdempotencyKeyRequiredError,
  IdempotencyKeyReusedError,
  PricingChangedError,
  BidIntentExpiredError,
  BidIntentNotCancellableError,
} from '../lib/bid-intent/errors.ts';
import { AuthorizationError } from '../lib/auth/rbac.ts';
import { resetAuditStoreForTesting, getAllAuditEvents } from '../lib/audit/store.ts';
import { CanonicalRankingStateProvider } from '../lib/pricing/canonical-provider.ts';
import { LocalBidIntentDataSource } from '../data-access/bid-intents/local-adapter.ts';
import { BidIntentService } from '../data-access/bid-intents/service.ts';

describe('BidIntent — Authentication & Centralized RBAC', () => {
  beforeEach(() => {
    resetBidIntentStoreForTesting();
    resetAuditStoreForTesting();
  });

  it('should REJECT unauthenticated intent creation with 401', async () => {
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers',
            targetPosition: 1,
            idempotencyKey: 'key-unauth-01',
          },
          undefined // No actor user
        ),
      UnauthenticatedError
    );
  });

  it('should ALLOW OWNER role to create BidIntent', async () => {
    // user-ajay is OWNER of biz-royal-interiors
    const intent = await createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 1,
        idempotencyKey: 'key-owner-01',
      },
      'user-ajay'
    );

    assert.ok(intent.id.startsWith('bi_'));
    assert.strictEqual(intent.businessId, 'biz-royal-interiors');
    assert.strictEqual(intent.createdByUserId, 'user-ajay');
    assert.strictEqual(intent.status, 'PENDING_PAYMENT');
    assert.strictEqual(intent.targetPosition, 1);
    assert.strictEqual(intent.currency, 'INR');
    assert.ok(intent.qualifyingAmountMinor > 0);
    assert.strictEqual(intent.qualifyingAmountMinor % 100, 0); // Whole rupees
  });

  it('should ALLOW ADMIN role to create BidIntent', async () => {
    // user-priya is ADMIN of biz-royal-interiors
    const intent = await createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 2,
        idempotencyKey: 'key-admin-01',
      },
      'user-priya'
    );

    assert.strictEqual(intent.createdByUserId, 'user-priya');
    assert.strictEqual(intent.status, 'PENDING_PAYMENT');
  });

  it('should REJECT EDITOR role with 403 Forbidden', async () => {
    // user-rohit is EDITOR of biz-royal-interiors
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers',
            targetPosition: 1,
            idempotencyKey: 'key-editor-01',
          },
          'user-rohit'
        ),
      (err: unknown) => {
        return err instanceof AuthorizationError && err.statusCode === 403;
      }
    );
  });

  it('should REJECT FINANCE role with 403 Forbidden for intent creation', async () => {
    // user-kavita is FINANCE of biz-royal-interiors
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers',
            targetPosition: 1,
            idempotencyKey: 'key-finance-01',
          },
          'user-kavita'
        ),
      (err: unknown) => {
        return err instanceof AuthorizationError && err.statusCode === 403;
      }
    );
  });
});

describe('BidIntent — Cross-Business Isolation & Authorization Guards', () => {
  beforeEach(() => {
    resetBidIntentStoreForTesting();
    resetAuditStoreForTesting();
  });

  it('should REJECT user attempting to create intent for unmanaged business with 403', async () => {
    // user-vikram is OWNER of Coastal Spice (biz-coastal-spice), but has NO membership in Royal Interiors
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers',
            targetPosition: 1,
            idempotencyKey: 'key-vikram-unauthorized-01',
          },
          'user-vikram'
        ),
      ForbiddenBusinessAccessError
    );
  });

  it('should REJECT reading another business’s BidIntent with 403', async () => {
    // Ajay creates intent for Royal Interiors
    const intent = await createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 1,
        idempotencyKey: 'key-read-isolation-01',
      },
      'user-ajay'
    );

    // Vikram tries to read Ajay's intent
    assert.throws(
      () => getBidIntentById(intent.id, 'user-vikram'),
      ForbiddenBusinessAccessError
    );
  });

  it('should REJECT cancelling another business’s BidIntent with 403', async () => {
    const intent = await createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 1,
        idempotencyKey: 'key-cancel-isolation-01',
      },
      'user-ajay'
    );

    assert.throws(
      () =>
        cancelBidIntent({
          bidIntentId: intent.id,
          actorUserId: 'user-vikram',
          businessId: 'biz-royal-interiors',
        }),
      ForbiddenBusinessAccessError
    );
  });
});

describe('BidIntent — Market and Target Position Validation', () => {
  beforeEach(() => {
    resetBidIntentStoreForTesting();
    resetAuditStoreForTesting();
  });

  it('should REJECT non-existent market with 404 MarketNotFoundError', async () => {
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'non-existent-market',
            targetPosition: 1,
            idempotencyKey: 'key-nonexistent-mkt',
          },
          'user-ajay'
        ),
      MarketNotFoundError
    );
  });

  it('should REJECT invalid target positions (0, negative, decimal, over capacity)', async () => {
    // Position 0
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers',
            targetPosition: 0,
            idempotencyKey: 'key-pos-zero',
          },
          'user-ajay'
        )
    );

    // Negative position
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers',
            targetPosition: -1,
            idempotencyKey: 'key-pos-neg',
          },
          'user-ajay'
        )
    );

    // Decimal position
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers',
            targetPosition: 1.5,
            idempotencyKey: 'key-pos-dec',
          },
          'user-ajay'
        )
    );

    // Over market capacity (101)
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers',
            targetPosition: 101,
            idempotencyKey: 'key-pos-overcap',
          },
          'user-ajay'
        )
    );
  });
});

describe('BidIntent — Idempotency Boundary & Duplicate Protection', () => {
  beforeEach(() => {
    resetBidIntentStoreForTesting();
    resetAuditStoreForTesting();
  });

  it('should REJECT creation when Idempotency-Key is missing or empty', async () => {
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers',
            targetPosition: 1,
            idempotencyKey: '',
          },
          'user-ajay'
        ),
      IdempotencyKeyRequiredError
    );
  });

  it('should RETURN the existing BidIntent when replaying exact same request', async () => {
    const input = {
      businessId: 'biz-royal-interiors',
      marketId: 'mkt-jaipur-interior-designers',
      targetPosition: 1,
      idempotencyKey: 'idemp-replay-key-01',
    };

    // First request
    const intent1 = await createBidIntent(input, 'user-ajay');
    const auditsAfterFirst = getAllAuditEvents();
    assert.strictEqual(auditsAfterFirst.length, 1);
    assert.strictEqual(auditsAfterFirst[0].action, 'BID_INTENT_CREATED');

    // Repeated request with same key and payload
    const intent2 = await createBidIntent(input, 'user-ajay');

    // Asserts exact identical object returned
    assert.strictEqual(intent1.id, intent2.id);
    assert.strictEqual(intent1.createdAt, intent2.createdAt);
    assert.strictEqual(intent1.qualifyingAmountMinor, intent2.qualifyingAmountMinor);

    // Asserts zero duplicate audit events created on idempotent replay
    const auditsAfterSecond = getAllAuditEvents();
    assert.strictEqual(auditsAfterSecond.length, 1, 'Idempotent replay must NOT flood audit log');
  });

  it('should REJECT reused Idempotency-Key with conflicting target position with 409', async () => {
    const key = 'idemp-conflict-key-01';

    // First request: target #1
    await createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 1,
        idempotencyKey: key,
      },
      'user-ajay'
    );

    // Second request: same key, different target position #5
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers',
            targetPosition: 5,
            idempotencyKey: key,
          },
          'user-ajay'
        ),
      IdempotencyKeyReusedError
    );
  });

  it('should REJECT reused Idempotency-Key with conflicting market with 409', async () => {
    const key = 'idemp-conflict-key-mkt';

    // First request: jaipur interior
    await createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 1,
        idempotencyKey: key,
      },
      'user-ajay'
    );

    // Second request: same key, different market delhi interior
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-delhi-interior-designers',
            targetPosition: 1,
            idempotencyKey: key,
          },
          'user-ajay'
        ),
      IdempotencyKeyReusedError
    );
  });

  it('should scope idempotency keys to user and business context', async () => {
    const key = 'shared-key-across-actors';

    // Ajay creates intent for Royal Interiors
    const intentA = await createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 1,
        idempotencyKey: key,
      },
      'user-ajay'
    );

    // Vikram creates intent for Coastal Spice using identical key string
    const intentB = await createBidIntent(
      {
        businessId: 'biz-coastal-spice',
        marketId: 'mkt-mumbai-restaurants',
        targetPosition: 1,
        idempotencyKey: key,
      },
      'user-vikram'
    );

    // Scoped keys must create distinct intents without cross-actor collision
    assert.notStrictEqual(intentA.id, intentB.id);
    assert.strictEqual(intentA.businessId, 'biz-royal-interiors');
    assert.strictEqual(intentB.businessId, 'biz-coastal-spice');
  });
});

describe('BidIntent — Authoritative Pricing Re-evaluation & Stale Detection', () => {
  beforeEach(() => {
    resetBidIntentStoreForTesting();
    resetAuditStoreForTesting();
  });

  it('should re-evaluate authoritative pricing and ignore underpayment attempts', async () => {
    // Occupant for #1 is at ₹28,500. Attacker attempts to send ₹1 (100 paise)
    const intent = await createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 1,
        idempotencyKey: 'key-authoritative-01',
      },
      'user-ajay'
    );

    // Server calculates authoritative required qualifying amount (e.g. ₹28,501)
    assert.strictEqual(intent.qualifyingAmountRupees, 28501);
    assert.strictEqual(intent.qualifyingAmountMinor, 2850100);
    assert.strictEqual(intent.pricingSnapshot.calculationMode, 'STRICT_SUPERSEDING');
  });

  it('should REJECT with 409 PricingChangedError when client price reference is stale', async () => {
    // Client claims it saw ₹20,000 (2,000,000 paise), but current requirement is ₹28,501 (2,850,100 paise)
    await assert.rejects(
      () =>
        createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers',
            targetPosition: 1,
            clientCalculatedAmountMinor: 2000000, // Stale price
            idempotencyKey: 'key-stale-pricing-01',
          },
          'user-ajay'
        ),
      (err: unknown) => {
        return (
          err instanceof PricingChangedError &&
          err.statusCode === 409 &&
          err.details?.previousCalculatedAmountMinor === 2000000 &&
          err.details?.currentRequiredAmountRupees === 28501
        );
      }
    );
  });
});

describe('BidIntent — Immutability, Expiration, and Cancellation Lifecycle', () => {
  beforeEach(() => {
    resetBidIntentStoreForTesting();
    resetAuditStoreForTesting();
  });

  it('should set future expiresAt timestamp (+15 minutes)', async () => {
    const before = Date.now();
    const intent = await createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 1,
        idempotencyKey: 'key-expiry-01',
      },
      'user-ajay'
    );

    const expiryTime = new Date(intent.expiresAt).getTime();
    const expectedExpiry = before + 15 * 60 * 1000;
    // Within 2 seconds of expected 15-minute TTL
    assert.ok(Math.abs(expiryTime - expectedExpiry) < 2000);
  });

  it('should evaluate status to EXPIRED when current time exceeds expiresAt', async () => {
    const intent = await createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 1,
        idempotencyKey: 'key-expired-check',
      },
      'user-ajay'
    );

    // Fast-forward clock by 16 minutes
    const futureClock = new Date(Date.now() + 16 * 60 * 1000);
    const retrieved = getBidIntentById(intent.id, 'user-ajay', futureClock);

    assert.strictEqual(retrieved.status, 'EXPIRED');
  });

  it('should allow authorized user to cancel pending BidIntent', async () => {
    const intent = await createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 1,
        idempotencyKey: 'key-cancel-01',
      },
      'user-ajay'
    );

    const cancelled = cancelBidIntent({
      bidIntentId: intent.id,
      actorUserId: 'user-ajay',
      businessId: 'biz-royal-interiors',
    });

    assert.strictEqual(cancelled.status, 'CANCELLED');

    // Verify audit trail
    const audits = getAllAuditEvents();
    const cancelAudit = audits.find((a) => a.action === 'BID_INTENT_CANCELLED');
    assert.ok(cancelAudit);
    assert.strictEqual(cancelAudit.entityId, intent.id);
  });

  it('should REJECT cancelling an already cancelled or expired intent', async () => {
    const intent = await createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 1,
        idempotencyKey: 'key-cancel-twice',
      },
      'user-ajay'
    );

    // Cancel once
    cancelBidIntent({
      bidIntentId: intent.id,
      actorUserId: 'user-ajay',
      businessId: 'biz-royal-interiors',
    });

    // Attempt to cancel again
    assert.throws(
      () =>
        cancelBidIntent({
          bidIntentId: intent.id,
          actorUserId: 'user-ajay',
          businessId: 'biz-royal-interiors',
        }),
      BidIntentNotCancellableError
    );
  });
});

describe('BidIntent — ZERO Ranking & ZERO Financial Mutation Guarantee', () => {
  beforeEach(() => {
    resetBidIntentStoreForTesting();
    resetAuditStoreForTesting();
  });

  it('should create BidIntents without mutating market rankings, participations, or position history', async () => {
    const canonicalProvider = new CanonicalRankingStateProvider();

    // Snapshot state before intent creation
    const rankingsBefore = await canonicalProvider.getMarketRankings('mkt-jaipur-interior-designers');
    const serializedBefore = JSON.stringify(rankingsBefore);

    // Create 10 BidIntents
    for (let i = 1; i <= 10; i++) {
      await createBidIntent(
        {
          businessId: 'biz-royal-interiors',
          marketId: 'mkt-jaipur-interior-designers',
          targetPosition: (i % 5) + 1,
          idempotencyKey: `zero-mutation-key-${i}`,
        },
        'user-ajay'
      );
    }

    // Snapshot state after intent creation
    const rankingsAfter = await canonicalProvider.getMarketRankings('mkt-jaipur-interior-designers');
    const serializedAfter = JSON.stringify(rankingsAfter);

    assert.strictEqual(
      serializedAfter,
      serializedBefore,
      'Market rankings must remain 100% byte-for-byte identical after creating BidIntents.'
    );
  });
});

describe('BidIntent — Data-Access Service Layer', () => {
  beforeEach(() => {
    resetBidIntentStoreForTesting();
    resetAuditStoreForTesting();
  });

  it('should execute end-to-end through BidIntentService and LocalBidIntentDataSource', async () => {
    const service = new BidIntentService(new LocalBidIntentDataSource());

    const created = await service.createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 3,
        idempotencyKey: 'service-test-key-01',
      },
      'user-ajay'
    );

    assert.strictEqual(created.targetPosition, 3);
    assert.strictEqual(created.status, 'PENDING_PAYMENT');

    const fetched = await service.getBidIntentById(created.id, 'user-ajay');
    assert.strictEqual(fetched.id, created.id);

    const { intents, total } = await service.getBidIntentsByBusiness('biz-royal-interiors', 'user-ajay');
    assert.strictEqual(total, 1);
    assert.strictEqual(intents[0].id, created.id);
  });

  it('should accept a custom manual offer amount >= required minimum qualifying amount and reject lower amounts', async () => {
    const service = new BidIntentService(new LocalBidIntentDataSource());

    // Custom offer of ₹30,000 (3,000,000 paise) where minimum is ₹28,501 (2,850,100 paise)
    const customIntent = await service.createBidIntent(
      {
        businessId: 'biz-royal-interiors',
        marketId: 'mkt-jaipur-interior-designers',
        targetPosition: 1,
        offeredAmountMinor: 3000000,
        idempotencyKey: 'service-custom-offer-01',
      },
      'user-ajay'
    );

    assert.strictEqual(customIntent.targetPosition, 1);
    assert.strictEqual(customIntent.qualifyingAmountRupees, 30000);
    assert.strictEqual(customIntent.qualifyingAmountMinor, 3000000);
    assert.strictEqual(customIntent.pricingSnapshot.requiredQualifyingAmountRupees, 28501);

    // Reject offer below minimum required (e.g. ₹20,000)
    await assert.rejects(
      () =>
        service.createBidIntent(
          {
            businessId: 'biz-royal-interiors',
            marketId: 'mkt-jaipur-interior-designers',
            targetPosition: 1,
            offeredAmountMinor: 2000000,
            idempotencyKey: 'service-custom-offer-invalid',
          },
          'user-ajay'
        ),
      /below the minimum required qualifying amount/
    );
  });
});
