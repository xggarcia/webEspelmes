import 'server-only';
import { cookies } from 'next/headers';
import { API_BASE, ApiError } from './api';

type FetchOptions = RequestInit & { forwardCookies?: boolean };

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { forwardCookies, headers, ...rest } = opts;
  const h = new Headers(headers);
  if (!h.has('Content-Type') && rest.body && typeof rest.body === 'string') {
    h.set('Content-Type', 'application/json');
  }
  if (forwardCookies) {
    const jar = await cookies();
    const cookieHeader = jar
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
    if (cookieHeader) h.set('cookie', cookieHeader);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: h,
    cache: rest.cache ?? 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function safeApiFetch<T>(
  path: string,
  opts: FetchOptions = {},
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, opts);
  } catch {
    return null;
  }
}
