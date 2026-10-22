'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  seoTitle?: string;
  seoDescription?: string;
  targetKeywords?: string[];
  canonicalUrl?: string;
  seoScore?: number;
  geoScore?: number;
  publishedAt?: string;
  createdAt?: string;
}

export default function BlogPostReaderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function loadPost() {
      try {
        const res = await fetch(`/api/blog/${slug}`);
        if (!res.ok) {
          throw new Error('Article not found or not yet published.');
        }
        const data = await res.json();
        setPost(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid #cbd5e1', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem', fontSize: '1rem' }}>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '2rem' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center', background: '#ffffff', padding: '3rem 2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>Article Not Found</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            The requested article could not be located. It may have been renamed, archived, or is still awaiting publication.
          </p>
          <Link
            href="/blog"
            style={{ display: 'inline-block', background: '#ea580c', color: '#ffffff', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}
          >
            ← Back to All Articles
          </Link>
        </div>
      </div>
    );
  }

  // Basic markdown-like rendering for headings and bullet points
  const renderFormattedBody = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#### ')) {
        return (
          <h4 key={idx} style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            {trimmed.replace('#### ', '')}
          </h4>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '2rem', marginBottom: '0.75rem' }}>
            {trimmed.replace('### ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '2.5rem', marginBottom: '1rem' }}>
            {trimmed.replace('## ', '')}
          </h2>
        );
      }
      if (trimmed.startsWith('- ')) {
        return (
          <li key={idx} style={{ marginLeft: '1.25rem', marginBottom: '0.5rem', color: '#334155', lineHeight: 1.6 }}>
            {trimmed.replace('- ', '')}
          </li>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <li key={idx} style={{ marginLeft: '1.25rem', marginBottom: '0.5rem', color: '#334155', lineHeight: 1.6 }}>
            {trimmed.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={idx} style={{ height: '0.75rem' }} />;
      }
      return (
        <p key={idx} style={{ fontSize: '1.05rem', lineHeight: 1.75, color: '#334155', marginBottom: '1rem' }}>
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      {/* Article Top Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0b1f3b 0%, #071526 100%)',
          color: '#ffffff',
          padding: 'clamp(3rem, 5vw, 4.5rem) 1rem 3rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link href="/blog" style={{ color: '#94a3b8', textDecoration: 'none' }}>Blog</Link>
            <span>/</span>
            <span style={{ color: '#ea580c', fontWeight: 600 }}>{post.category}</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ background: 'rgba(234, 88, 12, 0.2)', color: '#fb923c', border: '1px solid rgba(234, 88, 12, 0.4)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', textTransform: 'uppercase' }}>
              {post.category}
            </span>
            {post.seoScore && (
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem' }}>
                SEO {post.seoScore}/100
              </span>
            )}
            {post.geoScore && (
              <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem' }}>
                GEO {post.geoScore}/100
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              marginBottom: '1.25rem',
            }}
          >
            {post.title}
          </h1>

          <p
            style={{
              fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
              color: '#cbd5e1',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            {post.excerpt}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>
              {post.author.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>{post.author}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Published on {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Recent'} · 6 min read
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Body Layout */}
      <main style={{ maxWidth: '840px', margin: '0 auto', padding: '3rem 1rem 5rem 1rem' }}>
        <article
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: 'clamp(1.75rem, 4vw, 3rem)',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
            marginBottom: '3rem',
          }}
        >
          {renderFormattedBody(post.body)}

          {/* Keywords footer */}
          {post.targetKeywords && post.targetKeywords.length > 0 && (
            <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Target Keywords & Entities
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {post.targetKeywords.map((kw) => (
                  <span key={kw} style={{ background: '#f1f5f9', color: '#334155', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.825rem', fontWeight: 500 }}>
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Author Bio Box */}
        <div
          style={{
            background: '#0f172a',
            color: '#ffffff',
            borderRadius: '14px',
            padding: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1.5rem',
            marginBottom: '3rem',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem' }}>
            {post.author.charAt(0)}
          </div>
          <div style={{ flex: '1 1 240px' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{post.author}</div>
            <div style={{ fontSize: '0.85rem', color: '#ea580c', fontWeight: 600, marginBottom: '0.5rem' }}>Technical & Growth Architect at AageOnline</div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Specializes in localized search engine optimization, generative engine optimization (GEO), and high-throughput transactional architectures for regional Indian business markets.
            </p>
          </div>
        </div>

        {/* Navigation back */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link
            href="/blog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#ea580c',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            ← Back to All Articles
          </Link>

          <Link
            href="/"
            style={{
              color: '#64748b',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            Explore Market Rankings →
          </Link>
        </div>
      </main>
    </div>
  );
}
