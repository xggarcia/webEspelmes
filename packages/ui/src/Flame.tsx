import * as React from 'react';
import { cn } from './cn';

/** Decorative flame mark — used as a logo accent and loading indicator. */
export const Flame: React.FC<React.SVGAttributes<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg
    viewBox="0 0 24 32"
    aria-hidden="true"
    className={cn('h-6 w-auto text-ember animate-flicker', className)}
    {...rest}
  >
    <path
      fill="currentColor"
      d="M12 1c1 4 5 6 5 11 0 3-2 5-2 7 0 2 2 3 2 5 0 4-3 7-7 7s-7-3-7-7c0-2 1-4 2-5 1-2 2-3 2-5 0-3 2-5 5-7 1-1 0-4 0-6Z"
    />
    <path fill="#F3E3C3" opacity=".65" d="M11 10c1 2 3 3 3 6 0 2-1 3-1 4-1-1-2-2-2-4s0-4 0-6Z" />
  </svg>
);
