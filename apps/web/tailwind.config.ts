import type { Config } from 'tailwindcss';
// @ts-expect-error — CJS preset
import preset from '@espelmes/config/tailwind.preset.js';

const config: Config = {
  presets: [preset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // existing tokens (kept for back-compat with the preset)
        cream: '#FAF6EE',
        linen: '#F2EBDD',
        wax: '#E9DFCB',
        dust: '#D9CFB8',
        ink: '#1F1B16',
        ember: '#B0532A',
        sage: '#6F7E5B',
        // new
        bone: '#FBF8F2',
        clay: '#8C3A1F',
        smoke: '#5A554C',
        hush: '#EDE6D6',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        warm: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px -12px rgba(31,27,22,0.10)',
        lift: '0 6px 14px rgba(31,27,22,0.06), 0 24px 60px -24px rgba(31,27,22,0.18)',
      },
      keyframes: {
        flicker: {
          '0%,100%': { transform: 'scaleY(1)', opacity: '0.95' },
          '50%': { transform: 'scaleY(1.06)', opacity: '1' },
        },
        lift: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fade: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        flicker: 'flicker 2.4s ease-in-out infinite',
        lift: 'lift 600ms cubic-bezier(.2,.7,.2,1) both',
        fade: 'fade 500ms ease-out both',
      },
      letterSpacing: {
        widest2: '0.18em',
      },
    },
  },
};

export default config;
