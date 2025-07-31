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
        'brand-orange': 'var(--color-brand-orange)',
        'brand-yellow': 'var(--color-brand-yellow)',
        'brand-yellow-light': 'var(--color-brand-yellow-light)',
        'brand-sky-blue': 'var(--color-brand-sky-blue)',
        'brand-angel-blue': 'var(--color-brand-angel-blue)',
        'brand-dark-blue': 'var(--color-brand-dark-blue)',
        'primary-20': 'var(--color-primary-20)',
        'primary-60': 'var(--color-primary-60)',
        'primary-95': 'var(--color-primary-95)',
        'steel-blue': 'var(--color-steel-blue)',
        'neutral-30': 'var(--color-neutral-30)',
        'neutral-40': 'var(--color-neutral-40)',
        'neutral-55': 'var(--color-neutral-55)',
        'neutral-70': 'var(--color-neutral-70)',
        'neutral-90': 'var(--color-neutral-90)',
        'neutral-98': 'var(--color-neutral-98)',
        'neutral-99': 'var(--color-neutral-99)',
        'success-30': 'var(--color-success-30)',
        'success-90': 'var(--color-success-90)',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: false, // disable DaisyUI default themes
  },
};

export default config;
