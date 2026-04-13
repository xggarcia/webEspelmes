import * as React from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    'bg-ember text-linen hover:bg-clay focus-visible:ring-ember disabled:bg-ember/60 disabled:text-linen/80',
  secondary:
    'bg-wax text-ink border border-clay/20 hover:bg-dust focus-visible:ring-clay disabled:opacity-60',
  ghost:
    'bg-transparent text-ink hover:bg-dust/60 focus-visible:ring-clay disabled:opacity-60',
  danger:
    'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700 disabled:opacity-60',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-12 px-7 text-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl2 font-medium tracking-wide transition-all',
        'shadow-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-linen',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
});
