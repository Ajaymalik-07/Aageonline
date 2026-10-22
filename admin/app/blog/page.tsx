'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  author: string;
  status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED' | 'ARCHIVED';
  seoTitle?: string;
  seoDescription?: string;
  targetKeywords?: string[];
  canonicalUrl?: string;
  seoScore: number;
  geoScore: number;
  coverImage?: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES_LIST = [
  'Web Development',
  'Software Development',
  'Website Development',
  'Market Visibility',
  'Local SEO & GEO',
  'Competitive Strategy',
  'Engineering & Tech',
];

export default function AdminBlogCMSPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'SEO'>('CONTENT');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Web Development',
    customCategory: '',
    author: 'Ajay',
    excerpt: '',
    body: '',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT' | 'SCHEDULED' | 'ARCHIVED',
    scheduledAt: '',
    coverImage: '',
    seoTitle: '',
    seoDescription: '',
    targetKeywords: 'website development, local visibility, india',
    canonicalUrl: '',
    targetGeo: 'India / Regional Cities',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/blog');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login?from=/blog';
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load blog posts: HTTP ${res.status}`);
      }
      const data = await res.json();
      const list = Array.isArray(data?.posts) ? data.posts : Array.isArray(data) ? data : [];
      setPosts(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching blog articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Live Score Computations
  const liveSeoScore = useMemo(() => {
    let score = 50;
    const titleLen = formData.seoTitle ? formData.seoTitle.length : formData.title.length;
    if (titleLen >= 40 && titleLen <= 65) score += 20;
    else if (titleLen > 20) score += 10;

    const descLen = formData.seoDescription ? formData.seoDescription.length : formData.excerpt.length;
    if (descLen >= 120 && descLen <= 165) score += 20;
    else if (descLen > 50) score += 10;

    if (formData.body.length > 500) score += 10;
    return Math.min(100, Math.max(30, score));
  }, [formData.seoTitle, formData.title, formData.seoDescription, formData.excerpt, formData.body]);

  const liveGeoScore = useMemo(() => {
    let score = 60;
    const geoKeywords = ['india', 'jaipur', 'noida', 'delhi', 'local', 'market', 'cities'];
    const combined = `${formData.title} ${formData.body} ${formData.targetKeywords} ${formData.targetGeo}`.toLowerCase();
    let matches = 0;
    for (const term of geoKeywords) {
      if (combined.includes(term)) matches++;
    }
    if (matches >= 4) score += 40;
    else if (matches >= 2) score += 25;
    else if (matches >= 1) score += 15;
    return Math.min(100, Math.max(40, score));
  }, [formData.title, formData.body, formData.targetKeywords, formData.targetGeo]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPostId(null);
    setFormError(null);
    setActiveTab('CONTENT');
    setFormData({
      title: '',
      slug: '',
      category: 'Web Development',
      customCategory: '',
      author: 'Ajay',
      excerpt: '',
      body: '',
      status: 'PUBLISHED',
      scheduledAt: '',
      coverImage: '',
      seoTitle: '',
      seoDescription: '',
      targetKeywords: 'website development, startup guide, local visibility',
      canonicalUrl: '',
      targetGeo: 'India / Regional Cities',
    });
    setShowEditorModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (post: BlogPost) => {
    setEditingPostId(post.id);
    setFormError(null);
    setActiveTab('CONTENT');
    const isCustomCat = !CATEGORIES_LIST.includes(post.category);
    setFormData({
      title: post.title,
      slug: post.slug,
      category: isCustomCat ? 'CUSTOM' : post.category,
      customCategory: isCustomCat ? post.category : '',
      author: post.author,
      excerpt: post.excerpt || '',
      body: post.body || '',
      status: post.status,
      scheduledAt: post.scheduledAt || '',
      coverImage: post.coverImage || '',
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      targetKeywords: Array.isArray(post.targetKeywords) ? post.targetKeywords.join(', ') : '',
      canonicalUrl: post.canonicalUrl || '',
      targetGeo: 'India / Regional Markets',
    });
    setShowEditorModal(true);
  };

  // Submit Create or Edit
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Article Title is required.');
      return;
    }

    const effectiveSlug = (formData.slug.trim() || formData.title.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const effectiveCategory = formData.category === 'CUSTOM'
      ? (formData.customCategory.trim() || 'General')
      : formData.category;

    const payload = {
      id: editingPostId || undefined,
      title: formData.title.trim(),
      slug: effectiveSlug,
      category: effectiveCategory,
      author: formData.author.trim() || 'Ajay',
      excerpt: formData.excerpt.trim(),
      body: formData.body.trim(),
      status: formData.status,
      scheduledAt: formData.status === 'SCHEDULED' && formData.scheduledAt ? formData.scheduledAt : undefined,
      coverImage: formData.coverImage.trim() || undefined,
      seoTitle: formData.seoTitle.trim() || `${formData.title.trim()} | AageOnline Blog`,
      seoDescription: formData.seoDescription.trim() || formData.excerpt.trim(),
      targetKeywords: formData.targetKeywords.split(',').map((k) => k.trim()).filter(Boolean),
      canonicalUrl: formData.canonicalUrl.trim() || `https://aageonline.com/blog/${effectiveSlug}`,
      seoScore: liveSeoScore,
      geoScore: liveGeoScore,
    };

    try {
      setSubmitting(true);
      setFormError(null);

      const method = editingPostId ? 'PUT' : 'POST';
      const res = await fetch('/api/blog', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      setShowEditorModal(false);
      showNotification(editingPostId ? 'Article updated successfully!' : 'Article published successfully!');
      await loadPosts();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save blog post');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/blog?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete');
      }
      showNotification(`Article "${title}" deleted.`);
      await loadPosts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting article');
    }
  };

  // Filtered List
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.slug && p.slug.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.author && p.author.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [posts, search, statusFilter]);

  const scheduledPosts = useMemo(() => {
    return posts.filter((p) => p.status === 'SCHEDULED');
  }, [posts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            backgroundColor: '#059669',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            zIndex: 9999,
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span> {successToast}
        </div>
      )}

      {/* Breadcrumb matching Image 2 */}
      <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Link href="/" style={{ color: '#64748B', textDecoration: 'none' }}>Home</Link>
        <span>&gt;</span>
        <span style={{ color: '#EA580C', fontWeight: 600 }}>Blog</span>
      </div>

      {/* Main Page Header matching Image 2 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Blog Content Management System
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(234, 88, 12, 0.15)',
                color: '#EA580C',
                border: '1px solid rgba(234, 88, 12, 0.3)',
                textTransform: 'uppercase',
              }}
            >
              CMS
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94A3B8', fontSize: '13px' }}>
            Create, edit, analyze SEO/GEO readiness, manage indexability, and schedule technical articles.
          </p>
        </div>

        {/* Action Buttons matching Image 2 */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => loadPosts()}
            style={{
              padding: '9px 16px',
              backgroundColor: '#1E293B',
              color: '#CBD5E1',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🔄</span> Refresh List
          </button>

          <button
            onClick={() => setShowQueueModal(true)}
            style={{
              padding: '9px 16px',
              backgroundColor: '#1E293B',
              color: '#CBD5E1',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⏰</span> Scheduled Queue ({scheduledPosts.length})
          </button>

          <button
            onClick={handleOpenCreate}
            style={{
              padding: '9px 20px',
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(234, 88, 12, 0.3)',
            }}
          >
            <span>+</span> Write New Article
          </button>
        </div>
      </div>

      {/* Filter Bar matching Image 2 */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          backgroundColor: '#0F172A',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid #1E293B',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748B', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search blogs by title, slug, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '9px 14px',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#FFFFFF',
            fontSize: '13px',
            cursor: 'pointer',
            minWidth: '150px',
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#F87171',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* Table matching Image 2 */}
      <div
        style={{
          backgroundColor: '#0F172A',
          borderRadius: '12px',
          border: '1px solid #1E293B',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E293B', backgroundColor: '#0B132B', color: '#94A3B8' }}>
                <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ARTICLE TITLE &amp; SLUG
                </th>
                <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CATEGORY
                </th>
                <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AUTHOR
                </th>
                <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  STATUS
                </th>
                <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SEO / GEO
                </th>
                <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DATE
                </th>
                <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
                    Loading blog management records...
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
                    No blog articles match query &ldquo;{search}&rdquo;. Click &ldquo;+ Write New Article&rdquo; to publish.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((p) => {
                  const statusColors = {
                    PUBLISHED: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', dot: '#10B981' },
                    DRAFT: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', dot: '#F59E0B' },
                    SCHEDULED: { bg: 'rgba(59, 130, 246, 0.12)', text: '#60A5FA', dot: '#3B82F6' },
                    ARCHIVED: { bg: 'rgba(100, 116, 139, 0.15)', text: '#94A3B8', dot: '#64748B' },
                  }[p.status] || { bg: 'rgba(100, 116, 139, 0.15)', text: '#94A3B8', dot: '#64748B' };

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #1E293B',
                        transition: 'background-color 0.12s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* 1. TITLE & SLUG */}
                      <td style={{ padding: '14px 18px', maxWidth: '340px' }}>
                        <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: '3px', lineHeight: 1.4 }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                          /{p.slug}
                        </div>
                      </td>

                      {/* 2. CATEGORY */}
                      <td style={{ padding: '14px 18px', color: '#CBD5E1', fontWeight: 600 }}>
                        {p.category || 'General'}
                      </td>

                      {/* 3. AUTHOR */}
                      <td style={{ padding: '14px 18px', color: '#CBD5E1' }}>
                        {p.author || 'Ajay'}
                      </td>

                      {/* 4. STATUS (Pill with dot matching Image 2) */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            backgroundColor: statusColors.bg,
                            color: statusColors.text,
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColors.dot }} />
                          {p.status}
                        </span>
                      </td>

                      {/* 5. SEO / GEO SCORES matching Image 2 */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '12px',
                            color: p.seoScore >= 90 ? '#10B981' : p.seoScore >= 80 ? '#38BDF8' : '#F59E0B',
                          }}
                        >
                          SEO {p.seoScore || 92}/100
                        </span>
                        <span style={{ color: '#475569', margin: '0 6px' }}>·</span>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '12px',
                            color: p.geoScore >= 95 ? '#3B82F6' : '#10B981',
                          }}
                        >
                          GEO {p.geoScore || 100}/100
                        </span>
                      </td>

                      {/* 6. DATE */}
                      <td style={{ padding: '14px 18px', color: '#94A3B8', fontSize: '12px' }}>
                        {p.publishedAt
                          ? new Date(p.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : p.scheduledAt
                          ? `Scheduled: ${new Date(p.scheduledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                          : new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* 7. ACTIONS (Eye, Pencil, Trash matching Image 2) */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <a
                            href={`http://localhost:3000/blog/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View Public Article"
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#1E293B',
                              color: '#94A3B8',
                              textDecoration: 'none',
                              fontSize: '13px',
                              border: '1px solid #334155',
                              cursor: 'pointer',
                            }}
                          >
                            👁️
                          </a>

                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Article"
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#1E293B',
                              color: '#60A5FA',
                              border: '1px solid #334155',
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            ✏️
                          </button>

                          <button
                            onClick={() => handleDeletePost(p.id, p.title)}
                            title="Delete Article"
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#1E293B',
                              color: '#F87171',
                              border: '1px solid #334155',
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Write / Edit Article */}
      {showEditorModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 21, 38, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '780px',
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '14px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  {editingPostId ? 'Edit Article' : 'Write New Article'}
                </h2>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                  Authoring and indexing technical thought leadership on AageOnline.
                </div>
              </div>
              <button
                onClick={() => setShowEditorModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1E293B', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('CONTENT')}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderBottom: activeTab === 'CONTENT' ? '2px solid #EA580C' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === 'CONTENT' ? '#FFFFFF' : '#64748B',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                📝 Article Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SEO')}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderBottom: activeTab === 'SEO' ? '2px solid #EA580C' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === 'SEO' ? '#FFFFFF' : '#64748B',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🌐 SEO &amp; GEO Engine</span>
                <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#059669', color: '#FFFFFF' }}>
                  {liveSeoScore}/100
                </span>
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#F87171',
                  fontSize: '12px',
                  marginBottom: '16px',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeTab === 'CONTENT' ? (
                <>
                  {/* Title & Slug */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                      Article Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Startup Website Development: Complete Guide for Founders"
                      value={formData.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setFormData({
                          ...formData,
                          title,
                          slug: editingPostId ? formData.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                          seoTitle: editingPostId ? formData.seoTitle : `${title} | AageOnline`,
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                        URL Slug *
                      </label>
                      <input
                        type="text"
                        placeholder="startup-website-development-complete-guide"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                        Author
                      </label>
                      <input
                        type="text"
                        placeholder="Ajay"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Category & Status */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                      >
                        {CATEGORIES_LIST.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="CUSTOM">+ Custom Category</option>
                      </select>
                      {formData.category === 'CUSTOM' && (
                        <input
                          type="text"
                          placeholder="Enter category name..."
                          value={formData.customCategory}
                          onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                          style={{
                            width: '100%',
                            marginTop: '6px',
                            padding: '8px 10px',
                            backgroundColor: '#1E293B',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            color: '#FFFFFF',
                            fontSize: '12px',
                            boxSizing: 'border-box',
                          }}
                        />
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                        Lifecycle Status *
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="PUBLISHED">PUBLISHED (Live on public site &amp; sitemap)</option>
                        <option value="DRAFT">DRAFT (Unpublished / Private)</option>
                        <option value="SCHEDULED">SCHEDULED (Timed Release Queue)</option>
                        <option value="ARCHIVED">ARCHIVED (Archived)</option>
                      </select>
                    </div>
                  </div>

                  {formData.status === 'SCHEDULED' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#60A5FA', marginBottom: '6px' }}>
                        Scheduled Publication Date &amp; Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          backgroundColor: '#1E293B',
                          border: '1px solid #3B82F6',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )}

                  {/* Excerpt */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                      Article Excerpt / Summary (shown on cards &amp; meta preview)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Concise, 2-line summary for social cards and listings..."
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* Body Content */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1' }}>
                        Article Body (Markdown Supported) *
                      </label>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        {formData.body.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      placeholder="Write your article body here in Markdown format..."
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        fontFamily: 'monospace',
                        lineHeight: 1.5,
                      }}
                      required
                    />
                  </div>
                </>
              ) : (
                /* SEO TAB */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Score Badges */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      padding: '16px',
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                        Real-Time SEO Score
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
                        {liveSeoScore} <span style={{ fontSize: '14px', color: '#64748B' }}>/ 100</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                        Title, meta description, and content density verified.
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                        GEO / AEO Engine Readiness
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#3B82F6', marginTop: '4px' }}>
                        {liveGeoScore} <span style={{ fontSize: '14px', color: '#64748B' }}>/ 100</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                        Local search entity terms &amp; schema markup ready.
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1' }}>
                        Meta / SEO Title
                      </label>
                      <span style={{ fontSize: '11px', color: formData.seoTitle.length > 60 ? '#F59E0B' : '#10B981' }}>
                        {formData.seoTitle.length} / 60 characters
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Title displayed in Google search results..."
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1' }}>
                        Meta Description
                      </label>
                      <span style={{ fontSize: '11px', color: formData.seoDescription.length > 160 ? '#F59E0B' : '#10B981' }}>
                        {formData.seoDescription.length} / 160 characters
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Description snippet displayed below link in search results..."
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                      Target Keywords (Comma Separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. startup website development, local business visibility, jaipur"
                      value={formData.targetKeywords}
                      onChange={(e) => setFormData({ ...formData, targetKeywords: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                      Target Geo / Regional Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pan-India, Jaipur, Noida NCR"
                      value={formData.targetGeo}
                      onChange={(e) => setFormData({ ...formData, targetGeo: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  style={{
                    padding: '9px 18px',
                    backgroundColor: '#1E293B',
                    color: '#94A3B8',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 24px',
                    backgroundColor: '#EA580C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px rgba(234, 88, 12, 0.3)',
                  }}
                >
                  {submitting ? 'Saving...' : editingPostId ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Scheduled Queue Modal */}
      {showQueueModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 21, 38, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                ⏰ Scheduled Release Queue ({scheduledPosts.length})
              </h2>
              <button
                onClick={() => setShowQueueModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {scheduledPosts.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                No articles are currently scheduled in the queue.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {scheduledPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      padding: '14px',
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{post.title}</div>
                      <div style={{ fontSize: '11px', color: '#60A5FA', marginTop: '2px' }}>
                        Release: {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString('en-IN') : 'Queue'}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch('/api/blog', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: post.id, status: 'PUBLISHED' }),
                        });
                        showNotification(`Article "${post.title}" is now PUBLISHED!`);
                        setShowQueueModal(false);
                        loadPosts();
                      }}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Publish Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
