'use client';

import React from 'react';
import type { EditorialSection } from '../../data/markets/jaipur-interior-designers-content';

interface MarketEditorialContentProps {
  sections: EditorialSection[];
}

export const MarketEditorialContent: React.FC<MarketEditorialContentProps> = ({ sections }) => {
  return (
    <div style={{ backgroundColor: '#ffffff', padding: 'clamp(40px, 6vw, 72px) 0' }}>
      <div className="container">
        <div style={{ maxWidth: '840px' }}>
        {sections.map((section, idx) => {
          return (
            <article
              key={section.id}
              id={section.id}
              style={{
                marginBottom: idx < sections.length - 1 ? 'clamp(48px, 6vw, 72px)' : 0,
                paddingBottom: idx < sections.length - 1 ? 'clamp(40px, 5vw, 64px)' : 0,
                borderBottom: idx < sections.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              {/* Section Header */}
              <header style={{ marginBottom: '24px' }}>
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
                  {section.navTitle}
                </span>

                <h2
                  style={{
                    fontSize: 'clamp(24px, 3.2vw, 34px)',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.25,
                    margin: '0 0 10px 0',
                  }}
                >
                  {section.heading}
                </h2>

                {section.subheading && (
                  <p
                    style={{
                      fontSize: '16px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {section.subheading}
                  </p>
                )}
              </header>

              {/* AEO Direct Answer Block if present */}
              {section.directAnswer && (
                <div
                  style={{
                    backgroundColor: 'rgba(234, 88, 12, 0.05)',
                    border: '1px solid rgba(234, 88, 12, 0.25)',
                    borderLeft: '4px solid #EA580C',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    marginBottom: '28px',
                  }}
                >
                  <strong
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#EA580C',
                      display: 'block',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Direct Answer: {section.directAnswer.question}
                  </strong>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                    {section.directAnswer.answer}
                  </p>
                </div>
              )}

              {/* Main Body Paragraphs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                {section.paragraphs.map((para, pIdx) => (
                  <p
                    key={pIdx}
                    style={{
                      fontSize: '16px',
                      lineHeight: 1.75,
                      color: '#334155',
                      margin: 0,
                    }}
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Subsections if present */}
              {section.subsections && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '32px' }}>
                  {section.subsections.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        backgroundColor: 'var(--surface-raised)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        padding: '24px',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '19px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          margin: '0 0 12px 0',
                          lineHeight: 1.3,
                        }}
                      >
                        {sub.title}
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {sub.content.map((cPara, cIdx) => (
                          <p
                            key={cIdx}
                            style={{
                              fontSize: '15px',
                              lineHeight: 1.7,
                              color: 'var(--text-secondary)',
                              margin: 0,
                            }}
                          >
                            {cPara}
                          </p>
                        ))}
                      </div>

                      {/* Bullet points if present */}
                      {sub.bulletPoints && (
                        <ul
                          style={{
                            marginTop: '16px',
                            paddingLeft: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                          }}
                        >
                          {sub.bulletPoints.map((bp, bIdx) => (
                            <li key={bIdx}>{bp}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
        </div>
      </div>
    </div>
  );
};
