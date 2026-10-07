export interface SEOMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots?: 'index, follow' | 'noindex, nofollow' | 'noindex, follow';
  openGraph?: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    locale: string;
    type: 'website' | 'article';
    images?: Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
  };
  twitter?: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    creator?: string;
  };
}

export interface BreadcrumbItem {
  label: string;
  url: string;
  isCurrent?: boolean;
}

export interface AnswerEngineFact {
  property: string;
  value: string;
}

export interface AnswerEngineSection {
  heading: string;
  directAnswer: string;
  supportingFacts: AnswerEngineFact[];
}
