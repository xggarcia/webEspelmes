import { cookies } from 'next/headers';
import { safeApiFetch } from './api-server';

export type Session = {
  id: string;
  email: string;
  name: string | null;
  role: 'CUSTOMER' | 'ADMIN';
};

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  if (!jar.get('access_token')) return null;
  return await safeApiFetch<Session>('/auth/me', { forwardCookies: true });
}

