'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { BusinessEntity } from '../../../types/business.ts';
import type { ClaimEvidenceType } from '../../../types/business-claim.ts';

function ClaimFlowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessSlug = searchParams.get('business');

  const [loading, setLoading] = useState(true);
  const [targetBusiness, setTargetBusiness] = useState<BusinessEntity | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; displayName?: string } | null>(null);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);

  // Form states
  const [claimantName, setClaimantName] = useState('');
  const [claimantRoleDescription, setClaimantRoleDescription] = useState('Founder & Managing Director');
  const [evidenceType, setEvidenceType] = useState<ClaimEvidenceType>('GSTIN');
  const [evidenceReference, setEvidenceReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadClaimContext() {
      try {
        const { getActiveDevSession } = await import('../../../lib/auth/store.ts');
        const session = getActiveDevSession();

        if (!session) {
          const returnPath = businessSlug
            ? `/business/claim?business=${encodeURIComponent(businessSlug)}`
            : '/business/claim';
          router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnPath)}`);
          return;
        }

        setCurrentUser(session.user);
        setClaimantName(session.user.displayName || '');

        if (businessSlug) {
          const { getBusinessBySlug, getBusinessById } = await import(
            '../../../lib/taxonomy/businesses.ts'
          );
          const biz = getBusinessBySlug(businessSlug) || getBusinessById(businessSlug);
          if (biz) {
            setTargetBusiness(biz);

            // Check if user is already a member
            const { getMembership } = await import('../../../lib/memberships/store.ts');
            const mem = getMembership(biz.id, session.userId);
            if (mem && mem.status === 'ACTIVE') {
              setIsMember(true);
            }

            // Check existing active claim
            const { getActiveClaim } = await import('../../../lib/claims/store.ts');
            const activeClaim = getActiveClaim(biz.id, session.userId);
            if (activeClaim) {
              setClaimStatus(activeClaim.status);
              setSubmittedClaimId(activeClaim.id);
            }
          }
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load claim context');
      } finally {
        setLoading(false);
      }
    }

    loadClaimContext();
  }, [businessSlug, router]);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBusiness || !currentUser) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const { submitBusinessClaim } = await import('../../../lib/claims/store.ts');
      const claim = submitBusinessClaim(
        {
          businessId: targetBusiness.id,
          claimantName: claimantName.trim(),
          claimantEmail: currentUser.email,
          claimantRoleDescription: claimantRoleDescription.trim(),
          evidenceType,
          evidenceReference: evidenceReference.trim(),
        },
        currentUser.id
      );

      setSubmittedClaimId(claim.id);
      setClaimStatus(claim.status);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Claim submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', color: '#FFFFFF', padding: 'var(--space-12)' }}>
        Loading verification state...
      </div>
    );
  }

  if (!businessSlug || !targetBusiness) {
    return (
      <div
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          backgroundColor: '#071526',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          color: '#FFFFFF',
        }}
      >
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
          Business Not Found
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
          Please select a valid business profile from the AageOnline directory to claim.
        </p>
        <a
          href="/businesses"
          style={{
            display: 'inline-flex',
            backgroundColor: '#EA580C',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            fontSize: 'var(--font-size-sm)',
            textDecoration: 'none',
          }}
        >
          Browse Business Directory →
        </a>
      </div>
    );
  }

  if (isMember) {
    return (
      <div
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          backgroundColor: '#071526',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4) auto',
            color: '#4ADE80',
          }}
        >
          ✓
        </div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
          You Already Manage {targetBusiness.name}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
          Your account holds an active membership for this business. You can access operational controls directly in your Business Workspace.
        </p>
        <a
          href="/business/dashboard"
          style={{
            display: 'inline-flex',
            backgroundColor: '#EA580C',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            fontSize: 'var(--font-size-sm)',
            textDecoration: 'none',
          }}
        >
          Go to Business Workspace →
        </a>
      </div>
    );
  }

  if (claimStatus === 'PENDING' || claimStatus === 'UNDER_REVIEW') {
    return (
      <div
        style={{
          maxWidth: '580px',
          margin: '0 auto',
          backgroundColor: '#071526',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#FB923C',
            backgroundColor: 'rgba(234, 88, 12, 0.15)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            fontSize: 'var(--font-size-xs)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Claim Under Review
        </div>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>
          Verification in Progress
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
          Your ownership claim for <strong>{targetBusiness.name}</strong> (Reference: <code>{submittedClaimId}</code>) is currently under review by our verification desk. Once verified and approved, your official Owner membership will be activated.
        </p>

        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            fontSize: 'var(--font-size-xs)',
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'left',
            marginBottom: 'var(--space-6)',
          }}
        >
          <strong>Security Notice:</strong> Business claims undergo strict document cross-referencing against official municipal and commercial records before permissions are provisioned.
        </div>

        <a
          href={`/businesses/${targetBusiness.slug}`}
          style={{
            display: 'inline-flex',
            color: 'rgba(255, 255, 255, 0.8)',
            textDecoration: 'none',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
          }}
        >
          ← Return to Public Profile
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '620px',
        margin: '0 auto',
        backgroundColor: '#071526',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#FFFFFF',
      }}
    >
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            color: '#EA580C',
            fontWeight: 800,
            fontSize: 'var(--font-size-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px',
          }}
        >
          Ownership Claim Request
        </div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 var(--space-2) 0' }}>
          Claim {targetBusiness.name}
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'rgba(255, 255, 255, 0.7)', margin: 0, lineHeight: 1.5 }}>
          Submit official authorization evidence to request administrative ownership and manage local visibility markets for this business.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            color: '#F87171',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmitClaim} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <label
            htmlFor="claimant-name"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '6px',
            }}
          >
            Representative Full Name
          </label>
          <input
            id="claimant-name"
            type="text"
            value={claimantName}
            onChange={(e) => setClaimantName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: '#0B1F33',
              color: '#FFFFFF',
              fontSize: 'var(--font-size-sm)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="claimant-role"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '6px',
            }}
          >
            Role / Official Designation
          </label>
          <input
            id="claimant-role"
            type="text"
            value={claimantRoleDescription}
            onChange={(e) => setClaimantRoleDescription(e.target.value)}
            required
            placeholder="e.g. Founder, CEO, General Manager, Managing Partner"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: '#0B1F33',
              color: '#FFFFFF',
              fontSize: 'var(--font-size-sm)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="evidence-type"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '6px',
            }}
          >
            Verification Evidence Type
          </label>
          <select
            id="evidence-type"
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value as ClaimEvidenceType)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: '#0B1F33',
              color: '#FFFFFF',
              fontSize: 'var(--font-size-sm)',
              boxSizing: 'border-box',
            }}
          >
            <option value="GSTIN">Goods & Services Tax Identification Number (GSTIN)</option>
            <option value="BUSINESS_EMAIL">Corporate Domain Email Address</option>
            <option value="OFFICIAL_DOCUMENT">Official Business Registration Certificate / Trade License</option>
            <option value="PHONE_VERIFICATION">Registered Telephonic Verification</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="evidence-reference"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '6px',
            }}
          >
            Evidence Reference / Document ID
          </label>
          <input
            id="evidence-reference"
            type="text"
            value={evidenceReference}
            onChange={(e) => setEvidenceReference(e.target.value)}
            required
            placeholder="e.g. 08AAACR1234F1Z5 or admin@royalinteriors.example.com"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: '#0B1F33',
              color: '#FFFFFF',
              fontSize: 'var(--font-size-sm)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: 'var(--font-size-xs)',
            color: 'rgba(255, 255, 255, 0.65)',
            lineHeight: 1.5,
          }}
        >
          <strong>Governance Notice:</strong> Claim submission initiates a verified review cycle and does not alter ranking positions or grant immediate ownership without authorization approval.
        </div>

        <button
          type="submit"
          disabled={submitting || !evidenceReference.trim()}
          style={{
            backgroundColor: '#EA580C',
            color: '#FFFFFF',
            border: 'none',
            padding: '14px 24px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            fontSize: 'var(--font-size-sm)',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting || !evidenceReference.trim() ? 0.6 : 1,
            marginTop: 'var(--space-2)',
            transition: 'opacity 0.15s ease',
          }}
        >
          {submitting ? 'Submitting Claim...' : 'Submit Claim Request →'}
        </button>
      </form>
    </div>
  );
}

export default function BusinessClaimPage() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--container-gutter)',
      }}
    >
      <Suspense fallback={<div style={{ color: '#FFFFFF' }}>Loading claim portal...</div>}>
        <ClaimFlowContent />
      </Suspense>
    </div>
  );
}
