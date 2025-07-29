import { createGlobPatternsForDependencies } from '@nx/react/tailwind';
// @ts-expect-error silence warn for missing types declarations
import daisyui from 'daisyui';
import { join } from 'path';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      fontFamily: {
        primary: 'var(--font-primary)',
      },
      colors: {
        'neutral-98': 'var(--color-neutral-98)',
        'neutral-99': 'var(--color-neutral-99)',
        'primary-20': 'var(--color-primary-20)',
      },
    },
  },
  plugins: [daisyui],
};

export default config;
