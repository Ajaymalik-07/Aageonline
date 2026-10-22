/**
 * AageOnline Admin — Canonical In-Memory Blog Store
 * Milestone 0.20.24: Blog Content Management System (Image 2 Parity)
 *
 * Provides authoritative blog persistence and offline-safe fallback for admin operations:
 * - Full CRUD: getPosts, getPostById, createPost, updatePost, deletePost
 * - SEO (0-100) and GEO (0-100) real-time score derivation
 * - Status states: PUBLISHED, DRAFT, SCHEDULED, ARCHIVED
 */

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

export function computeSeoScore(title: string, desc: string, body: string, keywords: string[]): number {
  let score = 50;
  if (title.length >= 40 && title.length <= 65) score += 15;
  else if (title.length > 20) score += 8;

  if (desc.length >= 120 && desc.length <= 165) score += 15;
  else if (desc.length > 50) score += 8;

  if (body.length > 600) score += 10;
  else if (body.length > 200) score += 5;

  if (keywords.length >= 2) score += 10;
  return Math.min(100, Math.max(30, score));
}

export function computeGeoScore(title: string, body: string, keywords: string[]): number {
  let score = 60;
  const geoTerms = ['india', 'jaipur', 'noida', 'delhi', 'mumbai', 'local', 'market', 'regional', 'cities', 'city'];
  const text = `${title} ${body} ${keywords.join(' ')}`.toLowerCase();
  let matches = 0;
  for (const term of geoTerms) {
    if (text.includes(term)) matches++;
  }
  if (matches >= 4) score += 40;
  else if (matches >= 2) score += 25;
  else if (matches >= 1) score += 15;
  return Math.min(100, Math.max(40, score));
}

