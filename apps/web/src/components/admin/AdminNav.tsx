'use client';

import { useEffect, useState } from 'react';
import { NavLink } from '@/components/ui/NavLink';

const items: { href: string; label: string }[] = [
  { href: '/admin/dashboard', label: 'Tauler' },
  { href: '/admin/products', label: 'Productes' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/colors', label: 'Colors' },
  { href: '/admin/scents', label: 'Aromes' },
  { href: '/admin/orders', label: 'Comandes' },
  { href: '/admin/customers', label: 'Clients' },
  { href: '/admin/commands', label: 'Ordres' },
  { href: '/admin/audit', label: 'Auditoria' },
];

export function AdminNav() {
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return (
    <nav className="flex flex-wrap gap-1 border-b border-ink/10 pb-3">
      {items.map((it) => {
        const active = pathname?.includes(it.href);
        return (
          <NavLink
            key={it.href}
            href={it.href}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              active
                ? 'bg-ink text-cream'
                : 'text-ink/70 hover:bg-ink/5 hover:text-ember'
            }`}
          >
            {it.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
