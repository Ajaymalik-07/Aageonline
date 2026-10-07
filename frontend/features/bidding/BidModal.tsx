'use client';

import React, { useEffect } from 'react';
import type { Market, RankingEntry } from '../../types/market';
import { TargetPositionSelector } from './TargetPositionSelector';
import { Button } from '../../components/ui/Button';
import { VisibilityDisclosure } from '../../components/ui/VisibilityDisclosure';
import { useBidding } from '../../hooks/useBidding';
import { formatINR, paiseToRupees } from '../../lib/utils/format';
import { lockScroll } from '../../lib/performance/scroll';

export interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market;
  currentRankings: RankingEntry[];
  businessId: string;
  businessName: string;
  initialTargetPosition?: number;
}

export const BidModal: React.FC<BidModalProps> = ({
  isOpen,
  onClose,
  market,
  currentRankings,
  businessId,
  businessName,
  initialTargetPosition = 1,
}) => {
  const {
    state,
    targetPosition,
    offeredAmountMinor,
    quote,
    errorMessage,
    isSubmitting,
    selectTarget,
    updateOfferedAmount,
    submitBid,
    confirmPaymentVerification,
    reset,
  } = useBidding({
    marketId: market.id,
    businessId,
  });

  // Lock body scroll when modal is open without CLS layout shift
  useEffect(() => {
    if (isOpen) {
      const unlock = lockScroll();
      return () => unlock();
    }
  }, [isOpen]);

  // Initial target selection on open
  useEffect(() => {
    if (isOpen && initialTargetPosition && !targetPosition) {
      selectTarget(initialTargetPosition);
    }
  }, [isOpen, initialTargetPosition, targetPosition, selectTarget]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bid-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 31, 59, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 'var(--space-4)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--elevation-4)',
          maxWidth: '540px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          border: '1px solid var(--border-subtle)',
        }}
        className="aage-bid-modal-content"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-teal)', textTransform: 'uppercase' }}>
              Competitive Positioning
            </span>
            <h2 id="bid-modal-title" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Move Up in {market.location.name}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: 'var(--text-secondary)',
              minHeight: '44px',
              minWidth: '44px',
            }}
          >
            ✕
          </button>
        </div>

        {/* State: CONFIRMED */}
        {state === 'CONFIRMED' ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <div style={{ fontSize: '48px', color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>
              ✓
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Position Confirmed!
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 'var(--space-2) 0 var(--space-4) 0' }}>
              <strong>{businessName}</strong> is now position <strong>#{targetPosition}</strong> in{' '}
              {market.category.name} ({market.location.name}).
            </p>
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: '13px', color: 'var(--brand-deep-emerald)', fontWeight: 600 }}>
                Transaction verified and auditable in position history.
              </span>
            </div>
            <Button onClick={handleClose} variant="primary" style={{ width: '100%' }}>
              Done
            </Button>
          </div>
        ) : state === 'AMOUNT_HELD' ? (
          /* State: AMOUNT_HELD (Payment being verified) */
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <div
              style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '4px solid var(--brand-teal)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: 'var(--space-3)',
              }}
            />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Payment Processing &amp; Position Verification
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 'var(--space-2) 0' }}>
              Your amount of {formatINR(offeredAmountMinor)} is being verified with the payment gateway.
              Please do not close this window.
            </p>
            <Button
              onClick={confirmPaymentVerification}
              variant="primary"
              style={{ width: '100%', marginTop: 'var(--space-3)' }}
            >
              Verify Position Confirmation
            </Button>
          </div>
        ) : (
          /* State: Normal selection / quote / submission */
          <>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Business: <strong>{businessName}</strong> · Market: <strong>{market.category.name}</strong>
            </div>

            <TargetPositionSelector
              currentRankings={currentRankings}
              selectedTarget={targetPosition}
              onSelectTarget={selectTarget}
            />

            {quote && (
              <div
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: 'rgba(11, 31, 59, 0.03)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Target Position:
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    #{quote.targetPosition}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Current Qualifying Amount:
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {formatINR(quote.currentQualifyingAmountMinor)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Minimum Required (Strictly Higher):
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-deep-emerald)' }}>
                    {formatINR(quote.minimumRequiredAmountMinor)}
                  </span>
                </div>

                <label
                  htmlFor="custom-bid-amount"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}
                >
                  Your Qualifying Amount (₹)
                </label>
                <input
                  id="custom-bid-amount"
                  type="number"
                  min={paiseToRupees(quote.minimumRequiredAmountMinor)}
                  step={1}
                  value={paiseToRupees(offeredAmountMinor)}
                  onChange={(e) => updateOfferedAmount(Math.round(parseFloat(e.target.value || '0') * 100))}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-strong)',
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                />
              </div>
            )}

            {/* Error or Race Condition Alert */}
            {errorMessage && (
              <div
                role="alert"
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid var(--color-danger)',
                  fontSize: '13px',
                  color: 'var(--color-danger)',
                  fontWeight: 600,
                }}
              >
                {state === 'RACE_CONDITION_DETECTED'
                  ? '⚡ Another business just placed a higher bid. Please update your amount to qualify.'
                  : errorMessage}
              </div>
            )}

            <VisibilityDisclosure compact />

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={submitBid}
                isLoading={isSubmitting}
                disabled={!targetPosition || !quote || isSubmitting}
                style={{ flex: 2 }}
              >
                Continue to Payment ({formatINR(offeredAmountMinor)})
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
