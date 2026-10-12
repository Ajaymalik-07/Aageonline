'use client';

import React, { useState, useRef } from 'react';
import type { MarketPricingResult } from '../../lib/pricing/types.ts';
import type { BidIntent } from '../../types/bid-intent.ts';
import type { PaymentOrder, PayUCheckoutPayload } from '../../types/payment.ts';
import type { RankingSettlement } from '../../types/ranking-settlement.ts';
import { pricingService } from '../../data-access/pricing/index.ts';
import { bidIntentService } from '../../data-access/bid-intents/index.ts';
import { paymentService } from '../../data-access/payments/index.ts';
import { rankingSettlementService } from '../../data-access/ranking-settlements/index.ts';
import { PricingChangedError } from '../../lib/bid-intent/errors.ts';

interface MarketPositionPricingCalculatorProps {
  marketId: string;
  marketName: string;
  currentPosition?: number | null;
  businessId?: string;
}

export function MarketPositionPricingCalculator({
  marketId,
  marketName,
  currentPosition,
  businessId,
}: MarketPositionPricingCalculatorProps) {
  const [targetPositionInput, setTargetPositionInput] = useState<string>('1');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<MarketPricingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bid Intent State
  const [createdIntent, setCreatedIntent] = useState<BidIntent | null>(null);
  const [creatingIntent, setCreatingIntent] = useState<boolean>(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [pricingChangedNotice, setPricingChangedNotice] = useState<string | null>(null);

  // Request correlation counter to prevent stale async responses
  const activeRequestIdRef = useRef<number>(0);
  const idempotencyKeyRef = useRef<string | null>(null);

  const handleCalculate = async (requestedPos?: number) => {
    const posToCalculate = requestedPos !== undefined ? requestedPos : parseInt(targetPositionInput.trim(), 10);

    if (isNaN(posToCalculate) || posToCalculate <= 0) {
      setError('Please enter a valid positive whole position integer (e.g. 1, 2, 3).');
      return;
    }

    const currentRequestId = ++activeRequestIdRef.current;
    setLoading(true);
    setError(null);
    setIntentError(null);
    setPricingChangedNotice(null);
    idempotencyKeyRef.current = null; // New calculation starts a new intent cycle

    try {
      const res = await pricingService.calculateRequiredQualifyingAmount({
        marketId,
        targetPosition: posToCalculate,
        businessId,
      });

      // Verify request correlation (discard if stale)
      if (currentRequestId === activeRequestIdRef.current) {
        setResult(res);
      }
    } catch (err: unknown) {
      if (currentRequestId === activeRequestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Could not calculate qualifying amount.');
      }
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCreateIntent = async () => {
    if (!result) return;
    if (!businessId) {
      setIntentError('Business context required to create a visibility intent. Please log in with an authorized account.');
      return;
    }

    // Persist idempotency key across retries of the same intent attempt
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = `ik_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    setCreatingIntent(true);
    setIntentError(null);
    setPricingChangedNotice(null);

    try {
      const intent = await bidIntentService.createBidIntent({
        businessId,
        marketId,
        targetPosition: result.targetPosition,
        clientCalculatedAmountMinor: result.requiredQualifyingAmountMinor,
        idempotencyKey: idempotencyKeyRef.current,
      });

      setCreatedIntent(intent);
    } catch (err: unknown) {
      if (err instanceof PricingChangedError) {
        setPricingChangedNotice(err.message);
      } else {
        setIntentError(err instanceof Error ? err.message : 'Could not create visibility intent.');
      }
    } finally {
      setCreatingIntent(false);
    }
  };

  const handleCancelIntent = async () => {
    if (!createdIntent || !businessId) return;

    setCreatingIntent(true);
    setIntentError(null);

    try {
      const cancelled = await bidIntentService.cancelBidIntent({
        bidIntentId: createdIntent.id,
        actorUserId: '',
        businessId,
      });
      setCreatedIntent(cancelled);
    } catch (err: unknown) {
      setIntentError(err instanceof Error ? err.message : 'Could not cancel visibility intent.');
    } finally {
      setCreatingIntent(false);
    }
  };

  // Payment Order State
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [checkoutPayload, setCheckoutPayload] = useState<PayUCheckoutPayload | null>(null);
  const [initiatingPayment, setInitiatingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Ranking Settlement State (Milestone 0.13.0)
  const [settlement, setSettlement] = useState<RankingSettlement | null>(null);
  const [settlingRanking, setSettlingRanking] = useState<boolean>(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);

  const handleInitiatePayment = async () => {
    if (!createdIntent || createdIntent.status !== 'PENDING_PAYMENT') return;

    setInitiatingPayment(true);
    setPaymentError(null);

    const idempotencyKey = `pay_${createdIntent.id}_${Date.now()}`;

    try {
      const orderResult = await paymentService.createPaymentOrder({
        bidIntentId: createdIntent.id,
        idempotencyKey,
        actorUserId: '', // Derived server-side from active session
      });

      setPaymentOrder(orderResult.paymentOrder);
      setCheckoutPayload(orderResult.checkout);
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'Failed to initiate PayU payment.');
    } finally {
      setInitiatingPayment(false);
    }
  };

  const handleSettleRanking = async () => {
    if (!paymentOrder) return;

    setSettlingRanking(true);
    setSettlementError(null);

    try {
      const res = await rankingSettlementService.settleRanking({
        paymentOrderId: paymentOrder.id,
        actorUserId: '',
      });
      setSettlement(res.settlement);
    } catch (err: unknown) {
      setSettlementError(err instanceof Error ? err.message : 'Ranking settlement failed.');
    } finally {
      setSettlingRanking(false);
    }
  };

  const formattedTime = result ? new Date(result.calculatedAt).toLocaleTimeString('en-IN') : null;

  return (
    <div
      style={{
        backgroundColor: '#071526',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        marginTop: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#EA580C',
              display: 'inline-block',
            }}
          />
          <span style={{ fontWeight: 800, fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#FB923C' }}>
            Position Pricing Calculator
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
          Read-only • No financial mutation
        </span>
      </div>

      <p style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--font-size-xs)', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5 }}>
        Calculate the exact minimum qualifying amount required to target any visibility position in{' '}
        <strong style={{ color: '#FFFFFF' }}>{marketName}</strong>.
      </p>

      {/* Target Position Input & Trigger */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor={`target-pos-${marketId}`} style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)' }}>
            Target Position:
          </label>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '10px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700, fontSize: 'var(--font-size-xs)' }}>
              #
            </span>
            <input
              id={`target-pos-${marketId}`}
              type="number"
              min={1}
              max={100}
              step={1}
              value={targetPositionInput}
              onChange={(e) => {
                setTargetPositionInput(e.target.value);
                // Invalidate existing result if position changes
                if (result && parseInt(e.target.value, 10) !== result.targetPosition) {
                  setResult(null);
                }
              }}
              style={{
                width: '70px',
                padding: '8px 10px 8px 24px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: '#0B1F33',
                color: '#FFFFFF',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Quick Position Selectors */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[1, 2, 3, 5, 10].map((quickPos) => (
            <button
              key={quickPos}
              type="button"
              onClick={() => {
                setTargetPositionInput(String(quickPos));
                handleCalculate(quickPos);
              }}
              style={{
                backgroundColor: targetPositionInput === String(quickPos) ? 'rgba(234, 88, 12, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: targetPositionInput === String(quickPos) ? '1px solid #EA580C' : '1px solid rgba(255, 255, 255, 0.1)',
                color: targetPositionInput === String(quickPos) ? '#FB923C' : 'rgba(255, 255, 255, 0.8)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              #{quickPos}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleCalculate()}
          disabled={loading || !targetPositionInput}
          style={{
            backgroundColor: '#EA580C',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            fontSize: 'var(--font-size-xs)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginLeft: 'auto',
          }}
        >
          {loading ? 'Calculating...' : 'Calculate Required Amount →'}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 'var(--space-3)',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            color: '#F87171',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          {error}
        </div>
      )}

      {/* Calculation Result Area */}
      {result && !loading && (
        <div
          style={{
            marginTop: 'var(--space-4)',
            backgroundColor: '#0B1F33',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', fontWeight: 700 }}>
                Targeting Position #{result.targetPosition}
              </span>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                ₹{result.requiredQualifyingAmountRupees.toLocaleString('en-IN')}
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', marginLeft: '6px' }}>
                  ({result.currency})
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '4px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor:
                  result.calculationMode === 'STRICT_SUPERSEDING'
                    ? 'rgba(234, 88, 12, 0.2)'
                    : result.calculationMode === 'INITIAL_FLOOR'
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)',
                color:
                  result.calculationMode === 'STRICT_SUPERSEDING'
                    ? '#FB923C'
                    : result.calculationMode === 'INITIAL_FLOOR'
                    ? '#60A5FA'
                    : 'rgba(255, 255, 255, 0.8)',
              }}
            >
              Mode: {result.calculationMode}
            </span>
          </div>

          {/* Explanation */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: 'var(--font-size-xs)',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: '#FB923C' }}>Calculation Basis: </strong>
            {result.reason}
          </div>

          {/* Timestamp and Non-Lock Notice */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', gap: '4px' }}>
            <span>Calculated at {formattedTime}</span>
            <span>Informational only • Does not reserve position or lock amount</span>
          </div>

          {/* Action Area: Create Visibility Intent */}
          {!createdIntent && (
            <div
              style={{
                marginTop: 'var(--space-2)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: 'var(--space-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                }}
              >
                <button
                  type="button"
                  onClick={handleCreateIntent}
                  disabled={creatingIntent}
                  style={{
                    backgroundColor: '#0D9488',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: 700,
                    fontSize: 'var(--font-size-xs)',
                    cursor: creatingIntent ? 'not-allowed' : 'pointer',
                    opacity: creatingIntent ? 0.7 : 1,
                  }}
                >
                  {creatingIntent ? 'Creating Intent...' : 'Create Visibility Intent →'}
                </button>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Preparation for payment • No charge executed
                </span>
              </div>

              {intentError && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    color: '#F87171',
                    fontSize: '11px',
                  }}
                >
                  {intentError}
                </div>
              )}

              {pricingChangedNotice && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: '#FBBF24',
                    fontSize: '11px',
                    lineHeight: 1.4,
                  }}
                >
                  <strong>Requirement Changed: </strong> {pricingChangedNotice}
                  <div style={{ marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleCalculate()}
                      style={{
                        backgroundColor: '#F59E0B',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Recalculate Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Created Intent Card */}
          {createdIntent && (
            <div
              style={{
                marginTop: 'var(--space-2)',
                backgroundColor: 'rgba(13, 148, 136, 0.12)',
                border: '1px solid rgba(13, 148, 136, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor:
                        createdIntent.status === 'PENDING_PAYMENT'
                          ? 'rgba(34, 197, 94, 0.2)'
                          : 'rgba(255, 255, 255, 0.1)',
                      color:
                        createdIntent.status === 'PENDING_PAYMENT'
                          ? '#4ADE80'
                          : 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    {createdIntent.status}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, color: '#FFFFFF' }}>
                    Visibility Intent Active
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Ref: <code>{createdIntent.id}</code>
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5 }}>
                Intent registered for <strong>Position #{createdIntent.targetPosition}</strong> at{' '}
                <strong>₹{createdIntent.qualifyingAmountRupees.toLocaleString('en-IN')}</strong>. Valid until{' '}
                <strong>{new Date(createdIntent.expiresAt).toLocaleTimeString('en-IN')}</strong>.
              </div>

              {/* Payment Boundary Integration (Milestone 0.12.0) */}
              {!paymentOrder && createdIntent.status === 'PENDING_PAYMENT' && (
                <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleInitiatePayment}
                      disabled={initiatingPayment}
                      style={{
                        backgroundColor: '#EA580C',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 'var(--radius-pill)',
                        padding: '6px 16px',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 700,
                        cursor: initiatingPayment ? 'not-allowed' : 'pointer',
                        opacity: initiatingPayment ? 0.7 : 1,
                      }}
                    >
                      {initiatingPayment ? 'Initializing PayU...' : 'Continue to Payment (PayU) →'}
                    </button>
                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Hosted PayU India Gateway
                    </span>
                  </div>
                  {paymentError && (
                    <div style={{ marginTop: '6px', color: '#F87171', fontSize: '11px' }}>
                      {paymentError}
                    </div>
                  )}
                </div>
              )}

              {/* Active Payment Order Card */}
              {paymentOrder && (
                <div
                  style={{
                    marginTop: 'var(--space-2)',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#FB923C' }}>
                      PayU Order: {paymentOrder.id}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor:
                          paymentOrder.status === 'SUCCEEDED'
                            ? 'rgba(34, 197, 94, 0.2)'
                            : paymentOrder.status === 'FAILED'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(245, 158, 11, 0.2)',
                        color:
                          paymentOrder.status === 'SUCCEEDED'
                            ? '#4ADE80'
                            : paymentOrder.status === 'FAILED'
                            ? '#F87171'
                            : '#FBBF24',
                      }}
                    >
                      {paymentOrder.status}
                    </span>
                  </div>

                  {paymentOrder.status === 'PENDING' && checkoutPayload && (
                    <form action={checkoutPayload.actionUrl} method={checkoutPayload.method} style={{ marginTop: '4px' }}>
                      {Object.entries(checkoutPayload.fields).map(([k, v]) => (
                        <input key={k} type="hidden" name={k} value={v || ''} />
                      ))}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <button
                          type="submit"
                          style={{
                            backgroundColor: '#22C55E',
                            color: '#000000',
                            border: 'none',
                            borderRadius: 'var(--radius-pill)',
                            padding: '6px 14px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          Proceed to PayU Checkout →
                        </button>
                        <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                          Ref: {paymentOrder.providerTransactionId}
                        </span>
                      </div>
                    </form>
                  )}

                  {(paymentOrder.status === 'SUCCEEDED' || paymentOrder.status === 'CONFIRMED') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ color: '#4ADE80', fontSize: '11px', lineHeight: 1.4 }}>
                        ✅ Payment of ₹{paymentOrder.amountRupees.toLocaleString('en-IN')} {paymentOrder.status === 'CONFIRMED' ? 'confirmed' : 'verified'} by PayU.
                      </div>

                      {!settlement && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={handleSettleRanking}
                            disabled={settlingRanking}
                            style={{
                              backgroundColor: '#0EA5E9',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: 'var(--radius-pill)',
                              padding: '6px 14px',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: settlingRanking ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {settlingRanking ? 'Settling Ranking...' : 'Finalize Ranking Settlement →'}
                          </button>
                        </div>
                      )}

                      {settlementError && (
                        <div style={{ color: '#F87171', fontSize: '11px' }}>
                          Settlement error: {settlementError}
                        </div>
                      )}

                      {settlement && settlement.status === 'SETTLED' && (
                        <div
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid #22C55E',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px',
                          }}
                        >
                          <div style={{ fontWeight: 800, color: '#4ADE80', fontSize: '12px' }}>
                            🎉 Visibility payment settled! Market position is now #{settlement.finalPosition}.
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)', marginTop: '4px' }}>
                            Paid Qualifying Amount: ₹{settlement.paidAmountRupees.toLocaleString('en-IN')} • Settlement: Completed
                          </div>
                        </div>
                      )}

                      {settlement && settlement.status === 'FAILED' && (
                        <div
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid #EF4444',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px',
                          }}
                        >
                          <div style={{ fontWeight: 800, color: '#F87171', fontSize: '12px' }}>
                            ⚠️ Settlement could not displace incumbent position.
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                            Payment remains confirmed. Reason: {settlement.failureReason}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentOrder.status === 'FAILED' && (
                    <div style={{ color: '#F87171', fontSize: '11px' }}>
                      Payment failed: {paymentOrder.failureReason || 'Declined by provider'}.
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                ⚖️ Paid visibility determines market ranking position and does not independently establish that a business is the objectively best choice.
              </div>

              {createdIntent.status === 'PENDING_PAYMENT' && (
                <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={handleCancelIntent}
                    disabled={creatingIntent || initiatingPayment}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#F87171',
                      border: '1px solid rgba(248, 113, 113, 0.3)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '4px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: creatingIntent || initiatingPayment ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {creatingIntent ? 'Cancelling...' : 'Cancel Intent'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
