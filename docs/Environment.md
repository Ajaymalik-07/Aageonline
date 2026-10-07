# AageOnline — Environment

## Environment Model

Three environments should be supported:

- local
- staging
- production

## Configuration Principles

Secrets must never be committed to Git.

Environment variables must be validated at application startup.

## Required Configuration Groups

```text
APP_ENV
APP_URL
DATABASE_URL

AUTH_SECRET
SESSION_SECRET

PAYMENT_PROVIDER
PAYMENT_KEY
PAYMENT_SECRET
PAYMENT_WEBHOOK_SECRET

EMAIL_PROVIDER
EMAIL_API_KEY
EMAIL_FROM

STORAGE_PROVIDER
STORAGE_BUCKET

ANALYTICS_PROVIDER
ANALYTICS_KEY
```

Exact variable names may be finalized during implementation, but the categories must remain documented.

## Rules

- Production secrets must be separate from staging.
- Client-exposed variables must never contain secrets.
- Local development should use safe test credentials.
- Webhook secrets must be independently rotated.
