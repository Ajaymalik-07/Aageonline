export const siteConfig = {
  name: 'AageOnline',
  tagline: 'Get Seen. Get Ahead.',
  description:
    'AageOnline is a transparent, paid competitive business visibility platform. Businesses compete for verifiable ranking positions inside distinct local and regional markets.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://aageonline.com',
  ogImage: '/images/og-default.png',
  links: {
    terms: '/terms',
    privacy: '/privacy',
    grievance: '/grievance',
    trust: '/trust',
    howItWorks: '/how-it-works',
    claim: '/claim',
  },
  disclosures: {
    paidVisibility:
      'Visibility rankings on AageOnline represent paid competitive visibility positions and do not constitute an independent assessment of business quality, customer satisfaction, or objective ranking.',
    nonRefundable:
      'Payments purchase designated competitive visibility positions. In the event another business qualifies for a higher position, previous payments remain non-refundable.',
  },
  nav: {
    public: [
      { label: 'Explore Markets', href: '/explore' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Trust & Governance', href: '/trust' },
      { label: 'Claim Business', href: '/claim' },
    ],
    business: [
      { label: 'Workspace', href: '/workspace' },
      { label: 'My Rankings', href: '/workspace/rankings' },
      { label: 'Transactions', href: '/workspace/transactions' },
      { label: 'Notifications', href: '/workspace/notifications' },
    ],
  },
} as const;
