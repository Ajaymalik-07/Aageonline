import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000';

const FALLBACK_POSTS: Record<string, any> = {
  'startup-website-development-complete-guide': {
    id: 'blg-001',
    slug: 'startup-website-development-complete-guide',
    title: 'Startup Website Development: Complete Guide for Founders',
    category: 'Web Development',
    excerpt: 'Comprehensive architectural blueprint for modern businesses and founders looking to establish market authority and high-converting local presence in India.',
    body: `### Building a High-Performance Digital Flagship

For modern founders and business leaders across India, establishing a high-converting digital presence is no longer just about deploying an aesthetic brochure site. It requires deterministic engineering, verifiable local discoverability, and transparent customer trust indicators.

#### 1. Architecture Over Aesthetics
A high-converting website begins with rock-solid architectural fundamentals:
- **Sub-second Core Web Vitals:** First Contentful Paint (FCP) under 800ms and Largest Contentful Paint (LCP) under 1.8s.
- **Strict Accessibility Compliance:** Full WCAG 2.2 AA compliance ensures high engagement across all devices and assistive screen readers.
- **Localized Schema Markup:** Implementing structured JSON-LD data for LocalBusiness, Service, and Organization ensures conversational search engines (AEO/GEO) accurately cite your business.

#### 2. Local Market Positioning
In regional hubs like Jaipur, Noida, Bengaluru, and Mumbai, competition is fierce. Founders who secure verified positions within designated **Location + Category** market pairs consistently achieve 3.4x higher verified inbound inquiries than those relying solely on generic ads.

#### 3. Transparent Trust Signatures
Displaying verifiable business credentials, tax registrations (GSTIN/CIN), and transparent market standing gives consumers immediate confidence in choosing your services.`,
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
  'custom-software-development-vs-off-the-shelf-software': {
    id: 'blg-002',
    slug: 'custom-software-development-vs-off-the-shelf-software',
    title: 'Custom Software Development vs Off-the-Shelf Software: Strategic Analysis',
    category: 'Software Development',
    excerpt: 'Evaluate the ROI, scaling limits, vendor lock-in risks, and maintenance total cost of ownership between bespoke software engineering and canned SaaS.',
    body: `### The Strategic Dilemma: Build vs. Buy

Every growing enterprise faces a pivotal crossroad: should you subscribe to standardized SaaS tools or engineer a tailored proprietary platform?

#### The True Cost of Off-the-Shelf Subscriptions
While packaged SaaS solutions offer rapid Day 1 onboarding, fast-scaling companies quickly encounter friction:
1. **Compounding Seat Licenses:** Monthly per-user tiers quickly scale into massive operational expenses.
2. **Feature Bottlenecks & Workflow Workarounds:** Teams spend valuable hours adapting internal processes to fit inflexible software.
3. **Data Silos & Vendor Lock-In:** Migrating proprietary business data out of commercial walled gardens often becomes cost-prohibitive.

#### When Bespoke Engineering Delivers 10x ROI
Building custom internal tooling and competitive customer platforms makes strategic sense when your competitive advantage relies on proprietary workflows, strict regulatory compliance, or deterministic market positioning.`,
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
  'website-development-company-in-noida-what-businesses-look-for': {
    id: 'blg-003',
    slug: 'website-development-company-in-noida-what-businesses-look-for',
    title: 'Website Development Company in Noida: What Businesses Need to Look For',
    category: 'Web Development',
    excerpt: 'Strategic criteria for commercial enterprises in Delhi NCR choosing verified engineering partners, contract terms, and local visibility guarantees.',
    body: `### Navigating the Competitive Delhi NCR Agency Ecosystem

Commercial enterprises in Noida and across the Delhi NCR region operate in India's densest technology corridor. With thousands of agencies competing for client contracts, selecting the right digital development partner requires rigorous due diligence.

#### Crucial Evaluation Criteria
- **Verified Code Ownership:** Ensure all git repositories, cloud architectures, and database assets belong 100% to your enterprise without proprietary retainers.
- **Guaranteed Core Web Vitals:** Do not sign contracts that lack measurable lighthouse performance metrics (Minimum 90+ across Mobile & Desktop).
- **Localized Competitive Positioning:** A great website is worthless if target customers in Noida cannot find it. Look for partners who prioritize structured local business schema and market-leading visibility.`,
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
  'how-to-choose-a-website-development-company-in-india': {
    id: 'blg-004',
    slug: 'how-to-choose-a-website-development-company-in-india',
    title: 'How to Choose a Website Development Company In India',
    category: 'Website Development',
    excerpt: 'Avoid opaque contracts, hidden maintenance markups, and vanity metrics by using this battle-tested vendor selection scorecard.',
    body: `### The Indian Tech Partner Selection Scorecard

India is globally recognized for world-class engineering talent, yet domestic business owners frequently struggle with delayed projects, scope creep, and unclear deliverables.

#### The 5-Point Vendor Scorecard
1. **Technical Stack Modernity:** Are they building with maintainable modern frameworks (Next.js, TypeScript, PostgreSQL) or legacy, vulnerable monoliths?
2. **Security & Data Isolation:** Are database secrets isolated with zero-trust principles?
3. **Transparent Pricing Models:** Avoid murky milestone billing with no clear deliverables.
4. **Speed to First Ranking:** How quickly will your business achieve indexing and discoverability in target tier-1 and tier-2 markets?
5. **Direct Engineering Access:** Are you communicating directly with technical architects or being routed through non-technical sales reps?`,
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
  'how-much-does-website-development-cost-in-india-in-2026': {
    id: 'blg-005',
    slug: 'how-much-does-website-development-cost-in-india-in-2026',
    title: 'How Much Does Website Development Cost In India In 2026',
    category: 'Website Development',
    excerpt: 'Detailed pricing breakdowns across landing pages, e-commerce platforms, custom web apps, and competitive market positioning.',
    body: `### Comprehensive 2026 Website Development Cost Breakdown

In 2026, web engineering pricing in India reflects clear tiers based on architecture complexity, security standards, and local market visibility goals.

| Project Type | Scope & Deliverables | Typical Cost Range |
|---|---|---|
| **High-Converting Landing Page** | Single page, optimized Core Web Vitals, local schema | ₹15,000 – ₹35,000 |
| **Corporate Digital Presence** | 5–10 pages, CMS integration, verified compliance badges | ₹40,000 – ₹90,000 |
| **Marketplace / Web Application** | User authentication, database transactions, real-time rankings | ₹1,20,000 – ₹3,50,000+ |

Investing in verified positioning upfront dramatically reduces recurring client acquisition costs compared to expensive paid advertising auctions.`,
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
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const res = await fetch(`${API_BASE}/api/blog/${slug}`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // API backend offline fallback
  }

  const post = FALLBACK_POSTS[slug];
  if (!post) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: `Blog article "${slug}" not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json(post);
}
