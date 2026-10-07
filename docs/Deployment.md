# AageOnline — Deployment

## Release Flow

```text
Feature branch
   ↓
Pull request
   ↓
Automated checks
   ↓
Staging
   ↓
Manual verification
   ↓
Production
```

## Required Checks

Before production:

- type check
- lint
- unit tests
- integration tests
- build
- database migration validation
- security checks
- accessibility checks
- critical payment flow verification

## Database Migrations

Migrations must be versioned.

Destructive migrations require explicit review and a rollback/recovery plan.

## Ranking Releases

Any change to ranking logic requires:

- state-model review
- concurrency testing
- transaction testing
- regression testing
- Decision-Log entry

## Rollback

Application rollback and database rollback must be treated as separate operations.
