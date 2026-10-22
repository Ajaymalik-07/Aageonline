import React from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '../../config/site';

export const metadata: Metadata = {
  title: 'Blog & Strategic Insights — AageOnline',
  description: 'Authoritative analysis, guides, and strategic insights on business visibility and competitive positioning.',
  alternates: {
    canonical: `${siteConfig.url}/blog`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
