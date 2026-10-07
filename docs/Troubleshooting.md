# AageOnline — Troubleshooting

## Ranking Looks Incorrect

Check:

1. market ID
2. latest successful transactions
3. ranking calculation
4. position history
5. transaction commit status
6. cache freshness

## Payment Succeeded but Position Did Not Change

Check:

1. provider transaction status
2. webhook verification
3. transaction record
4. ranking operation
5. database transaction
6. retry/dead-letter handling

Never manually alter ranking without an audit record.

## Duplicate Payment Callback

Confirm idempotency handling.

A duplicate provider callback must not create a second financial transaction or second ranking mutation.

## Notification Missing

Check:

1. milestone calculation
2. notification event
3. queue status
4. email provider status
5. recipient preference
6. delivery logs

## Production Incident

Record:

- time
- affected market
- affected business IDs
- transaction IDs
- request IDs
- observed behavior
- mitigation
- root cause
- follow-up action
