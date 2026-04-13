import type { Config } from 'tailwindcss';
// @ts-expect-error — CJS preset
import preset from '@espelmes/config/tailwind.preset.js';

const config: Config = {
  presets: [preset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
