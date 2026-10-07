# AageOnline — Product Requirements Document

## 1. Product Intent

AageOnline helps businesses get discovered by customers while giving businesses a transparent way to compete for paid visibility within specific category and location markets.

**Core promise:** Get Seen. Get Ahead.

## 2. Problem

Business discovery is crowded and traditional directories often provide weak differentiation. AageOnline creates a visible, competitive positioning layer where businesses can pay for specific visibility positions.

## 3. Core Model

A market is defined as:

**Location + Category**

Examples:

- Jaipur + Interior Designers
- Noida + Restaurants
- Haryana + Car Dealers
- India + Business Consultants

Businesses compete inside that market.

### Example

```text
#1 ABC Interiors     ₹25
#2 XYZ Studio        ₹22
#3 Design House      ₹18
#4 Studio 21         ₹14
```

If another eligible business pays ₹26 for position #1:

```text
#1 New Business      ₹26
#2 ABC Interiors     ₹25
#3 XYZ Studio        ₹22
#4 Design House      ₹18
#5 Studio 21         ₹14
```

The previous payments remain spent.

## 4. Users

### Visitor
- Browse markets and rankings.
- Search for businesses.
- View business profiles.
- Understand that ranking is paid visibility.

### Business Owner
- Register/login.
- Create or claim a business.
- Complete required business information.
- View current position.
- Select a target position.
- Make a payment.
- View position and transaction history.
- Receive milestone/outbid notifications.

### Administrator
- Manage users, businesses, categories, locations, claims, verification, rankings, transactions, notifications, and audit records.

## 5. V1 Scope

### Public
- Home
- Explore
- Location pages
- Category pages
- Location + category ranking pages
- Business profiles
- How It Works
- About
- Trust/Governance
- Terms
- Privacy
- Contact/Grievance

### Business
- Authentication
- Business creation/claim
- Verification workflow
- Dashboard
- Ranking view
- Target-position selection
- Payment
- Transaction history
- Position history
- Notification preferences

### Admin
- Dashboard
- Business management
- Claims and verification
- Category/location management
- Ranking management
- Transactions
- Users
- Notifications
- Audit logs

## 6. Ranking Requirements

1. A ranking must belong to exactly one market.
2. A market is one location + one category.
3. A business must be eligible before bidding.
4. Every successful position purchase must create an immutable transaction record.
5. Previous payments must not be refunded because another business overtakes the position.
6. Ranking changes must be atomic.
7. Concurrent bids must not produce duplicate or inconsistent positions.
8. Paid position must be clearly distinguished from claims such as “best business.”
9. Public ranking must remain viewable without authentication.
10. Bid actions require authentication and an eligible business.

## 7. Bid Experience

The bidder should see target positions and the amount required for each available position.

Example:

```text
#1  ₹26
#2  ₹24
#3  ₹20
#4  ₹17

[Select #3]

You are about to purchase position #3 for ₹20.

[Continue to Payment]
```

The final confirmation must clearly state:

- business
- market
- target position
- amount
- that the payment purchases paid visibility
- that the previous payment is not refundable merely because the business is later overtaken

## 8. Notifications

Position-change notifications should focus on meaningful milestones rather than every movement.

Initial milestone ladder:

- #1 → #5
- #5 → #10
- #10 → #20
- #20 → #30
- #30 → #50
- #50 → #75
- #75 → #100

Rapid movement may be grouped into a digest.

## 9. Homepage Spotlight

The homepage may show a **Live Spotlight** for the market with the strongest qualifying competitive activity.

The spotlight must not imply that the displayed business or category is objectively the “best.”

## 10. Trust Principles

AageOnline must be transparent:

- Paid visibility must be disclosed.
- No fake bids.
- No fake reviews.
- No fake scarcity.
- No misleading “best” claims based only on payment.
- Payment status must be explicit.
- Ranking history must be auditable.

## 11. V1 Success Metrics

Primary:
- Number of businesses participating
- Number of successful paid position changes
- Gross payment volume
- Repeat position purchases

Secondary:
- Business claims
- Verified businesses
- Ranking page views
- Business profile views
- Outbid return rate
- Notification-to-return conversion

## 12. Out of Scope

See README for the definitive V1 exclusions.
