import type { Config } from 'tailwindcss';
import theme from './lib/theme';

const tailwindBase = {
  theme,
  plugins: [
    // e.g., require('daisyui') or other global libs
  ],
} satisfies Omit<Config, 'content'>;

export { theme };
export default tailwindBase;
