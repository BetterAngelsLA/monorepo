import { createGlobPatternsForDependencies } from '@nx/react/tailwind';
// @ts-ignore
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
    },
  },
  plugins: [daisyui],
};

export default config;
