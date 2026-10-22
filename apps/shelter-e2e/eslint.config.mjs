import playwright from 'eslint-plugin-playwright';

import root from '../../eslint.config.mjs';

/**
 * Flat config for this project: the workspace rules plus
 * `eslint-plugin-playwright`'s recommended rules for the specs.
 *
 * The Playwright rules live here rather than in the root config because they
 * only make sense for files the runner executes — `missing-playwright-await`
 * and `no-conditional-in-test` have nothing to say about application code.
 */
export default [
  ...root,
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.spec.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      /*
       * This suite asserts through the `lib/` helpers (`assertInlineNav`,
       * `assertMapUi`, `assertCurrentLocation`, …), so a spec whose only
       * `expect` lives inside one looks assertion-free to the rule.
       */
      'playwright/expect-expect': [
        'warn',
        { assertFunctionPatterns: ['^assert'] },
      ],
    },
  },
];
