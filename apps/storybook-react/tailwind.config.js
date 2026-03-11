const { createJiti } = require('jiti');

const jiti = createJiti(__filename);
const tailwindBase = jiti('../../libs/tailwind/src/index.ts').default;
const { TAILWIND_CONTENT_GLOBS } = jiti('./config/index.ts');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [tailwindBase],
  content: [...TAILWIND_CONTENT_GLOBS],
};
