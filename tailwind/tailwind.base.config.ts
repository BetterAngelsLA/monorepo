import type { Config } from 'tailwindcss';
import theme from './tailwind.theme';

export default {
  theme,
  plugins: [
    // e.g., require('daisyui') or other global libs
  ],
} satisfies Omit<Config, 'content'>;
