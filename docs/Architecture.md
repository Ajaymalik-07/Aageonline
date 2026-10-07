# AageOnline — Architecture

## 1. Architecture Goal

Build a web-first, documentation-driven platform with a clear separation between public discovery, authenticated business operations, administrative operations, ranking logic, payments, notifications, and persistence.

## 2. Logical Architecture

```text
Browser
  │
  ├── Public Web
  ├── Business Workspace
  └── Admin
       │
       ▼
Application/API Layer
  ├── Auth
  ├── Businesses
  ├── Markets
  ├── Ranking Engine
  ├── Bidding
  ├── Payments
  ├── Notifications
  └── Audit
       │
       ├── PostgreSQL
       ├── Payment Provider
       ├── Transactional Email
       └── Object Storage
```

## 3. Core Principle

The ranking engine is a business-critical domain service. Payment verification and ranking mutation must be separated so a client cannot directly manipulate rank.

## 4. Recommended Runtime

- Next.js web application
- TypeScript
- PostgreSQL
- Cloudflare for edge/CDN/runtime where appropriate
- Object storage for future first-party media
- External payment provider
- Transactional email provider

Exact provider choices must be recorded in `Decision-Log.md`.

## 5. Domain Boundaries

### Identity
Users, sessions, authentication, authorization.

### Business
Business records, owners, claims, verification.

### Market
Locations, categories, market definitions.

### Ranking
Entries, target positions, position history, ranking calculations.

### Payments
Payment intent, provider transaction, successful transaction, reconciliation.

### Notifications
Email events, milestone detection, delivery status.

### Governance
Audit logs, administrative actions, compliance records.

## 6. Concurrency

Ranking updates must use database transactions and appropriate locking at the market level.

The system must prevent:

- duplicate target positions
- lost updates
- replayed payment application
- inconsistent ranking after concurrent successful payments

## 7. Read/Write Separation

Public ranking pages should be optimized for read performance.

Write operations must pass through authenticated application services and database transactions.

## 8. Caching

Public content may be cached.

Ranking responses must have an explicit freshness policy because position data is dynamic.

Payment and account data must not be served from stale public caches.

## 9. Observability

Production systems should expose:

- structured logs
- request IDs
- payment IDs
- ranking operation IDs
- audit events
- error monitoring
- health checks
