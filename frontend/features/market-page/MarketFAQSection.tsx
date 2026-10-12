'use client';

import React, { useState } from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface MarketFAQSectionProps {
  faqs: FAQItem[];
  locationName: string;
  categoryName: string;
}

export const MarketFAQSection: React.FC<MarketFAQSectionProps> = ({
  faqs,
  locationName,
  categoryName,
}) => {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set([0, 1]));

  const toggleIndex = (idx: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <section
      id="faq"
      style={{
        backgroundColor: 'var(--surface-soft)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 'clamp(48px, 6vw, 72px) 0',
      }}
    >
      <div className="container">
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ marginBottom: '36px', textAlign: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#EA580C',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            QUESTIONS & ANSWERS
          </span>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 36px)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 10px 0',
            }}
          >
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
            Common questions regarding {locationName} {categoryName.toLowerCase()}, project planning, and AageOnline ranking mechanics.
          </p>
        </div>

        {/* Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIndices.has(idx);

            return (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  border: isOpen ? '1px solid #EA580C' : '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  transition: 'border-color var(--motion-fast), box-shadow var(--motion-fast)',
                  boxShadow: isOpen ? '0 4px 14px rgba(234, 88, 12, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    gap: '16px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: isOpen ? '#EA580C' : 'var(--text-primary)',
                      lineHeight: 1.35,
                    }}
                  >
                    {faq.question}
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 900,
                      color: isOpen ? '#EA580C' : '#94A3B8',
                      transition: 'transform var(--motion-fast)',
                      transform: isOpen ? 'rotate(45deg)' : 'none',
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 20px 20px 20px',
                      fontSize: '14px',
                      lineHeight: 1.7,
                      color: '#475569',
                      borderTop: '1px solid #F8FAFC',
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
      </div>
    </section>
  );
};
