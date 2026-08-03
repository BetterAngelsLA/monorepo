import rootConfig from '../../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'import/export': 'off', // barrel file re-exports trigger this
    },
  },
];
