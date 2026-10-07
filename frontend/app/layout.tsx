import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { siteConfig } from '../config/site';
import { generateWebsiteSchema } from '../lib/seo/schema';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteSchema = generateWebsiteSchema();

  return (
    <html lang="en" data-theme="light">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        {/* Skip to Main Content Link for Keyboard Accessibility (WCAG 2.2 AA) */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Global Semantic Header with responsive navigation and theme switch */}
        <Header />

        {/* Main Content Landmark */}
        <main id="main-content" tabIndex={-1} style={{ outline: 'none' }}>
          {children}
        </main>

        {/* Global Semantic Footer */}
        <Footer />
      </body>
    </html>
  );
}
