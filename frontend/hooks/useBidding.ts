'use client';

import { useState, useCallback } from 'react';
import type { BidFlowState, PositionQuote } from '../types/bidding';
import { validateBidAmount } from '../lib/bidding/rules';
import { rankingApi } from '../lib/api/ranking';
import { paymentApi } from '../lib/api/payment';

interface UseBiddingOptions {
  marketId: string;
  businessId: string;
  onPositionConfirmed?: (position: number, amountMinor: number) => void;
  onRaceCondition?: (newQualifyingAmountMinor: number) => void;
}

export function useBidding({
  marketId,
  businessId,
  onPositionConfirmed,
  onRaceCondition,
}: UseBiddingOptions) {
  const [state, setState] = useState<BidFlowState>('IDLE');
  const [targetPosition, setTargetPosition] = useState<number | null>(null);
  const [offeredAmountMinor, setOfferedAmountMinor] = useState<number>(0);
  const [quote, setQuote] = useState<PositionQuote | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);

  /**
   * Step 1: Select a target position and fetch authoritative server quote.
   */
  const selectTarget = useCallback(
    async (position: number) => {
      setTargetPosition(position);
      setErrorMessage(null);
      setState('QUOTING');

      try {
        const serverQuote = await rankingApi.getPositionQuote(marketId, position);
        setQuote(serverQuote);
        setOfferedAmountMinor(serverQuote.minimumRequiredAmountMinor);
        setState('QUOTED');
      } catch (err: unknown) {
        setState('FAILED');
        setErrorMessage(err instanceof Error ? err.message : 'Could not fetch position quote.');
      }
    },
    [marketId]
  );

  /**
   * Step 2: Validate the offered amount locally before submission.
   */
  const updateOfferedAmount = useCallback(
    (newAmountMinor: number) => {
      setOfferedAmountMinor(newAmountMinor);

      if (quote) {
        const validation = validateBidAmount(newAmountMinor, quote.currentQualifyingAmountMinor);
        if (!validation.isValid) {
          setState('LOCAL_VALIDATION_ERROR');
          setErrorMessage(validation.errorMessage || 'Invalid bid amount.');
          return false;
        }
      }

      setErrorMessage(null);
      setState('QUOTED');
      return true;
    },
    [quote]
  );

  /**
   * Step 3: Initiate bid and move into payment commitment/hold state.
   * Protects against duplicate submissions.
   */
  const submitBid = useCallback(async () => {
    if (!targetPosition || !quote) return;

    // Local pre-validation
    const validation = validateBidAmount(offeredAmountMinor, quote.currentQualifyingAmountMinor);
    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage || 'Amount does not qualify.');
      setState('LOCAL_VALIDATION_ERROR');
      return;
    }

    setState('SUBMITTING');
    setErrorMessage(null);

    const idempotencyKey =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `bid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const bidResult = await rankingApi.submitBid({
        marketId,
        businessId,
        targetPosition,
        offeredAmountMinor,
        idempotencyKey,
      });

      if (bidResult.status === 'REJECTED') {
        if (
          bidResult.rejectionReason === 'POSITION_OCCUPIED_BY_HIGHER_BID' &&
          bidResult.updatedQualifyingAmountMinor
        ) {
          // Concurrency race condition detected: another business moved ahead
          setState('RACE_CONDITION_DETECTED');
          setErrorMessage('Another business just placed a higher qualifying bid for this position.');
          onRaceCondition?.(bidResult.updatedQualifyingAmountMinor);
          return;
        }

        setState('FAILED');
        setErrorMessage('Bid was rejected by server rules.');
        return;
      }

      // Bid accepted for payment processing
      setState('PAYMENT_PENDING');
      const paymentIntent = await paymentApi.createPayment({
        bidId: bidResult.bidId,
        businessId,
        marketId,
        targetPosition,
        amountMinor: offeredAmountMinor,
        idempotencyKey,
      });

      setActivePaymentId(paymentIntent.id);
      setState('AMOUNT_HELD');
    } catch (err: unknown) {
      setState('FAILED');
      setErrorMessage(err instanceof Error ? err.message : 'Bid submission failed.');
    }
  }, [
    marketId,
    businessId,
    targetPosition,
    quote,
    offeredAmountMinor,
    onRaceCondition,
  ]);

  /**
   * Step 4: Authoritative payment polling and ranking confirmation.
   */
  const confirmPaymentVerification = useCallback(async () => {
    if (!activePaymentId || !targetPosition) return;

    setState('VERIFYING_WITH_SERVER');

    try {
      const status = await paymentApi.getPaymentStatus(activePaymentId);

      if (status.status === 'CONFIRMED' || status.status === 'SUCCESS') {
        setState('CONFIRMED');
        onPositionConfirmed?.(targetPosition, offeredAmountMinor);
      } else if (status.status === 'FAILED' || status.status === 'CANCELLED') {
        setState('FAILED');
        setErrorMessage('Payment could not be verified.');
      } else {
        // Keep in hold/verifying
        setState('AMOUNT_HELD');
      }
    } catch (err: unknown) {
      setState('FAILED');
      setErrorMessage(err instanceof Error ? err.message : 'Status verification failed.');
    }
  }, [activePaymentId, targetPosition, offeredAmountMinor, onPositionConfirmed]);

  const reset = useCallback(() => {
    setState('IDLE');
    setTargetPosition(null);
    setOfferedAmountMinor(0);
    setQuote(null);
    setErrorMessage(null);
    setActivePaymentId(null);
  }, []);

  return {
    state,
    targetPosition,
    offeredAmountMinor,
    quote,
    errorMessage,
    isSubmitting: state === 'SUBMITTING' || state === 'VERIFYING_WITH_SERVER',
    selectTarget,
    updateOfferedAmount,
    submitBid,
    confirmPaymentVerification,
    reset,
  };
}
