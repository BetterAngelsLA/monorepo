import { createGlobPatternsForDependencies } from '@nx/react/tailwind';
// // @ts-expect-error silence warn for missing types declarations
// import daisyui from 'daisyui';
import { join } from 'path';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    join(__dirname, '../../**/*.{ts,tsx}'),
    join(__dirname, '../../**/*.stories.{ts,tsx}'),
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
        // 'primary-20': 'var(--color-primary-20)',
        'primary-20': '#216af8',
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
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInFromLeft: {
          '0%': { transform: 'translate3d(-100%, 0, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        slideOutToLeft: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-100%, 0, 0)' },
        },
        slideInFromRight: {
          '0%': { transform: 'translate3d(100%, 0, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        slideOutToRight: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(100%, 0, 0)' },
        },
        slideInFromTop: {
          '0%': { transform: 'translate3d(0, -100%, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        slideOutToTop: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(0, -100%, 0)' },
        },
        fadeOutScaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn var(--animation-duration) ease-out forwards',
        'fade-out': 'fadeOut var(--animation-duration) ease-in forwards',
        'slide-in-from-left':
          'slideInFromLeft var(--animation-duration) ease-in-out forwards',
        'slide-in-from-right':
          'slideInFromRight var(--animation-duration) ease-in-out forwards',
        'slide-out-to-left':
          'slideOutToLeft var(--animation-duration) ease-in-out forwards',
        'slide-out-to-right':
          'slideOutToRight var(--animation-duration) ease-in-out forwards',
        'slide-in-from-top':
          'slideInFromTop var(--animation-duration) ease-in-out forwards',
        'slide-out-to-top':
          'slideOutToTop var(--animation-duration) ease-in-out forwards',
        'fade-collapse': 'fadeOutScaleOut 200ms ease-in-out forwards',
      },
    },
  },
  // plugins: [daisyui],
  // daisyui: {
  //   themes: false, // disable DaisyUI default themes
  // },
};

export default config;
