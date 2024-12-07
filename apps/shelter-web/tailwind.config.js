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
      },
    },
  },
  plugins: [],
};
