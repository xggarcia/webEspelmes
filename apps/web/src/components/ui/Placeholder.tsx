type Props = {
  label?: string;
  tone?: 'wax' | 'linen' | 'hush' | 'dust' | 'clay';
  className?: string;
  ratio?: string;
};

const TONE: Record<NonNullable<Props['tone']>, string> = {
  wax: 'bg-wax/60',
  linen: 'bg-linen/70',
  hush: 'bg-hush/70',
  dust: 'bg-dust/60',
  clay: 'bg-clay/15',
};

export function Placeholder({ label, tone = 'linen', className = '', ratio }: Props) {
  return (
    <div
      className={`ph-stripes relative flex h-full w-full items-center justify-center overflow-hidden ${TONE[tone]} ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {label && (
        <span className="meta text-ink/40 px-3 text-center">{label}</span>
      )}
    </div>
  );
}

