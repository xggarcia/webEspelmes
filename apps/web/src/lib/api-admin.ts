import 'server-only';
import { API_BASE } from './api';

type FetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export async function adminFetch<T>(path: string, opts: FetchOptions = {}): Promise<T | null> {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    console.error('ADMIN_TOKEN not set');
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
        ...opts.headers,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
