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
