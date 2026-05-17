'use client';

import { NavLink } from './ui/NavLink';

export function HeaderNav({
  home,
  shop,
  about,
  contact,
  cart,
}: {
  home: string;
  shop: string;
  about: string;
  contact: string;
  cart: string;
}) {
  return (
    <>
      <nav className="hidden items-center gap-8 text-[13px] md:flex">
        <NavLink href="/" className="no-underline text-ink/75 transition hover:text-ink">{home}</NavLink>
        <NavLink href="/botiga" className="no-underline text-ink/75 transition hover:text-ink">{shop}</NavLink>
        <NavLink href="/sobre-nosaltres" className="no-underline text-ink/75 transition hover:text-ink">{about}</NavLink>
        <NavLink href="/contacte" className="no-underline text-ink/75 transition hover:text-ink">{contact}</NavLink>
      </nav>

      <NavLink
        href="/cistell"
        className="group inline-flex items-center gap-2 rounded-full border border-ink/15 px-3.5 py-1.5 no-underline text-ink/80 transition hover:border-ink/40 hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 7h16l-1.5 11a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7L4 7z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <span>{cart}</span>
      </NavLink>
    </>
  );
}
