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
        primary: ['IBM Plex Sans', 'sans-serif'],
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
    keyframes: {
      slideInUp: {
        '0%': { transform: 'translate3d(0, 10%, 0)' },
        '100%': { transform: 'translate3d(0, 0, 0)' },
      },
      expandInOut: {
        '0%': { transform: 'scale(.85, .5)' },
        '100%': { transform: 'scale(1, 1)' },
      },
      nav: {
        '0%': {
          opacity: '.7',
          scale: '.99',
          transform: 'translate3d(0, 25px, 0)',
        },
        '100%': {
          opacity: '5',
          scale: '1',
          transform: 'translate3d(0, 0, 0)',
        },
      },
    },
    animation: {
      slideInUp: 'slideInUp 250ms ease-in-out 0ms',
      expandInOut: 'expandInOut 200ms ease-in-out 0ms',
      nav: 'nav 250ms ease-out 0ms',
    },
  },
  plugins: [],
};
