# AageOnline — Infrastructure

## Target Stack

### Web
Next.js / TypeScript.

### Database
PostgreSQL.

### Edge / CDN / Runtime
Cloudflare where compatible with the selected application runtime.

### Storage
Object storage such as Cloudflare R2 for first-party media when introduced.

### Payments
A supported Indian payment provider with server-side verification and webhook support.

### Email
Transactional email provider.

## Infrastructure Principles

- Database is the system of record.
- Payment provider is authoritative for payment status.
- Ranking state is authoritative in the application/database.
- Public content may be cached.
- Financial and account data must not be publicly cached.
- Backups must be configured before production launch.

## Initial Storage Strategy

V1 should minimize first-party media storage.

Business portfolio and social links may remain external.

Only required business assets should be stored by AageOnline initially.
