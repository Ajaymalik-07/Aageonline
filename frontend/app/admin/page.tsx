import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Administration — AageOnline',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  const adminUrl = process.env.ADMIN_APP_URL || process.env.NEXT_PUBLIC_ADMIN_URL;
  if (adminUrl && adminUrl.trim().length > 0) {
    redirect(adminUrl.replace(/\/+$/, ''));
  }
  notFound();
}
