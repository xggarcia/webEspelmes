/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        linen: '#F7F1E5',
        wax: '#F3E3C3',
        clay: '#B86E4B',
        ember: '#8A3A1E',
        ink: '#2B201A',
        sage: '#8A9A7B',
        cream: '#FBF7EE',
        dust: '#E9DFCB',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        warm: '0 20px 40px -20px rgba(138, 58, 30, 0.25)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.5)',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '50%': { opacity: '0.85', transform: 'translateY(-1px) scale(1.04)' },
        },
        lift: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        flicker: 'flicker 2.4s ease-in-out infinite',
        lift: 'lift 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};
