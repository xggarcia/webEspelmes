import * as React from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'ember' | 'sage' | 'warning';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

const tones: Record<Tone, string> = {
  neutral: 'bg-dust text-ink',
  ember: 'bg-ember/10 text-ember',
  sage: 'bg-sage/15 text-sage',
  warning: 'bg-yellow-100 text-yellow-900',
};

export const Badge: React.FC<BadgeProps> = ({ className, tone = 'neutral', ...rest }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide',
      tones[tone],
      className,
    )}
    {...rest}
  />
);