const INITIAL_POSTS: BlogPost[] = [
  {
    id: 'blg-001',
    slug: 'startup-website-development-complete-guide',
    title: 'Startup Website Development: Complete Guide for Founders',
    category: 'Web Development',
    excerpt: 'Comprehensive architectural blueprint for modern businesses and founders looking to establish market authority and high-converting local presence in India.',
    body: 'Building a high-performing digital presence in competitive markets requires speed, deterministic local SEO structure, and transparent customer trust indicators. This guide covers responsive UI engineering, localized schema markup, and conversion funnel optimization.',
    author: 'Ajay',
    status: 'PUBLISHED',
    seoTitle: 'Startup Website Development: Complete Guide for Founders | AageOnline',
    seoDescription: 'Authoritative guide for founders on architecting high-converting business websites with localized visibility and verified rankings.',
    targetKeywords: ['website development', 'startup guide', 'local visibility', 'market discovery'],
    canonicalUrl: 'https://aageonline.com/blog/startup-website-development-complete-guide',
    seoScore: 92,
    geoScore: 100,
    publishedAt: '2026-09-30T09:00:00Z',
    createdAt: '2026-09-28T10:00:00Z',
    updatedAt: '2026-09-30T09:00:00Z',
  },
  {
    id: 'blg-002',
    slug: 'custom-software-development-vs-off-the-shelf-software',
    title: 'Custom Software Development vs Off-the-Shelf Software: Strategic Analysis',
    category: 'Software Development',
    excerpt: 'Evaluate the ROI, scaling limits, vendor lock-in risks, and maintenance total cost of ownership between bespoke software engineering and canned SaaS.',
    body: 'Enterprise scale demands high operational agility. Comparing off-the-shelf subscriptions with custom proprietary platforms across security compliance, database ownership, and total cost of ownership.',
    author: 'Ajay',
    status: 'PUBLISHED',
    seoTitle: 'Custom Software vs Off-the-Shelf Solutions | Tech Analysis',
    seoDescription: 'Strategic breakdown of custom bespoke architecture versus packaged SaaS for growing businesses.',
    targetKeywords: ['custom software', 'SaaS vs custom', 'enterprise software', 'software architecture'],
    canonicalUrl: 'https://aageonline.com/blog/custom-software-development-vs-off-the-shelf-software',
    seoScore: 92,
    geoScore: 100,
    publishedAt: '2026-09-29T11:00:00Z',
    createdAt: '2026-09-27T14:00:00Z',
    updatedAt: '2026-09-29T11:00:00Z',
  },
  {
    id: 'blg-003',
    slug: 'website-development-company-in-noida-what-businesses-look-for',
    title: 'Website Development Company in Noida: What Businesses Need to Look For',
    category: 'Web Development',
    excerpt: 'Strategic criteria for commercial enterprises in Delhi NCR choosing verified engineering partners, contract terms, and local visibility guarantees.',
    body: 'Commercial enterprises in Noida and the NCR region face intense market density. Choosing an engineering partner requires evaluating verified delivery records, transparent ranking positioning, and verifiable local customer reach.',
    author: 'Ajay',
    status: 'PUBLISHED',
    seoTitle: 'Website Development in Noida: Enterprise Evaluation Guide',
    seoDescription: 'Key criteria for commercial businesses choosing local technology and visibility partners in Noida and Delhi NCR.',
    targetKeywords: ['noida website development', 'delhi ncr business', 'verified partners'],
    canonicalUrl: 'https://aageonline.com/blog/website-development-company-in-noida-what-businesses-look-for',
    seoScore: 92,
    geoScore: 100,
    publishedAt: '2026-09-23T08:30:00Z',
    createdAt: '2026-09-21T12:00:00Z',
    updatedAt: '2026-09-23T08:30:00Z',
  },
  {
    id: 'blg-004',
    slug: 'how-to-choose-a-website-development-company-in-india',
    title: 'How to Choose a Website Development Company In India',
    category: 'Website Development',
    excerpt: 'Avoid opaque contracts, hidden maintenance markups, and vanity metrics by using this battle-tested vendor selection scorecard.',
    body: 'Navigating India’s diverse IT vendor landscape requires objective benchmarks: code ownership, verified technical SLAs, database portability, and guaranteed position transparency.',
    author: 'Ajay',
    status: 'PUBLISHED',
    seoTitle: 'How to Choose a Web Development Agency in India | Selection Framework',
    seoDescription: 'Battle-tested vendor selection guide for choosing trusted web development companies across India.',
    targetKeywords: ['web development company india', 'vendor scorecard', 'business technology'],
    canonicalUrl: 'https://aageonline.com/blog/how-to-choose-a-website-development-company-in-india',
    seoScore: 82,
    geoScore: 95,
    publishedAt: '2026-09-22T10:00:00Z',
    createdAt: '2026-09-20T16:00:00Z',
    updatedAt: '2026-09-22T10:00:00Z',
  },
  {
    id: 'blg-005',
    slug: 'how-much-does-website-development-cost-in-india-in-2026',
    title: 'How Much Does Website Development Cost In India In 2026',
    category: 'Website Development',
    excerpt: 'Detailed pricing breakdowns across landing pages, e-commerce platforms, custom web apps, and competitive market positioning.',
    body: 'Transparent cost analysis of web engineering in India in 2026, including modern Next.js stacks, cloud database hosting, domain security, and local SEO ranking investments.',
    author: 'Ajay',
    status: 'PUBLISHED',
    seoTitle: 'Website Development Cost in India (2026 Pricing Guide)',
    seoDescription: 'Realistic cost breakdown for building professional business websites and local visibility platforms in India.',
    targetKeywords: ['website development cost india', '2026 pricing', 'web development budget'],
    canonicalUrl: 'https://aageonline.com/blog/how-much-does-website-development-cost-in-india-in-2026',
    seoScore: 92,
    geoScore: 95,
    publishedAt: '2026-09-21T09:15:00Z',
    createdAt: '2026-09-18T11:00:00Z',
    updatedAt: '2026-09-21T09:15:00Z',
  },
  {
    id: 'blg-006',
    slug: 'transparent-local-market-visibility-in-india',
    title: 'Why Transparent Paid Visibility is the Future of Local Business Discovery',
    category: 'Market Visibility',
    excerpt: 'How modern businesses are shifting from black-box ad auctions to deterministic local market position ladders.',
    body: 'In an era of opaque algorithms, businesses in tier-1 and tier-2 Indian cities require clear, predictable visibility inside well-defined geographic markets. This article explores how AageOnline guarantees deterministic position ranking with zero speculative bidding.',
    author: 'Ajay',
    status: 'PUBLISHED',
    seoTitle: 'Transparent Local Market Visibility in India | AageOnline Blog',
    seoDescription: 'Discover why deterministic position ranking outperforms black-box pay-per-click ad networks for local businesses.',
    targetKeywords: ['local business visibility', 'market transparency', 'ranking ladder'],
    canonicalUrl: 'https://aageonline.com/blog/transparent-local-market-visibility-in-india',
    seoScore: 94,
    geoScore: 100,
    publishedAt: '2026-10-10T09:00:00Z',
    createdAt: '2026-10-08T12:00:00Z',
    updatedAt: '2026-10-10T09:00:00Z',
  },
  {
    id: 'blg-007',
    slug: 'atomic-ranking-concurrency-explained',
    title: 'Understanding Atomic Concurrency in Business Ranking Ladders',
    category: 'Engineering & Tech',
    excerpt: 'A technical deep-dive into row-level locking, race conditions, and financial ledger idempotency.',
    body: 'How PostgreSQL row-level locks prevent race conditions during high-velocity position shifts while guaranteeing append-only financial audit trails.',
    author: 'Ajay',
    status: 'DRAFT',
    seoTitle: 'Atomic Ranking Concurrency Explained | AageOnline Tech',
    seoDescription: 'Technical breakdown of row-level market locking and transaction finality.',
    targetKeywords: ['concurrency', 'postgres locking', 'financial ledger'],
    canonicalUrl: 'https://aageonline.com/blog/atomic-ranking-concurrency-explained',
    seoScore: 88,
    geoScore: 80,
    createdAt: '2026-10-12T15:00:00Z',
    updatedAt: '2026-10-12T15:00:00Z',
  },
];

