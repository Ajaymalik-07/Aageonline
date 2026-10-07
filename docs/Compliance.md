# AageOnline — Regulatory Compliance, Disclosures & Grievance Governance

## 1. Compliance Mandate

AageOnline operates within Indian commercial and digital regulatory frameworks. All operational and technical workflows must comply with applicable provisions of:
- **Consumer Protection Act, 2019** (and Consumer Protection E-Commerce Rules)
- **Digital Personal Data Protection Act, 2023 (DPDP)**
- **Information Technology Act, 2000** and Intermediary Guidelines
- **Reserve Bank of India (RBI)** Payment Aggregator & Merchant Guidelines
- **Advertising Standards Council of India (ASCI)** Guidelines on Paid Visibility & Digital Disclosures

---

## 2. Mandatory Paid Visibility Disclosures

AageOnline's commercial model is transparent competitive visibility. The platform must never mislead consumers regarding the basis of rankings.

### Statutory Disclosure Rules:
1. **Clear Labeling:** Every ranking list, card, spotlight, and directory must display the prominent disclosure:  
   > *"Rankings on AageOnline represent paid competitive visibility positioning purchased by businesses. Visibility positions reflect active competitive bids and do not constitute an independent assessment, endorsement, or certification of business quality, credentials, or reliability."*
2. **No Deceptive Terminology:** The UI, metadata, and marketing materials are strictly prohibited from using:
   - ❌ *"Best in City"*
   - ❌ *"Top-Rated Quality"*
   - ❌ *"Officially Certified #1"*
   - ❌ *"Guaranteed Best Services"*
3. **Approved Terminology:**
   - ✅ *"Current Visibility: #1"*
   - ✅ *"Competitive Visibility Ranking"*
   - ✅ *"Active Market Positioning"*

---

## 3. Terms of Service & Payment Finality Governance

1. **Payment Finality & Distinct Transactions:**
   - Each upward position purchase is a distinct, finalized commercial transaction for visibility.
   - Being displaced downward by a subsequent higher qualifying bid by another business does **not** entitle the displaced business to a refund, chargeback, or credit.
   - This term must be explicitly consented to prior to every payment initiation via an active checkbox or clear button disclosure.
2. **No Stored Balances / No Wallets:**
   - The platform does not hold customer funds in escrow, wallets, or stored credits.
   - All transactions are direct, one-time payments processed through licensed RBI-authorized Payment Aggregators (Razorpay / Cashfree).
3. **Suspension & Policy Violations:**
   - Businesses engaging in deceptive practices, fraudulent claims, or regulatory infractions are subject to immediate administrative suspension without refund of visibility fees.

---

## 4. Payment Page Security & Script Governance (PCI DSS SAQ-A Guidance)

To minimize compliance exposure and protect cardholder/payment data:
1. **Hosted Checkout Fields:** Checkout forms are loaded directly from licensed payment provider SDKs inside secure iframes.
2. **Script Hygiene:**
   - Third-party marketing scripts, tracking pixels, ad networks, and unverified analytics are strictly barred from loading on `/checkout` or payment modals.
   - Script integrity is enforced via cryptographic nonces and strict `Content-Security-Policy` headers.
3. **Zero Cardholder Storage:** No PAN (Permanent Account Number), CVV, UPI PIN, or bank credentials ever traverse or persist on AageOnline application servers.

---

## 5. Consumer Grievance Redressal Mechanism

In compliance with Rule 5(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules:
- A designated **Grievance Redressal Officer** is published in `docs/README.md` and on the public website footer.
- Grievance contact email: `grievance@aageonline.in`.
- Mandatory response timeline:
  - Acknowledgment within 48 hours.
  - Resolution or written explanation within 15 days of receipt.
