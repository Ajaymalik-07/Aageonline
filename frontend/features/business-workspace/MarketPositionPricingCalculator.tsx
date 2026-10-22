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

  // Manual Custom Qualifying Offer Amount (defaults to required qualifying rupees)
  const [manualOfferInput, setManualOfferInput] = useState<string>('');

  // Bid Intent State
  const [createdIntent, setCreatedIntent] = useState<BidIntent | null>(null);
  const [creatingIntent, setCreatingIntent] = useState<boolean>(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [pricingChangedNotice, setPricingChangedNotice] = useState<string | null>(null);

  // Request correlation counter to prevent stale async responses
  const activeRequestIdRef = useRef<number>(0);
  const idempotencyKeyRef = useRef<string | null>(null);

  const handleCalculate = async (_requestedPos?: number) => {
    // Target position is strictly and exclusively Position #1
    const posToCalculate = 1;

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
        setManualOfferInput(String(res.requiredQualifyingAmountRupees));
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

  // Auto-calculate Position #1 pricing on mount or market change
  React.useEffect(() => {
    handleCalculate(1);
  }, [marketId, businessId]);

  const handleCreateIntent = async () => {
    if (!result) return;
    if (!businessId) {
      setIntentError('Business context required to create a visibility intent. Please log in with an authorized account.');
      return;
    }

    const parsedOffer = parseInt(manualOfferInput.replace(/,/g, '').trim(), 10);
    const minRequired = result.requiredQualifyingAmountRupees;
    if (isNaN(parsedOffer) || parsedOffer < minRequired) {
      setIntentError(`Your offer cannot be less than the minimum qualifying amount of ₹${minRequired.toLocaleString('en-IN')} to claim Position #1.`);
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
        offeredAmountMinor: parsedOffer * 100,
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
        backgroundColor: '#F8FAFC',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        border: '1px solid #E2E8F0',
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
          <span style={{ fontWeight: 800, fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#EA580C' }}>
            Position Pricing Calculator
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
          Read-only • No financial mutation
        </span>
      </div>

      <p style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--font-size-xs)', color: '#64748B', lineHeight: 1.5 }}>
        Calculate the exact minimum qualifying amount required to target Position #1 (Market Top) in{' '}
        <strong style={{ color: '#0F172A' }}>{marketName}</strong>.
      </p>

      {/* Target Position Display & Trigger — Strictly Position #1 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#334155' }}>
            Target Position:
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFF7ED',
              border: '1.5px solid #EA580C',
              color: '#EA580C',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            <span>#1</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9A3412' }}>
              (Spotlight Rank #1)
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleCalculate(1)}
          disabled={loading}
          style={{
            backgroundColor: '#EA580C',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 20px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 800,
            fontSize: 'var(--font-size-xs)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginLeft: 'auto',
            boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
          }}
        >
          {loading ? 'Calculating...' : 'Calculate Required Amount for #1 →'}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 'var(--space-3)',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            color: '#DC2626',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
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
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Header Row: Target Position & Calculation Mode */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#EA580C',
                  color: '#FFFFFF',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 900,
                  fontSize: '12px',
                  letterSpacing: '0.04em',
                }}
              >
                <span>★</span>
                <span>POSITION #1 SPOTLIGHT</span>
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                Competitive Qualification in {marketName}
              </span>
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor:
                  result.calculationMode === 'STRICT_SUPERSEDING'
                    ? '#FFF7ED'
                    : result.calculationMode === 'INITIAL_FLOOR'
                    ? '#EFF6FF'
                    : '#F1F5F9',
                color:
                  result.calculationMode === 'STRICT_SUPERSEDING'
                    ? '#EA580C'
                    : result.calculationMode === 'INITIAL_FLOOR'
                    ? '#2563EB'
                    : '#475569',
                border:
                  result.calculationMode === 'STRICT_SUPERSEDING'
                    ? '1px solid #FED7AA'
                    : result.calculationMode === 'INITIAL_FLOOR'
                    ? '1px solid #BFDBFE'
                    : '1px solid #E2E8F0',
              }}
            >
              Mode: {result.calculationMode}
            </span>
          </div>

          {/* Section 1 & 2: Current #1 Position Holder & Claim Position #1 Breakdown */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Current #1 Leader Box */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>
                  🥇 Current #1 Position Holder
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    backgroundColor: '#E2E8F0',
                    color: '#334155',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  {result.relevantCurrentQualifyingAmountRupees ? 'Occupied' : 'Vacant'}
                </span>
              </div>

              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                {result.occupantBusinessName || 'Current Market Leader'}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>
                  Current Qualifying Amount:
                </span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#475569' }}>
                  {result.relevantCurrentQualifyingAmountRupees
                    ? `₹${result.relevantCurrentQualifyingAmountRupees.toLocaleString('en-IN')}`
                    : `₹${result.requiredQualifyingAmountRupees.toLocaleString('en-IN')} (Floor)`}
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginLeft: '6px' }}>
                    INR
                  </span>
                </div>
              </div>
            </div>

            {/* Claim Position #1 & The +₹1 Rule */}
            <div
              style={{
                backgroundColor: '#FFF7ED',
                border: '1.5px solid #FDBA74',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#C2410C', letterSpacing: '0.05em' }}>
                  🎯 Claim Position #1
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    backgroundColor: '#EA580C',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  Strict Superseding
                </span>
              </div>

              <div style={{ fontSize: '12px', color: '#7C2D12', lineHeight: 1.4 }}>
                {result.relevantCurrentQualifyingAmountRupees ? (
                  <>
                    Must strictly exceed current #1 holder (₹{result.relevantCurrentQualifyingAmountRupees.toLocaleString('en-IN')}) by <strong>at least ₹1</strong>.
                  </>
                ) : (
                  <>
                    Position #1 is unoccupied. Meet or exceed this market's base entry floor.
                  </>
                )}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                <span style={{ fontSize: '11px', color: '#9A3412', display: 'block', fontWeight: 700 }}>
                  Minimum Required to Claim:
                </span>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#EA580C' }}>
                  ₹{result.requiredQualifyingAmountRupees.toLocaleString('en-IN')}
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#C2410C', marginLeft: '6px' }}>
                    (+₹1 above leader)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Manual Custom Amount Entry & Quick Increment Chips */}
          {!createdIntent && (
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <label
                    htmlFor="manualOfferInput"
                    style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', display: 'block' }}
                  >
                    Enter Your Qualifying Offer Amount (INR)
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Minimum required: ₹{result.requiredQualifyingAmountRupees.toLocaleString('en-IN')}. You can manually increase this amount to set a higher competitive barrier.
                  </span>
                </div>
              </div>

              {/* Input Row & Quick Chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      border:
                        parseInt(manualOfferInput.replace(/,/g, '') || '0', 10) < result.requiredQualifyingAmountRupees
                          ? '2px solid #EF4444'
                          : '2px solid #EA580C',
                      borderRadius: 'var(--radius-md)',
                      padding: '4px 12px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  >
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#EA580C', marginRight: '6px' }}>
                      ₹
                    </span>
                    <input
                      id="manualOfferInput"
                      type="number"
                      min={result.requiredQualifyingAmountRupees}
                      step={1}
                      value={manualOfferInput}
                      onChange={(e) => {
                        setManualOfferInput(e.target.value);
                        setIntentError(null);
                      }}
                      style={{
                        border: 'none',
                        outline: 'none',
                        fontSize: '18px',
                        fontWeight: 900,
                        color: '#0F172A',
                        width: '180px',
                        backgroundColor: 'transparent',
                      }}
                    />
                  </div>

                  {/* Quick-Add Chips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginRight: '2px' }}>
                      Quick Add:
                    </span>
                    {[100, 500, 1000, 5000].map((increment) => (
                      <button
                        key={increment}
                        type="button"
                        onClick={() => {
                          const currentVal = parseInt(manualOfferInput.replace(/,/g, '') || '0', 10);
                          const base = isNaN(currentVal) || currentVal < result.requiredQualifyingAmountRupees
                            ? result.requiredQualifyingAmountRupees
                            : currentVal;
                          setManualOfferInput(String(base + increment));
                          setIntentError(null);
                        }}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: 'var(--radius-pill)',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFF7ED';
                          e.currentTarget.style.borderColor = '#EA580C';
                          e.currentTarget.style.color = '#EA580C';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.color = '#334155';
                        }}
                      >
                        +₹{increment.toLocaleString('en-IN')}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setManualOfferInput(String(result.requiredQualifyingAmountRupees));
                        setIntentError(null);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#64748B',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: '4px 6px',
                      }}
                    >
                      Reset to Min (₹{result.requiredQualifyingAmountRupees.toLocaleString('en-IN')})
                    </button>
                  </div>
                </div>

                {/* Live validation feedback */}
                {parseInt(manualOfferInput.replace(/,/g, '') || '0', 10) < result.requiredQualifyingAmountRupees ? (
                  <div style={{ color: '#DC2626', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚠️</span>
                    <span>
                      Offer cannot be lower than the minimum qualifying amount of ₹{result.requiredQualifyingAmountRupees.toLocaleString('en-IN')} to claim Position #1.
                    </span>
                  </div>
                ) : (
                  <div style={{ color: '#16A34A', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>✓</span>
                    <span>
                      Valid offer: ₹{parseInt(manualOfferInput.replace(/,/g, '') || '0', 10).toLocaleString('en-IN')} qualifies to claim Position #1 upon payment confirmation.
                    </span>
                  </div>
                )}
              </div>

              {/* Action Area: Create Visibility Intent Button */}
              <div
                style={{
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={handleCreateIntent}
                  disabled={
                    creatingIntent ||
                    parseInt(manualOfferInput.replace(/,/g, '') || '0', 10) < result.requiredQualifyingAmountRupees
                  }
                  style={{
                    backgroundColor:
                      parseInt(manualOfferInput.replace(/,/g, '') || '0', 10) < result.requiredQualifyingAmountRupees
                        ? '#94A3B8'
                        : '#0D9488',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 28px',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: 800,
                    fontSize: '13px',
                    letterSpacing: '0.02em',
                    cursor:
                      creatingIntent ||
                      parseInt(manualOfferInput.replace(/,/g, '') || '0', 10) < result.requiredQualifyingAmountRupees
                        ? 'not-allowed'
                        : 'pointer',
                    boxShadow:
                      parseInt(manualOfferInput.replace(/,/g, '') || '0', 10) < result.requiredQualifyingAmountRupees
                        ? 'none'
                        : '0 4px 14px rgba(13, 148, 136, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    if (parseInt(manualOfferInput.replace(/,/g, '') || '0', 10) >= result.requiredQualifyingAmountRupees) {
                      e.currentTarget.style.backgroundColor = '#0F766E';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (parseInt(manualOfferInput.replace(/,/g, '') || '0', 10) >= result.requiredQualifyingAmountRupees) {
                      e.currentTarget.style.backgroundColor = '#0D9488';
                    }
                  }}
                >
                  {creatingIntent
                    ? 'Creating Intent...'
                    : `Create Visibility Intent for ₹${(parseInt(manualOfferInput.replace(/,/g, '') || '0', 10) || result.requiredQualifyingAmountRupees).toLocaleString('en-IN')} →`}
                </button>

                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Clicking creates an active visibility intent and unlocks direct payment details via PayU.
                </span>
              </div>

              {intentError && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {intentError}
                </div>
              )}

              {pricingChangedNotice && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: '#B45309',
                    fontSize: '12px',
                    lineHeight: 1.4,
                  }}
                >
                  <strong>Requirement Changed: </strong> {pricingChangedNotice}
                  <div style={{ marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleCalculate(1)}
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

          {/* Active Created Intent Card — Executive High-Security Terminal */}
          {createdIntent && (
            <div
              style={{
                marginTop: 'var(--space-4)',
                backgroundColor: '#071526',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                color: '#FFFFFF',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Top Accent Gradient Stripe */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #EA580C, #F59E0B, #10B981)',
                }}
              />

              {/* Header: Status Badge + Title + Ref ID */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor:
                        createdIntent.status === 'PENDING_PAYMENT'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(34, 197, 94, 0.15)',
                      color:
                        createdIntent.status === 'PENDING_PAYMENT'
                          ? '#FBBF24'
                          : '#4ADE80',
                      border:
                        createdIntent.status === 'PENDING_PAYMENT'
                          ? '1px solid rgba(245, 158, 11, 0.35)'
                          : '1px solid rgba(34, 197, 94, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>●</span>
                    {createdIntent.status}
                  </span>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    Visibility Intent Active
                  </h4>
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#94A3B8',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '3px 8px',
                    fontFamily: 'monospace',
                  }}
                >
                  Ref: <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{createdIntent.id}</span>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                }}
              >
                <div>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Target Position
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#FB923C' }}>
                    Position #{createdIntent.targetPosition}{' '}
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#FED7AA' }}>
                      (Spotlight Rank)
                    </span>
                  </span>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Required Qualifying Amount
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF' }}>
                    ₹{createdIntent.qualifyingAmountRupees.toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Reservation Expiry
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#38BDF8' }}>
                    ⏱️ Valid until {new Date(createdIntent.expiresAt).toLocaleTimeString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Action Row */}
              {!paymentOrder && createdIntent.status === 'PENDING_PAYMENT' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={handleInitiatePayment}
                      disabled={initiatingPayment}
                      style={{
                        backgroundColor: '#EA580C',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 'var(--radius-pill)',
                        padding: '12px 28px',
                        fontSize: '14px',
                        fontWeight: 800,
                        letterSpacing: '0.02em',
                        cursor: initiatingPayment ? 'not-allowed' : 'pointer',
                        opacity: initiatingPayment ? 0.7 : 1,
                        boxShadow: '0 4px 16px rgba(234, 88, 12, 0.45)',
                        transition: 'all 0.15s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#C2410C';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#EA580C';
                      }}
                    >
                      <span>{initiatingPayment ? 'Initializing PayU Gateway...' : 'Continue to Payment (PayU) →'}</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '12px' }}>
                      <span>🔒</span>
                      <span>Hosted via PayU India Gateway (256-bit SSL)</span>
                    </div>
                  </div>

                  {paymentError && (
                    <div
                      role="alert"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        color: '#F87171',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {paymentError}
                    </div>
                  )}
                </div>
              )}

              {/* Active Payment Order Card */}
              {paymentOrder && (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#FB923C' }}>
                        PayU Order: {paymentOrder.id}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 8px',
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
                        border:
                          paymentOrder.status === 'SUCCEEDED'
                            ? '1px solid rgba(34, 197, 94, 0.35)'
                            : paymentOrder.status === 'FAILED'
                            ? '1px solid rgba(239, 68, 68, 0.35)'
                            : '1px solid rgba(245, 158, 11, 0.35)',
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="submit"
                          style={{
                            backgroundColor: '#22C55E',
                            color: '#071526',
                            border: 'none',
                            borderRadius: 'var(--radius-pill)',
                            padding: '10px 22px',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                          }}
                        >
                          Proceed to PayU Checkout →
                        </button>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
                          Ref: {paymentOrder.providerTransactionId}
                        </span>
                      </div>
                    </form>
                  )}

                  {(paymentOrder.status === 'SUCCEEDED' || paymentOrder.status === 'CONFIRMED') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ color: '#4ADE80', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✅</span>
                        <span>Payment of ₹{paymentOrder.amountRupees.toLocaleString('en-IN')} {paymentOrder.status === 'CONFIRMED' ? 'confirmed' : 'verified'} by PayU.</span>
                      </div>

                      {!settlement && (
                        <div>
                          <button
                            type="button"
                            onClick={handleSettleRanking}
                            disabled={settlingRanking}
                            style={{
                              backgroundColor: '#0284C7',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: 'var(--radius-pill)',
                              padding: '10px 22px',
                              fontSize: '13px',
                              fontWeight: 800,
                              cursor: settlingRanking ? 'not-allowed' : 'pointer',
                              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                            }}
                          >
                            {settlingRanking ? 'Settling Ranking...' : 'Finalize Ranking Settlement →'}
                          </button>
                        </div>
                      )}

                      {settlementError && (
                        <div style={{ color: '#F87171', fontSize: '12px' }}>
                          Settlement error: {settlementError}
                        </div>
                      )}

                      {settlement && settlement.status === 'SETTLED' && (
                        <div
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid rgba(34, 197, 94, 0.4)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 16px',
                          }}
                        >
                          <div style={{ fontWeight: 800, color: '#4ADE80', fontSize: '14px' }}>
                            🎉 Visibility payment settled! Market position is now #{settlement.finalPosition}.
                          </div>
                          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginTop: '4px' }}>
                            Paid Qualifying Amount: ₹{settlement.paidAmountRupees.toLocaleString('en-IN')} • Settlement: Completed
                          </div>
                        </div>
                      )}

                      {settlement && settlement.status === 'FAILED' && (
                        <div
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 16px',
                          }}
                        >
                          <div style={{ fontWeight: 800, color: '#F87171', fontSize: '13px' }}>
                            ⚠️ Settlement could not displace incumbent position.
                          </div>
                          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)', marginTop: '4px' }}>
                            Payment remains confirmed. Reason: {settlement.failureReason}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentOrder.status === 'FAILED' && (
                    <div style={{ color: '#F87171', fontSize: '12px' }}>
                      Payment failed: {paymentOrder.failureReason || 'Declined by provider'}.
                    </div>
                  )}
                </div>
              )}

              {/* Regulatory & Transparency Disclosure */}
              <div
                style={{
                  fontSize: '11px',
                  color: '#94A3B8',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚖️</span>
                <span>Paid visibility determines market ranking position and does not independently establish that a business is the objectively best choice.</span>
              </div>

              {/* Cancel Intent Action */}
              {createdIntent.status === 'PENDING_PAYMENT' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '2px' }}>
                  <button
                    type="button"
                    onClick={handleCancelIntent}
                    disabled={creatingIntent || initiatingPayment}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#F87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: creatingIntent || initiatingPayment ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {creatingIntent ? 'Cancelling Intent...' : '✕ Cancel This Intent'}
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
