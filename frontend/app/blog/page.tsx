'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  author: string;
  status: string;
  publishedAt?: string;
  targetKeywords?: string[];
  seoScore?: number;
  geoScore?: number;
}

export default function BlogIndexPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await fetch('/api/blog');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.posts)) {
            setPosts(data.posts);
          }
        }
      } catch (err) {
        console.error('Failed to load blog posts', err);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const categories = ['All', ...Array.from(new Set(posts.map((p) => p.category)))];

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      post.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      {/* Editorial Header Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0b1f3b 0%, #071526 100%)',
          color: '#ffffff',
          padding: 'clamp(3rem, 6vw, 5rem) 1rem',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(234, 88, 12, 0.15)', border: '1px solid rgba(234, 88, 12, 0.4)', borderRadius: '999px', padding: '0.35rem 0.85rem', marginBottom: '1.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', color: '#ffedd5', textTransform: 'uppercase' }}>
              AageOnline Editorial & Tech Insights
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
              maxWidth: '900px',
            }}
          >
            Strategic Insights for Modern Indian Enterprises
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
              color: '#94a3b8',
              maxWidth: '720px',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            Authoritative guides, software architecture benchmarks, localized SEO algorithms, and transparent market positioning for Indian founders and engineers.
          </p>

          {/* Search bar & Filter Pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              padding: '0.75rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
              maxWidth: '820px',
            }}
          >
            <div style={{ flex: '1 1 280px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search articles by title, keyword, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.925rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: '1px solid',
                    borderColor: selectedCategory === cat ? '#ea580c' : 'rgba(255, 255, 255, 0.15)',
                    background: selectedCategory === cat ? '#ea580c' : 'rgba(255, 255, 255, 0.05)',
                    color: selectedCategory === cat ? '#ffffff' : '#cbd5e1',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1rem' }}>
        {loading ? (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: '#64748b' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #cbd5e1', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', fontSize: '0.95rem' }}>Loading latest articles...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#334155' }}>No articles matched your criteria.</p>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Try clearing the search query or selecting a different category.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              style={{ marginTop: '1.25rem', padding: '0.6rem 1.25rem', background: '#ea580c', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Featured Hero Article */}
            {featuredPost && (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                  marginBottom: '3rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    padding: '2.5rem',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ display: 'inline-block', background: 'rgba(234, 88, 12, 0.2)', color: '#fb923c', border: '1px solid rgba(234, 88, 12, 0.4)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                      Featured Guide
                    </span>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, lineHeight: 1.25, color: '#ffffff', marginBottom: '1rem' }}>
                      {featuredPost.title}
                    </h2>
                    <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                        {featuredPost.author.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>{featuredPost.author}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {featuredPost.publishedAt ? new Date(featuredPost.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently Published'} · 5 min read
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${featuredPost.slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#ea580c',
                        color: '#ffffff',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      Read Full Article →
                    </Link>
                  </div>
                </div>

                <div
                  style={{
                    padding: '2.5rem',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    borderLeft: '1px solid #e2e8f0',
                  }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
                    What You Will Discover
                  </h3>
                  <ul style={{ paddingLeft: '1.25rem', color: '#475569', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
                    <li>Sub-second Core Web Vitals architectural checklist for Next.js and Cloudflare.</li>
                    <li>Deterministic schema markup strategies for local entity citation.</li>
                    <li>How verified Location + Category positioning accelerates customer trust.</li>
                    <li>Avoiding opaque agency retainers with verifiable code ownership.</li>
                  </ul>
                  {featuredPost.targetKeywords && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {featuredPost.targetKeywords.map((kw) => (
                        <span key={kw} style={{ background: '#e2e8f0', color: '#475569', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: 500 }}>
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Articles Grid */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>
                All Technical & Strategic Articles ({regularPosts.length + (featuredPost ? 1 : 0)})
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.75rem',
                }}
              >
                {regularPosts.map((post) => (
                  <article
                    key={post.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      padding: '1.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {post.category}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.35, marginBottom: '0.75rem' }}>
                        <Link
                          href={`/blog/${post.slug}`}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {post.title}
                        </Link>
                      </h3>

                      <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                        {post.excerpt}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                            {post.author.charAt(0)}
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>{post.author}</span>
                        </div>

                        <Link
                          href={`/blog/${post.slug}`}
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#ea580c',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          Read Article →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
