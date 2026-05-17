'use client';

import { Link } from '@/i18n/routing';
import { canNavigate } from '@/lib/nav-cooldown';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof Link>;

export function NavLink({ onClick, ...props }: Props) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!canNavigate()) {
      e.preventDefault();
      return;
    }
    (onClick as ((e: React.MouseEvent<HTMLAnchorElement>) => void) | undefined)?.(e);
  }

  return <Link onClick={handleClick} {...props} />;
}
