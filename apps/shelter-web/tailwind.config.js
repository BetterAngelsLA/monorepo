const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      screens: {
        sm: '375px',
        md: '768px',
        lg: '1152px',
      },
      fontFamily: {
        primary: ['Poppins', 'sans-serif'],
      },
      colors: {
        'primary-20': 'var(--color-primary-20)',
        'steel-blue': 'var(--color-steel-blue)',
        'neutral-40': 'var(--color-neutral-40)',
        'neutral-70': 'var(--color-neutral-70)',
        'neutral-90': 'var(--color-neutral-90)',
        'neutral-98': 'var(--color-neutral-98)',
        'neutral-99': 'var(--color-neutral-99)',
        'success-30': 'var(--color-success-30)',
        'success-90': 'var(--color-success-90)',
      },
    },
  },
  plugins: [],
};
