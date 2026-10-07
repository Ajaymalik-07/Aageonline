# AageOnline — Analytics

## Measurement Principle

Analytics must measure both customer discovery and business participation without becoming the source of truth for financial or ranking state.

## Core Events

### Public

```text
page_view
market_view
ranking_view
business_view
search
business_click
website_click
contact_click
```

### Business

```text
business_created
business_claim_started
business_claim_completed
verification_started
verification_completed
dashboard_view
position_quote_viewed
target_position_selected
payment_started
payment_succeeded
payment_failed
position_changed
outbid_detected
notification_opened
move_up_clicked
```

## Funnel

```text
Visitor
→ Market discovery
→ Business discovery
→ Business claim
→ Position interest
→ Payment
→ Successful position
→ Repeat purchase
```

## Financial Integrity

Analytics must never be used as the authoritative payment ledger.

Transactions and provider records remain authoritative.
