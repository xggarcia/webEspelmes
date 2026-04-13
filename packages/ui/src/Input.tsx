import * as React from 'react';
import { cn } from './cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, id, ...rest },
  ref,
) {
  const inputId = id ?? React.useId();
  return (
    <div className="flex w-full flex-col gap-1">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-ink/80">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-11 rounded-xl2 border border-clay/25 bg-cream/70 px-4 text-ink',
          'placeholder:text-ink/40',
          'focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30',
          error && 'border-red-700 focus:border-red-700 focus:ring-red-700/30',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...rest}
      />
      {error ? (
        <span id={`${inputId}-error`} className="text-sm text-red-700">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-sm text-ink/60">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
