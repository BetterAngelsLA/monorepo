import rootConfig from '../../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@eslint-react/use-state': 'off',
      'preserve-caught-error': 'off',
      'react-hooks/refs': 'off',
    },
  },
];
