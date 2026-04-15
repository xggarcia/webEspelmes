'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';

const items: { href: string; label: string }[] = [
  { href: '/admin/dashboard', label: 'Tauler' },
  { href: '/admin/products', label: 'Productes' },
  { href: '/admin/orders', label: 'Comandes' },
  { href: '/admin/customers', label: 'Clients' },
  { href: '/admin/commands', label: 'Ordres' },
  { href: '/admin/audit', label: 'Auditoria' },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-ink/10 pb-3">
      {items.map((it) => {
        const active = pathname?.includes(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              active
                ? 'bg-ink text-cream'
                : 'text-ink/70 hover:bg-ink/5 hover:text-ember'
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