const BLOG_STORE: Map<string, BlogPost> = new Map();
for (const p of INITIAL_POSTS) {
  BLOG_STORE.set(p.id, p);
}

export function getAllPosts(): BlogPost[] {
  return Array.from(BLOG_STORE.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getPostByIdOrSlug(idOrSlug: string): BlogPost | undefined {
  const norm = idOrSlug.trim().toLowerCase();
  for (const p of BLOG_STORE.values()) {
    if (p.id.toLowerCase() === norm || p.slug.toLowerCase() === norm) {
      return p;
    }
  }
  return undefined;
}

export function createPost(input: Partial<BlogPost>): BlogPost {
  const now = new Date().toISOString();
  const title = input.title?.trim() || 'Untitled Article';
  const slug = (input.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const keywords = Array.isArray(input.targetKeywords)
    ? input.targetKeywords
    : typeof input.targetKeywords === 'string'
    ? (input.targetKeywords as string).split(',').map((k) => k.trim())
    : [];

  const post: BlogPost = {
    id: `blg-${Date.now()}`,
    slug,
    title,
    category: input.category?.trim() || 'Web Development',
    excerpt: input.excerpt?.trim() || '',
    body: input.body?.trim() || '',
    author: input.author?.trim() || 'Ajay',
    status: input.status || 'DRAFT',
    seoTitle: input.seoTitle?.trim() || `${title} | AageOnline Blog`,
    seoDescription: input.seoDescription?.trim() || input.excerpt?.trim() || '',
    targetKeywords: keywords,
    canonicalUrl: `https://aageonline.com/blog/${slug}`,
    seoScore: computeSeoScore(title, input.seoDescription || input.excerpt || '', input.body || '', keywords),
    geoScore: computeGeoScore(title, input.body || '', keywords),
    coverImage: input.coverImage?.trim() || undefined,
    scheduledAt: input.scheduledAt || undefined,
    publishedAt: input.status === 'PUBLISHED' ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };

  BLOG_STORE.set(post.id, post);
  return post;
}

export function updatePost(id: string, input: Partial<BlogPost>): BlogPost {
  const existing = getPostByIdOrSlug(id);
  if (!existing) {
    throw new Error(`Blog post with ID or slug "${id}" not found.`);
  }

  const now = new Date().toISOString();
  const title = input.title !== undefined ? input.title.trim() : existing.title;
  const slug = input.slug !== undefined ? input.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : existing.slug;
  const rawKeywords: any = input.targetKeywords;
  const keywords = Array.isArray(rawKeywords)
    ? rawKeywords
    : typeof rawKeywords === 'string'
    ? (rawKeywords as string).split(',').map((k: string) => k.trim()).filter(Boolean)
    : existing.targetKeywords || [];

  const updated: BlogPost = {
    ...existing,
    title,
    slug,
    category: input.category !== undefined ? input.category.trim() : existing.category,
    excerpt: input.excerpt !== undefined ? input.excerpt.trim() : existing.excerpt,
    body: input.body !== undefined ? input.body.trim() : existing.body,
    author: input.author !== undefined ? input.author.trim() : existing.author,
    status: input.status !== undefined ? input.status : existing.status,
    scheduledAt: input.scheduledAt !== undefined ? input.scheduledAt : existing.scheduledAt,
    seoTitle: input.seoTitle !== undefined ? input.seoTitle.trim() : existing.seoTitle,
    seoDescription: input.seoDescription !== undefined ? input.seoDescription.trim() : existing.seoDescription,
    targetKeywords: keywords,
    canonicalUrl: `https://aageonline.com/blog/${slug}`,
    seoScore: computeSeoScore(title, input.seoDescription || existing.seoDescription || '', input.body || existing.body || '', keywords),
    geoScore: computeGeoScore(title, input.body || existing.body || '', keywords),
    coverImage: input.coverImage !== undefined ? input.coverImage.trim() : existing.coverImage,
    publishedAt: input.status === 'PUBLISHED' && !existing.publishedAt ? now : existing.publishedAt,
    updatedAt: now,
  };

  BLOG_STORE.set(existing.id, updated);
  return updated;
}

export function deletePost(id: string): BlogPost {
  const existing = getPostByIdOrSlug(id);
  if (!existing) {
    throw new Error(`Blog post with ID or slug "${id}" not found.`);
  }
  BLOG_STORE.delete(existing.id);
  return existing;
}
