'use client';

import { useRouter } from '@/i18n/routing';
import { API_BASE } from '@/lib/api';

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();

  async function logout() {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <button onClick={logout} className="text-sm text-ink/60 hover:text-ember transition-colors">
      {label}
    </button>
  );
}
