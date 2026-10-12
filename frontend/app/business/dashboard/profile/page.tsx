'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BusinessEntity } from '../../../../types/business.ts';
import type { BusinessMembership } from '../../../../types/membership.ts';

function ProfileManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessIdParam = searchParams.get('businessId') || undefined;

  const [business, setBusiness] = useState<BusinessEntity | null>(null);
  const [membership, setMembership] = useState<BusinessMembership | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable fields
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const { getActiveDevSession } = await import('../../../../lib/auth/store.ts');
        const session = getActiveDevSession();

        if (!session) {
          router.replace('/auth/login?returnUrl=/business/dashboard/profile');
          return;
        }

        const { resolveWorkspaceContext } = await import('../../../../lib/workspace/store.ts');
        const ctx = await resolveWorkspaceContext(session.userId, businessIdParam);

        setBusiness(ctx.currentBusiness);
        setMembership(ctx.membership);

        const { can } = await import('../../../../lib/auth/rbac.ts');
        const editable = can(ctx.membership, 'business.update');
        setCanEdit(editable);

        setTagline(ctx.currentBusiness.tagline || '');
        setDescription(ctx.currentBusiness.description || '');
        setWebsite(ctx.currentBusiness.website || '');
        setPhone(ctx.currentBusiness.phone || '');
        setEmail(ctx.currentBusiness.email || '');
        setAddress(ctx.currentBusiness.address || '');
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [businessIdParam, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !canEdit) return;

    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const { getActiveDevSession } = await import('../../../../lib/auth/store.ts');
      const session = getActiveDevSession();
      if (!session) throw new Error('Authentication expired.');

      const { updateWorkspaceProfile } = await import('../../../../lib/workspace/store.ts');
      const updated = await updateWorkspaceProfile(
        {
          businessId: business.id,
          tagline,
          description,
          website,
          phone,
          email,
          address,
        },
        session.userId
      );

      setBusiness(updated);
      setSuccessMessage('Business profile details updated successfully.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
        Loading business profile...
      </div>
    );
  }

  if (errorMessage && !business) {
    return (
      <div style={{ textAlign: 'center', color: '#F87171', padding: 'var(--space-8)' }}>
        {errorMessage}
      </div>
    );
  }

  if (!business || !membership) return null;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
            Business Profile Management
          </h1>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            Role: {membership.role}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'rgba(255, 255, 255, 0.7)' }}>
          Manage official contact information and public overview for {business.name}.
        </p>
      </div>

      {!canEdit && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(234, 88, 12, 0.12)',
            border: '1px solid rgba(234, 88, 12, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            color: '#FB923C',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <strong>Read-Only Notice: </strong>
          Your role ({membership.role}) does not have content editing permissions. Contact an Owner or Admin to modify profile details.
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            color: '#4ADE80',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {successMessage}
        </div>
      )}

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
          }}
        >
          {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleSaveProfile}
        style={{
          backgroundColor: '#0B1F33',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {/* Canonical Identity Fields (Locked) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              Business Name (Locked)
            </label>
            <input
              type="text"
              value={business.name}
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: 'var(--font-size-sm)',
                boxSizing: 'border-box',
                cursor: 'not-allowed',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              Canonical Slug
            </label>
            <input
              type="text"
              value={business.slug}
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: 'var(--font-size-sm)',
                boxSizing: 'border-box',
                cursor: 'not-allowed',
              }}
            />
          </div>
        </div>

        {/* Tagline */}
        <div>
          <label
            htmlFor="tagline-input"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '6px',
            }}
          >
            Business Tagline
          </label>
          <input
            id="tagline-input"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            disabled={!canEdit}
            placeholder="Brief positioning statement"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: canEdit ? '#071526' : 'rgba(255, 255, 255, 0.03)',
              color: '#FFFFFF',
              fontSize: 'var(--font-size-sm)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description-input"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '6px',
            }}
          >
            Overview / Description
          </label>
          <textarea
            id="description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            rows={4}
            placeholder="Comprehensive description of business operations and specialized capabilities"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: canEdit ? '#071526' : 'rgba(255, 255, 255, 0.03)',
              color: '#FFFFFF',
              fontSize: 'var(--font-size-sm)',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Contact info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <label
              htmlFor="website-input"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '6px',
              }}
            >
              Website URL
            </label>
            <input
              id="website-input"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={!canEdit}
              placeholder="https://..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: canEdit ? '#071526' : 'rgba(255, 255, 255, 0.03)',
                color: '#FFFFFF',
                fontSize: 'var(--font-size-sm)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="phone-input"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '6px',
              }}
            >
              Phone Contact
            </label>
            <input
              id="phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!canEdit}
              placeholder="+91 ..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: canEdit ? '#071526' : 'rgba(255, 255, 255, 0.03)',
                color: '#FFFFFF',
                fontSize: 'var(--font-size-sm)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="email-input"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '6px',
              }}
            >
              Official Email
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!canEdit}
              placeholder="contact@..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: canEdit ? '#071526' : 'rgba(255, 255, 255, 0.03)',
                color: '#FFFFFF',
                fontSize: 'var(--font-size-sm)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Physical Address */}
        <div>
          <label
            htmlFor="address-input"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '6px',
            }}
          >
            Physical Address
          </label>
          <input
            id="address-input"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!canEdit}
            placeholder="Official commercial street address"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: canEdit ? '#071526' : 'rgba(255, 255, 255, 0.03)',
              color: '#FFFFFF',
              fontSize: 'var(--font-size-sm)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {canEdit && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                backgroundColor: '#EA580C',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
                fontSize: 'var(--font-size-sm)',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default function WorkspaceProfilePage() {
  return (
    <Suspense fallback={<div style={{ color: '#FFFFFF' }}>Loading profile editor...</div>}>
      <ProfileManagementContent />
    </Suspense>
  );
}
