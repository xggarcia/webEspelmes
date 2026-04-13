import * as React from 'react';
import { cn } from './cn';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl2 border border-clay/15 bg-cream/80 p-6 shadow-warm backdrop-blur',
          className,
        )}
        {...rest}
      />
    );
  },
);
