import { redirect } from 'next/navigation';

interface LoginPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * AageOnline Authentication Gate
 * Email login is deprecated and removed. All authentication is handled
 * exclusively via verified mobile phone number + OTP at /business/claim.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const rawReturnUrl = resolvedParams?.returnUrl;
  const returnUrl = Array.isArray(rawReturnUrl) ? rawReturnUrl[0] : rawReturnUrl;

  const target = returnUrl
    ? `/business/claim?returnUrl=${encodeURIComponent(returnUrl)}`
    : '/business/claim';

  redirect(target);
}
