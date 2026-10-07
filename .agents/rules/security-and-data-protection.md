# Security & Data Protection Rules

## 1. Secrets & Credentials
- NEVER commit secrets, private keys, API tokens, webhook secrets, or `.env` files into source control.
- All secrets must be injected via runtime environment variables and validated at startup using a typed schema.
- Production logs must redact sensitive headers, authorization tokens, and payment identifiers.

## 2. Server-Side Authorization Gates
- Never rely on client-side routing guards alone.
- Every mutating API route must verify:
  1. The requesting user has a valid, authenticated session.
  2. The user is an authorized owner/manager of the requested business.
  3. The business is in the `ACTIVE` state.
- Administrative routes require verified admin role claims and produce tamper-evident audit logs.

## 3. Webhook Security & Idempotency
- Payment provider webhooks must cryptographically verify signatures using raw request bodies before JSON parsing.
- Webhook handlers must be idempotent: duplicate delivery of a webhook must not double-record transactions or re-trigger ranking mutations.
