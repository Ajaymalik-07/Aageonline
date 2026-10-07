import { describe, it } from 'node:test';
import assert from 'node:assert';
import { APIClientError } from '../lib/api/client.ts';
import { validateBidAmount } from '../lib/bidding/rules.ts';

describe('Concurrency & Race Condition State Handling', () => {
  it('should detect when another bidder has moved ahead during race condition', () => {
    // User A viewed position #1 at ₹20,000 (2,000,000 paise)
    const initialQualifying = 2000000;
    const userAOffered = 2000100; // ₹20,001

    // User A initially qualified
    const initialValidation = validateBidAmount(userAOffered, initialQualifying);
    assert.strictEqual(initialValidation.isValid, true);

    // User B submitted ₹25,000 before User A's transaction reached server
    const serverUpdatedQualifying = 2500000;

    // Server re-evaluates User A's submission against updated state
    const raceValidation = validateBidAmount(userAOffered, serverUpdatedQualifying);
    assert.strictEqual(raceValidation.isValid, false);
    assert.strictEqual(raceValidation.minimumRequiredMinor, 2500100);
    assert.match(raceValidation.errorMessage || '', /is lower than current/);
  });

  it('should properly format and structure APIClientError', () => {
    const error = new APIClientError(409, {
      code: 'TARGET_POSITION_SUPERSEDED',
      message: 'Another business has placed a higher qualifying bid.',
      requestId: 'req-test-123',
    });

    assert.strictEqual(error.status, 409);
    assert.strictEqual(error.code, 'TARGET_POSITION_SUPERSEDED');
    assert.strictEqual(error.requestId, 'req-test-123');
    assert.strictEqual(error.message, 'Another business has placed a higher qualifying bid.');
  });
});
