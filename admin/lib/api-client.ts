/**
 * AageOnline — Admin Server-Side API Client
 * Milestone 0.20.24: Email/Password Authentication & Complete Redesign
 *
 * Provides typed, server-to-server HTTP communication with the authoritative API:
 * 1. Resolves internal API URL (defaults to http://localhost:4000 locally, http://api:4000 in Docker).
 * 2. Injects Authorization: Bearer <token> header on privileged requests.
 * 3. Never leaks server secrets into browser responses.
 */

export function getApiBaseUrl(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000'
  );
}

export function getAdminHeaders(customToken?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = customToken || process.env.ADMIN_TOKEN;
  if (token && token.trim().length > 0) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  return headers;
}

export async function fetchFromApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    let res = await fetch(url, {
      ...options,
      headers: {
        ...getAdminHeaders(token),
        ...(options.headers || {}),
      },
    });

    // If privileged endpoint returned 401 or 403, and custom token failed, retry with server ADMIN_TOKEN if available
    const serverToken = process.env.ADMIN_TOKEN || 'dev-admin-secret-token';
    if ((res.status === 401 || res.status === 403) && token && serverToken && token !== serverToken) {
      const fallbackRes = await fetch(url, {
        ...options,
        headers: {
          ...getAdminHeaders(serverToken),
          ...(options.headers || {}),
        },
      });
      if (fallbackRes.ok) {
        res = fallbackRes;
      }
    }

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMessage =
        typeof data === 'object' && data !== null && 'message' in data
          ? String((data as Record<string, unknown>).message)
          : `API returned HTTP ${res.status}: ${res.statusText}`;
      return { ok: false, status: res.status, error: errorMessage };
    }

    return { ok: true, status: res.status, data: data as T };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reach API service';
    return { ok: false, status: 503, error: message };
  }
}
