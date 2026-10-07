---
name: security-audit
description: Audits code for secret leakage, server-side authorization flaws, rate limiting, and audit logging. Trigger before submitting changes, committing code, or deploying features.
---

# Security Audit Skill

## Purpose
Enforces rigorous security controls across authentication, authorization, webhook verification, data protection, and administrative auditing. Protects against OWASP Top 10 vulnerabilities and platform abuse.

## Trigger Conditions
- Pre-commit reviews and code quality gates.
- Implementing authentication or authorization checks.
- Handling external callbacks, user inputs, or profile data.
- Introducing administrative functions or privileged routes.

## Instructions
1. **Secret Scanning:**
   - Verify that no API keys, private certificates, or secrets exist in the git staging area or code files.
   - Confirm `.gitignore` covers `.env`, `.env.*`, `*.key`, `*.pem`, `secrets/`, and `credentials/`.
2. **Server-Side Authorization Review:**
   - Verify that business mutations validate `user_id == business.owner_id` or explicit verified management rights.
   - Confirm administrative endpoints verify admin role claims server-side.
3. **Abuse Prevention Checks:**
   - Confirm rate limiting on authentication routes (`/api/v1/auth/login`, `/api/v1/auth/register`).
   - Check input sanitization on business profile fields (prevent XSS, injection).
4. **Audit Logging Compliance:**
   - Ensure critical events log to `audit_logs`: business claim, verification status change, position purchase, administrative override.
   - Verify that logs redact authentication credentials and payment secrets.

## Constraints
- Never approve PRs or code changes that bypass server-side validation.
- Never hardcode mock credentials or skip authentication checks outside of isolated unit test fixtures.

## Expected Output
- Comprehensive security audit checklist.
- Immediate remediation recommendations for detected vulnerabilities.

## Relevant Documentation References
- [docs/Security.md](file:///d:/Aage%20online/docs/Security.md)
- [docs/Compliance.md](file:///d:/Aage%20online/docs/Compliance.md)
- [docs/Consent.md](file:///d:/Aage%20online/docs/Consent.md)
- [docs/API.md](file:///d:/Aage%20online/docs/API.md)
