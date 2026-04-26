'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_BASE } from '@/lib/api';

export async function adminLogin(locale: string, formData: FormData) {
  const token = (formData.get('token') as string | null)?.trim();
  const expected = process.env.ADMIN_TOKEN;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!expected) throw new Error('ADMIN_TOKEN not configured');
  if (!token || token !== expected) {
    redirect(`/${locale}/admin-login?error=1`);
  }

  // Get a real API session so admin API calls work
  if (adminEmail && adminPassword) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      if (res.ok) {
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
          const jar = await cookies();
          // Extract access_token value and set it
          const match = setCookie.match(/access_token=([^;]+)/);
          if (match) {
            jar.set('access_token', match[1], {
              httpOnly: true,
              sameSite: 'lax',
              path: '/',
              maxAge: 60 * 60 * 8,
            });
          }
        }
      }
    } catch {
      // API not available, continue anyway — admin UI will show empty states
    }
  }

  const jar = await cookies();
  jar.set('admin_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  redirect(`/${locale}/admin/dashboard`);
}
