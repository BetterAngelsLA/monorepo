/**
 * Project-level ESLint flat config for react-icons.
 *
 * ## How flat config overrides work
 * In ESLint flat config, later config objects REPLACE earlier ones for the same
 * rule — there is no merging. When this config adds a second object with
 * `@nx/enforce-module-boundaries`, it completely substitutes the root's version
 * for files matching `src/**`. That's why `enforceBuildableLibDependency` and
 * `depConstraints` must be repeated and imported from root.
 *
 * ## @nx/enforce-module-boundaries diff vs root:
 *
 * ## `.svg` override
 * SVG files are imported from `libs/expo/shared/icons` via relative paths that
 * cross Nx library boundaries. This exception allows those imports. The
 * permanent fix is to move SVGs to a shared asset library and import them via
 * the library's package name.
 * This may be removed once implement `DEV-2474: consolidate svg files in Asset lib`.
 *
 * This project has no tailwind imports, so the root's `'.*libs/tailwind.*'`
 * allowance is intentionally excluded. If tailwind is added later, the lint
 * error will prompt whoever adds it to explicitly update this list.
 */

import rootConfig, { depConstraints } from '../../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['.*libs/tailwind.*', '^.*\\.svg$'],
          depConstraints,
        },
      ],
    },
  },
];
