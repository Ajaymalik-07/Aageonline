import React from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '../../../config/site';

interface BlogPostLayoutProps {
  params: Promise<{
    slug: string;
  }>;
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: BlogPostLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalUrl = `${siteConfig.url}/blog/${slug}`;

  return {
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
