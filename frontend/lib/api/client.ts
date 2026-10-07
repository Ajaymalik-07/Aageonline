import { env } from '../../config/env.ts';
import type { APIResponse, APIErrorResponse } from '../../types/api';

export class APIClientError extends Error {
  code: string;
  requestId?: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(status: number, errorData: APIErrorResponse['error']) {
    super(errorData.message);
    this.name = 'APIClientError';
    this.status = status;
    this.code = errorData.code;
    this.requestId = errorData.requestId;
    this.details = errorData.details;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Normalizes any error response or fetch failure into standard APIClientError.
 */
async function parseErrorResponse(res: Response): Promise<APIClientError> {
  try {
    const json: APIErrorResponse = await res.json();
    if (json.error && json.error.message) {
      return new APIClientError(res.status, json.error);
    }
  } catch {
    // If response body is not JSON
  }
  return new APIClientError(res.status, {
    code: `HTTP_${res.status}`,
    message: res.statusText || 'An unexpected API error occurred.',
  });
}

/**
 * Robust, resilient API client with timeouts, retries, and contract normalization.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<APIResponse<T>> {
  const { timeoutMs = 8000, retries = 2, params, ...fetchOptions } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${env.API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined) {
        searchParams.append(key, String(val));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw await parseErrorResponse(res);
      }

      const json = await res.json();
      return json as APIResponse<T>;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      // Check if abort was triggered by timeout
      if (err instanceof Error && err.name === 'AbortError') {
        const timeoutError = new APIClientError(408, {
          code: 'REQUEST_TIMEOUT',
          message: `Request timed out after ${timeoutMs}ms.`,
        });
        if (attempt >= retries) throw timeoutError;
      } else if (err instanceof APIClientError && err.status < 500) {
        // Do not retry 4xx client errors (e.g. 400 Bad Request, 401 Unauthorized)
        throw err;
      } else if (attempt >= retries) {
        if (err instanceof APIClientError) throw err;
        throw new APIClientError(0, {
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : 'Network request failed.',
        });
      }

      // Exponential backoff before retry: 250ms, 500ms...
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 125));
    }
  }

  throw new APIClientError(500, {
    code: 'RETRY_EXHAUSTED',
    message: 'Maximum retry attempts exceeded.',
  });
}
