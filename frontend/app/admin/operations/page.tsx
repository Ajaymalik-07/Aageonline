import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Operations & Reliability — AageOnline',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminOperationsPage() {
  const adminUrl = process.env.ADMIN_APP_URL || process.env.NEXT_PUBLIC_ADMIN_URL;
  if (adminUrl && adminUrl.trim().length > 0) {
    redirect(`${adminUrl.replace(/\/+$/, '')}/operations`);
  }
  notFound();
}
