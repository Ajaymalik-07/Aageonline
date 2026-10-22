'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { BusinessEntity, BusinessSocialLinks } from '../../../../types/business.ts';
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
  const [availableBusinesses, setAvailableBusinesses] = useState<import('../../../../types/workspace.ts').WorkspaceBusinessItem[]>([]);

  // Core editable fields
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Social Media & Marketing Links
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        let userId: string | null = null;
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              userId = data.user.id;
              const { registerUserInStore, setActiveDevUser: setDevUser } = await import('../../../../lib/auth/store.ts');
              registerUserInStore(data.user);
              if (process.env.NODE_ENV !== 'production') {
                setDevUser(data.user.id);
              }
            }
          }
        } catch {
          // fallback
        }

        if (!userId) {
          const { getActiveDevSession } = await import('../../../../lib/auth/store.ts');
          const session = getActiveDevSession();
          if (session) userId = session.userId;
        }

        if (!userId) {
          router.replace('/business/claim?returnUrl=/business/dashboard/profile');
          return;
        }

        const { resolveWorkspaceContext } = await import('../../../../lib/workspace/store.ts');
        let ctx;
        try {
          ctx = await resolveWorkspaceContext(userId, businessIdParam);
        } catch (firstErr) {
          if (businessIdParam) {
            try {
              ctx = await resolveWorkspaceContext(userId);
            } catch {
              throw firstErr;
            }
          } else {
            throw firstErr;
          }
        }

        setBusiness(ctx.currentBusiness);
        setMembership(ctx.membership);
        setAvailableBusinesses(ctx.availableBusinesses);

        const { can } = await import('../../../../lib/auth/rbac.ts');
        const editable = can(ctx.membership, 'business.update');
        setCanEdit(editable);

        setTagline(ctx.currentBusiness.tagline || '');
        setDescription(ctx.currentBusiness.description || '');
        setWebsite(ctx.currentBusiness.website || '');
        setPhone(ctx.currentBusiness.phone || '');
        setEmail(ctx.currentBusiness.email || '');
        setAddress(ctx.currentBusiness.address || '');

        const social = ctx.currentBusiness.socialLinks || {};
        setInstagram(social.instagram || '');
        setLinkedin(social.linkedin || '');
        setFacebook(social.facebook || '');
        setTwitter(social.twitter || '');
        setYoutube(social.youtube || '');
        setWhatsapp(social.whatsapp || '');
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

      const socialLinks: BusinessSocialLinks = {
        instagram: instagram.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        facebook: facebook.trim() || undefined,
        twitter: twitter.trim() || undefined,
        youtube: youtube.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
      };

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
          socialLinks,
        },
        session.userId
      );

      setBusiness(updated);
      setSuccessMessage('Business profile and marketing channels updated successfully.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-8) 0' }}>
        <div style={{ height: '90px', backgroundColor: 'rgba(11, 31, 51, 0.6)', borderRadius: 'var(--radius-xl)' }} />
        <div style={{ height: '400px', backgroundColor: 'rgba(11, 31, 51, 0.6)', borderRadius: 'var(--radius-xl)' }} />
      </div>
    );
  }

  if (errorMessage && !business) {
    return (
      <div
        style={{
          maxWidth: '540px',
          margin: 'var(--space-12) auto',
          padding: 'var(--space-8)',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          Workspace Access Notice
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: '#64748B', marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
          {errorMessage}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/business/dashboard')}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Go to My Workspace
          </button>
          <Link
            href="/business/claim"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '9px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#F1F5F9',
              color: '#334155',
              textDecoration: 'none',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
            }}
          >
            + Register / Claim Business
          </Link>
          <Link
            href="/business/claim"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '9px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#64748B',
              textDecoration: 'none',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
            }}
          >
            Sign In Again
          </Link>
        </div>
      </div>
    );
  }

  if (!business || !membership) return null;

  const isVerified = business.verificationStatus === 'VERIFIED';
  const hasActiveSocials = Boolean(instagram || linkedin || facebook || twitter || youtube || whatsapp);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Page Header with Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: 'var(--space-6)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Business Profile Management
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: isVerified ? '#ECFDF5' : '#F1F5F9',
                color: isVerified ? '#059669' : '#64748B',
                border: `1px solid ${isVerified ? '#A7F3D0' : '#CBD5E1'}`,
              }}
            >
              {isVerified ? 'Verified Enterprise ✓' : 'Listing Pending'}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#FFFBEB',
                color: '#D97706',
                border: '1px solid #FDE68A',
              }}
            >
              Role: {membership.role}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#64748B' }}>
            Configure official brand identity, verified contact endpoints, and social channels showcased to customers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/business/claim"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>+ Add New Business Listing</span>
          </Link>

          <Link
            href={`/businesses/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>View Public Showcase</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </Link>
        </div>
      </div>

      {/* Enterprise Switcher if user belongs to multiple businesses */}
      {availableBusinesses.length > 1 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 18px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Your Businesses ({availableBusinesses.length}):
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {availableBusinesses.map((item) => {
                const isSelected = item.business.id === business.id;
                return (
                  <button
                    key={item.business.id}
                    type="button"
                    onClick={() => router.push(`/business/dashboard/profile?businessId=${encodeURIComponent(item.business.id)}`)}
                    style={{
                      backgroundColor: isSelected ? '#EA580C' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      border: isSelected ? 'none' : '1px solid #CBD5E1',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {item.business.name}
                    {isSelected && ' ✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <Link
            href="/business/claim"
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#EA580C',
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(234, 88, 12, 0.08)',
              border: '1px dashed #EA580C',
            }}
          >
            + Add Another Business
          </Link>
        </div>
      )}

      {/* Marketing Showcase Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
          border: '1px solid #A7F3D0',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#D1FAE5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#059669',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
            <path d="M2 12h20"></path>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-base)', fontWeight: 800, color: '#065F46' }}>
            Marketing Visibility &amp; Customer Showcase
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#047857', lineHeight: 1.5 }}>
            Your official social channels and contact information are prominently featured across AageOnline on your verified public profile page and high-ranking market placement spots (<strong>#1, #2, #3</strong>). Adding accurate social handles builds immediate buyer trust, boosts portfolio discovery, and lets potential clients connect directly.
          </p>
        </div>
      </div>

      {/* Notifications */}
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
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            color: '#4ADE80',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            color: '#F87171',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Main Grid: Form Left, Preview Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 'var(--space-8)',
          alignItems: 'flex-start',
        }}
      >
        {/* Editor Form */}
        <form
          onSubmit={handleSaveProfile}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
          }}
        >
          {/* Card 1: Official Identity & Canonical Positioning */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                1. Canonical Brand Identity
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: '#64748B', margin: '4px 0 0 0' }}>
                Primary legal identifiers registered on AageOnline
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#64748B',
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
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    color: '#64748B',
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
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#64748B',
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
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    color: '#64748B',
                    fontSize: 'var(--font-size-sm)',
                    boxSizing: 'border-box',
                    cursor: 'not-allowed',
                  }}
                />
              </div>
            </div>

            {business.legalName && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#64748B',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Registered Legal Name
                </label>
                <input
                  type="text"
                  value={business.legalName}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    color: '#64748B',
                    fontSize: 'var(--font-size-sm)',
                    boxSizing: 'border-box',
                    cursor: 'not-allowed',
                  }}
                />
              </div>
            )}

            {/* Tagline */}
            <div>
              <label
                htmlFor="tagline-input"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: '#0F172A',
                  marginBottom: '6px',
                }}
              >
                Marketing Tagline / Value Proposition
              </label>
              <input
                id="tagline-input"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                disabled={!canEdit}
                placeholder="e.g. Premium bespoke residential interiors across Jaipur"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #CBD5E1',
                  backgroundColor: canEdit ? '#FFFFFF' : '#F8FAFC',
                  color: '#0F172A',
                  fontSize: 'var(--font-size-sm)',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                Displayed directly beneath your company title in search rankings and top listings.
              </span>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description-input"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: '#0F172A',
                  marginBottom: '6px',
                }}
              >
                Comprehensive Business Overview
              </label>
              <textarea
                id="description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                rows={4}
                placeholder="Detail your firm's specialized capabilities, background, and service standards..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #CBD5E1',
                  backgroundColor: canEdit ? '#FFFFFF' : '#F8FAFC',
                  color: '#0F172A',
                  fontSize: 'var(--font-size-sm)',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Card 2: Social Media & Marketing Channels (Core Request) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  2. Social Media & Marketing Channels
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#059669',
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  Featured on Public Site
                </span>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: '#64748B', margin: '4px 0 0 0' }}>
                Link your company accounts to showcase your portfolio, updates, and customer ratings.
              </p>
            </div>

            {/* Instagram */}
            <div>
              <label
                htmlFor="instagram-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: '#E1306C',
                  marginBottom: '6px',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                Instagram Profile URL
              </label>
              <input
                id="instagram-input"
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={!canEdit}
                placeholder="https://instagram.com/yourbrand"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #CBD5E1',
                  backgroundColor: canEdit ? '#FFFFFF' : '#F8FAFC',
                  color: '#0F172A',
                  fontSize: 'var(--font-size-sm)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label
                htmlFor="linkedin-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: '#0A66C2',
                  marginBottom: '6px',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
                LinkedIn Company Page
              </label>
              <input
                id="linkedin-input"
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                disabled={!canEdit}
                placeholder="https://linkedin.com/company/yourbrand"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #CBD5E1',
                  backgroundColor: canEdit ? '#FFFFFF' : '#F8FAFC',
                  color: '#0F172A',
                  fontSize: 'var(--font-size-sm)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* WhatsApp Direct */}
            <div>
              <label
                htmlFor="whatsapp-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: '#16A34A',
                  marginBottom: '6px',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.09c-1.52 0-3-.4-4.31-1.16l-.31-.18-3.2.84.85-3.12-.2-.32a8.04 8.04 0 0 1-1.23-4.24c0-4.47 3.64-8.11 8.11-8.11 2.16 0 4.19.84 5.72 2.37 1.53 1.53 2.37 3.56 2.37 5.72 0 4.47-3.64 8.09-8.11 8.09zm4.44-6.07c-.24-.12-1.44-.71-1.66-.79-.22-.09-.39-.12-.55.12-.17.24-.63.79-.78.95-.14.16-.29.18-.53.06-.24-.12-1.02-.38-1.95-1.2-.72-.64-1.21-1.43-1.35-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43s-.55-1.33-.76-1.82c-.2-.48-.41-.41-.56-.42h-.48c-.16 0-.43.06-.66.31-.22.24-.87.85-.87 2.08 0 1.22.89 2.41 1.01 2.58.12.16 1.76 2.68 4.25 3.76.59.26 1.06.41 1.42.52.6.19 1.15.16 1.58.1.48-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28z"/>
                </svg>
                WhatsApp Business Link or Phone Number
              </label>
              <input
                id="whatsapp-input"
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={!canEdit}
                placeholder="+91 98290 12345 or https://wa.me/919829012345"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #CBD5E1',
                  backgroundColor: canEdit ? '#FFFFFF' : '#F8FAFC',
                  color: '#0F172A',
                  fontSize: 'var(--font-size-sm)',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                Enables users on the website to click and chat with your team on WhatsApp instantly.
              </span>
            </div>

            {/* Facebook */}
            <div>
              <label
                htmlFor="facebook-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: '#1877F2',
                  marginBottom: '6px',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                Facebook Page URL
              </label>
              <input
                id="facebook-input"
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                disabled={!canEdit}
                placeholder="https://facebook.com/yourbrand"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #CBD5E1',
                  backgroundColor: canEdit ? '#FFFFFF' : '#F8FAFC',
                  color: '#0F172A',
                  fontSize: 'var(--font-size-sm)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* X / Twitter & YouTube */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label
                  htmlFor="twitter-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    color: '#0F172A',
                    marginBottom: '6px',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X (Twitter) Profile
                </label>
                <input
                  id="twitter-input"
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://x.com/yourbrand"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #CBD5E1',
                    backgroundColor: canEdit ? '#FFFFFF' : '#F8FAFC',
                    color: '#0F172A',
                    fontSize: 'var(--font-size-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="youtube-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    color: '#DC2626',
                    marginBottom: '6px',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube Channel
                </label>
                <input
                  id="youtube-input"
                  type="url"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://youtube.com/@yourbrand"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #CBD5E1',
                    backgroundColor: canEdit ? '#FFFFFF' : '#F8FAFC',
                    color: '#0F172A',
                    fontSize: 'var(--font-size-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Contact & Location */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                3. Direct Inquiries & Contact Details
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: '#64748B', margin: '4px 0 0 0' }}>
                Official customer communication endpoints
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
              <div>
                <label
                  htmlFor="website-input"
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    color: '#0F172A',
                    marginBottom: '6px',
                  }}
                >
                  Official Website
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
                    border: '1px solid #CBD5E1',
                    backgroundColor: canEdit ? '#FFFFFF' : '#F8FAFC',
                    color: '#0F172A',
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
                    color: '#0F172A',
                    marginBottom: '6px',
                  }}
                >
                  Hotline / Phone Contact
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
                    border: '1px solid #CBD5E1',
                    backgroundColor: canEdit ? '#FFFFFF' : '#F8FAFC',
                    color: '#0F172A',
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
                    color: '#0F172A',
                    marginBottom: '6px',
                  }}
                >
                  Inquiry Email
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
                    border: '1px solid #CBD5E1',
                    backgroundColor: canEdit ? '#FFFFFF' : '#F8FAFC',
                    color: '#0F172A',
                    fontSize: 'var(--font-size-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="address-input"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: '#0F172A',
                  marginBottom: '6px',
                }}
              >
                Commercial Street Address
              </label>
              <input
                id="address-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!canEdit}
                placeholder="Suite, building, commercial district, city, pin code"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #CBD5E1',
                  backgroundColor: canEdit ? '#FFFFFF' : '#F8FAFC',
                  color: '#0F172A',
                  fontSize: 'var(--font-size-sm)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Submit Action */}
          {canEdit && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                paddingTop: 'var(--space-2)',
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: '#EA580C',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 800,
                  fontSize: 'var(--font-size-sm)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {saving ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="16" />
                    </svg>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Save & Update Profile
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {/* Live Public Preview Card (Sidebar) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', position: 'sticky', top: '100px' }}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Live Showcase Preview
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Public Website</span>
            </div>

            {/* Mocked Public Profile Card */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-base)', fontWeight: 800, color: '#0F172A' }}>
                    {business.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: '#475569', fontStyle: 'italic' }}>
                    &ldquo;{tagline || business.tagline || 'Positioning tagline will appear here'}&rdquo;
                  </p>
                </div>
                {isVerified && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                      border: '1px solid #A7F3D0',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-pill)',
                      flexShrink: 0,
                    }}
                  >
                    Verified ✓
                  </span>
                )}
              </div>

              {/* Contact endpoints */}
              <div
                style={{
                  marginTop: 'var(--space-4)',
                  paddingTop: 'var(--space-4)',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#475569',
                }}
              >
                {website && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 600 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                    </svg>
                    <span>{website.replace(/^https?:\/\//, '')}</span>
                  </div>
                )}
                {phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <span>{phone}</span>
                  </div>
                )}
                {address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{address}</span>
                  </div>
                )}
              </div>

              {/* Social Channels Preview */}
              <div
                style={{
                  marginTop: 'var(--space-4)',
                  paddingTop: 'var(--space-4)',
                  borderTop: '1px solid #E2E8F0',
                }}
              >
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', marginBottom: '8px', fontWeight: 700 }}>
                  Showcased Marketing Channels
                </div>
                {hasActiveSocials ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {instagram && (
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#FDF2F8', color: '#E1306C', fontWeight: 700, border: '1px solid #FCE7F3' }}>
                        Instagram
                      </span>
                    )}
                    {linkedin && (
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#EFF6FF', color: '#0A66C2', fontWeight: 700, border: '1px solid #DBEAFE' }}>
                        LinkedIn
                      </span>
                    )}
                    {whatsapp && (
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#F0FDF4', color: '#16A34A', fontWeight: 700, border: '1px solid #DCFCE7' }}>
                        WhatsApp Direct
                      </span>
                    )}
                    {facebook && (
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#EFF6FF', color: '#1877F2', fontWeight: 700, border: '1px solid #DBEAFE' }}>
                        Facebook
                      </span>
                    )}
                    {twitter && (
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#F8FAFC', color: '#0F172A', fontWeight: 700, border: '1px solid #E2E8F0' }}>
                        X (Twitter)
                      </span>
                    )}
                    {youtube && (
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: 700, border: '1px solid #FEE2E2' }}>
                        YouTube
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>
                    No social media links connected yet. Add your accounts to display them here!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Marketing Conversion Tips */}
          <div
            style={{
              backgroundColor: '#FFFBEB',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              border: '1px solid #FDE68A',
            }}
          >
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, color: '#92400E', margin: '0 0 8px 0' }}>
              Why Social Links Matter for AageOnline Visibility
            </h3>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: 'var(--font-size-xs)', color: '#78350F', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Higher Customer Trust:</strong> Commercial clients verify active social feeds to evaluate recent projects and customer feedback before reaching out.
              </li>
              <li>
                <strong>Instant Direct Inquiries:</strong> WhatsApp and Instagram direct links reduce inquiry friction, driving immediate customer conversions.
              </li>
              <li>
                <strong>Amplify Paid Positions:</strong> Businesses ranked at #1, #2, and #3 receive the highest click-through rates when their social channels are active and verified.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceProfilePage() {
  return (
    <Suspense fallback={<div style={{ color: '#FFFFFF', padding: 'var(--space-8)' }}>Loading profile editor...</div>}>
      <ProfileManagementContent />
    </Suspense>
  );
}
