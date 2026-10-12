# AageOnline — SEO

## SEO Objective

Build useful, indexable business discovery pages around location, category, and business entities.

## URL Architecture

Preferred examples:

```text
/
/markets
/locations
/{city}
/categories
/categories/{category}
/businesses
/businesses/{business}
/{city}/{category}
```

### City Page Indexability Policy
A city page (`/{city}`) is indexable (`robots: index, follow`) if and only if:
1. It is backed by a canonical active location.
2. It has at least one published commercial market (`activeMarketCount > 0`).
3. It provides verified market metrics, category breakdowns, and local FAQs.

Cities with zero published markets or unlisted names return `404` and are excluded from `sitemap.xml`.

### Category Page Indexability Policy
A category discovery page (`/categories/{category}`) is indexable (`robots: index, follow`) if and only if:
1. It is backed by a canonical active category.
2. It has at least one published commercial market (`activeMarketCount > 0`).
3. It provides dynamic municipal location breakdowns, market links, and category governance FAQs.

Categories with zero published markets or unlisted names return `404` and are excluded from `sitemap.xml`.

### Business Profile Indexability Policy
A public business profile (`/businesses/{business}`) is indexable (`robots: index, follow`) if and only if:
1. It is backed by a canonical business with `publicationStatus === 'PUBLISHED'`.
2. It provides factual entity details, verified contact/address metadata, and explicit market participation records.
3. It avoids thin automated city-substitution content.

Unpublished, draft, or unlisted businesses return `404` and are excluded from `sitemap.xml`.

### Authenticated Workspace & Operational Flow Policy
All authenticated business workspace routes (`/business/dashboard`, `/business/dashboard/profile`, `/business/dashboard/markets`), login (`/auth/login`), and claim portals (`/business/claim`) must specify `robots: { index: false, follow: false }` and are excluded from `sitemap.xml`.
Public business pages remain indexable per their canonical publication rules.



## Search Intent

Priority intents include:

- businesses in a city
- businesses in a category
- category + city discovery
- business-specific discovery
- how paid visibility works

## Structured Data

Use appropriate structured data only when the visible page content supports it.

Business/entity information should remain accurate.

## Canonicals

Every indexable page must have a stable canonical URL.

## Quality

Do not create large numbers of thin location/category pages solely for indexing.

Paid ranking must not be described as an objective “best” ranking.

## Private Authenticated Routes & Bid Intent Isolation

All business workspace, claim, authenticated settings, and bid intent routes are strictly excluded from search indexing:
- `/business/dashboard/**`
- `/business/claim/**`
- `/auth/**`
- `/api/bid-intents/**`
- `/api/businesses/*/bid-intents`

These routes emit `noindex, nofollow` robot directives and are strictly excluded from `/sitemap.xml`. Bid intent creation, targets, and pricing snapshots are confidential commercial intentions and must never leak into search engine indexes or public discovery feeds.

