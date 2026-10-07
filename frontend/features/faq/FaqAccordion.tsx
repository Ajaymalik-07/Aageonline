'use client';

import React, { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'What is AageOnline?',
    answer:
      'AageOnline is a transparent, paid competitive business visibility platform. Businesses compete for verifiable ranking positions (#1, #2, #3...) within strictly scoped Location + Category markets (e.g., Jaipur + Interior Designers).',
  },
  {
    question: 'How are positions determined?',
    answer:
      'Positions are determined strictly by verified qualifying transaction amounts. The business with the highest verified qualifying payment holds Position #1, followed sequentially by runner-up qualifying amounts.',
  },
  {
    question: 'What happens when another business qualifies above me?',
    answer:
      'When another eligible business submits and confirms a qualifying payment strictly greater than the current qualifying threshold for a position, your business moves down by one position. Ranking updates atomically.',
  },
  {
    question: 'Is a previous payment refunded if my position changes?',
    answer:
      'No. Payment finality is absolute. Qualifying payments purchase designated visibility positions at the time of transaction. When overtaken or displaced down the ladder, previous payments are non-refundable.',
  },
  {
    question: 'Can I bid the same amount as the current incumbent?',
    answer:
      'No. Platform invariant SEC-02 strictly forbids equal bids. Every qualifying amount must be strictly greater than the incumbent qualifying amount (by at least ₹1.00 / 100 paise). Ties are impossible.',
  },
  {
    question: 'Can I bid a lower amount?',
    answer:
      'No. Bids equal to or lower than the current qualifying amount for a designated position are rejected automatically by server-side validation.',
  },
  {
    question: 'Can I enter decimal rupee amounts (e.g. ₹20,000.50)?',
    answer:
      'No. Bidding requires positive whole Indian Rupees only (paise % 100 === 0). Decimal paise values are rejected to prevent fraction-of-a-rupee spamming.',
  },
  {
    question: 'How is payment verified?',
    answer:
      'Payments are verified server-side through cryptographic webhook signatures from authorized payment providers. Client-side assertions are never authoritative; rankings only change after server verification.',
  },
  {
    question: 'Does a higher position mean a business is objectively better?',
    answer:
      'No. Rankings represent verified paid commercial visibility positions. AageOnline explicitly discloses on all public interfaces that position numbers do not constitute an independent assessment of business quality, service excellence, or customer satisfaction.',
  },
];

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="container" aria-label="Frequently Asked Questions">
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brand-emerald)',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Clear Rules &amp; Answers
          </span>

          <h2
            style={{
              fontSize: 'clamp(26px, 4vw, 36px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              margin: '0 0 var(--space-2) 0',
            }}
          >
            Frequently Asked <span style={{ color: 'var(--brand-emerald)' }}>Questions</span>
          </h2>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
            Authoritative platform policies, payment invariants, and position rules.
          </p>
        </div>

        {/* Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                style={{
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-card)',
                  border: isOpen ? '1.5px solid var(--brand-emerald)' : '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  transition: 'border-color var(--motion-fast)',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    padding: 'var(--space-4) var(--space-5)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    outline: 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: isOpen ? 'var(--brand-emerald)' : 'var(--text-primary)',
                      lineHeight: 1.35,
                    }}
                  >
                    {faq.question}
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: isOpen ? 'var(--brand-emerald)' : 'var(--text-muted)',
                      transform: isOpen ? 'rotate(45deg)' : 'none',
                      transition: 'transform var(--motion-fast)',
                    }}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 var(--space-5) var(--space-5) var(--space-5)',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: 'var(--text-secondary)',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: 'var(--space-3)',
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
