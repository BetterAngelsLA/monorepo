/**
 * ESLint 10 flat config — monorepo root.
 *
 * ## Known ESLint 10 type gaps (as of 2026-07)
 * `defineConfig()` and `// @ts-check` are not usable yet — these plugins
 * export types incompatible with ESLint 10's tightened type system. All run
 * correctly at runtime; the gaps only prevent type-checking the config itself.
 *
 *   @nx/eslint-plugin 23.1.0           — languageOptions type mismatch
 *   eslint-plugin-react-hooks 7.1.1    — configs.flat incompatible with Plugin
 *   eslint-plugin-react-native-a11y 3.5.1 — fixable: string instead of RuleFixType
 *
 * Once plugins update, wrap the exported array with `defineConfig([...])`.
 */

// @ts-check
import reactPlugin from '@eslint-react/eslint-plugin';
import graphqlPlugin from '@graphql-eslint/eslint-plugin';
import nxPlugin from '@nx/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import webA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactNativePlugin from 'eslint-plugin-react-native';
import rnA11yPlugin from 'eslint-plugin-react-native-a11y';

// Shared depConstraints — single source of truth for @nx/enforce-module-boundaries
export const depConstraints = [
  // ── TYPE constraints ──────────────────────────
  {
    sourceTag: 'type:feature',
    onlyDependOnLibsWithTags: [
      'type:feature',
      'type:data-access',
      'type:ui',
      'type:util',
    ],
  },
  {
    sourceTag: 'type:data-access',
    onlyDependOnLibsWithTags: ['type:data-access', 'type:util'],
  },
  {
    sourceTag: 'type:ui',
    onlyDependOnLibsWithTags: ['type:ui', 'type:util'],
  },
  {
    sourceTag: 'type:util',
    onlyDependOnLibsWithTags: ['type:util'],
  },
  // ── SCOPE constraints ─────────────────────────
  {
    sourceTag: 'scope:shared',
    onlyDependOnLibsWithTags: ['scope:shared'],
  },
  {
    sourceTag: 'scope:ba-platform',
    onlyDependOnLibsWithTags: ['scope:ba-platform', 'scope:shared'],
  },
  // Liberal: app scopes can import from each other while migrating
  // TODO: tighten to own scope + ba-platform + shared
  {
    sourceTag: 'scope:betterangels',
    onlyDependOnLibsWithTags: [
      'scope:betterangels',
      'scope:betterangels-admin',
      'scope:shelter-web',
      'scope:shelter-operator',
      'scope:ba-platform',
      'scope:shared',
    ],
  },
  {
    sourceTag: 'scope:betterangels-admin',
    onlyDependOnLibsWithTags: [
      'scope:betterangels',
      'scope:betterangels-admin',
      'scope:shelter-web',
      'scope:shelter-operator',
      'scope:ba-platform',
      'scope:shared',
    ],
  },
  {
    sourceTag: 'scope:shelter-web',
    onlyDependOnLibsWithTags: [
      'scope:betterangels',
      'scope:betterangels-admin',
      'scope:shelter-web',
      'scope:shelter-operator',
      'scope:ba-platform',
      'scope:shared',
    ],
  },
  {
    sourceTag: 'scope:shelter-operator',
    onlyDependOnLibsWithTags: [
      'scope:betterangels',
      'scope:betterangels-admin',
      'scope:shelter-web',
      'scope:shelter-operator',
      'scope:ba-platform',
      'scope:shared',
    ],
  },
];

export default [
  // Global ignores — prevents ESLint from even traversing these directories.
  // Unlike `rules`, `ignores` in flat config are additive: project-level
  // configs can add more patterns without overriding these.
  {
    ignores: [
      '**/dist',
      '**/node_modules/**',
      '**/coverage',
      '**/.expo',
      '**/__generated__/**',
      '**/*.d.ts',
      '.yarn',
      '.nx',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },

  // Registers the @nx plugin so @nx/enforce-module-boundaries can resolve
  ...nxPlugin.configs['flat/base'],
  // Sets up @typescript-eslint parser + TS-specific nx rules
  ...nxPlugin.configs['flat/typescript'],
  // Sets up JS-specific nx rules (no TS parser needed)
  ...nxPlugin.configs['flat/javascript'],

  // React / React Native base rules (core JS quality rules: no-throw-literal, eqeqeq, etc.)
  // Previously provided by plugin:@nx/react. Uses only eslint-plugin-import + core ESLint — no
  // incompatible plugins.
  ...nxPlugin.configs['flat/react-base'],
  // TS-aware React overrides (no-unused-expressions with shortCircuit/ternary support)
  ...nxPlugin.configs['flat/react-typescript'],

  // React Hooks rules (eslint-plugin-react-hooks supports ESLint 10)
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: { 'react-hooks': reactHooksPlugin },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },

  // React rules — JSX, DOM, and component best practices
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: { '@eslint-react': reactPlugin },
    rules: reactPlugin.configs.recommended.rules,
  },

  // Module boundaries + import validation (all JS/TS)
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: { import: importPlugin },
    rules: {
      // Reports conflicting named/default exports from the same module
      // good: export const foo = 1; export default bar;
      // bad:  export { foo }; export default foo;
      'import/export': 'error',
      // Reports duplicate imports from the same module
      // good: import { a, b } from './foo';
      // bad:  import { a } from './foo'; import { b } from './foo';
      'import/no-duplicates': 'warn',
      // Prevents projects from importing libs with incompatible tags
      // good: type:feature importing from type:ui (allowed per depConstraints)
      // bad:  type:util importing from type:feature (util → feature is blocked)
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['.*libs/tailwind.*'],
          depConstraints,
        },
      ],
    },
  },

  // Extracts GraphQL operations from template literals i/n .ts/.tsx/.js/.jsx
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    processor: graphqlPlugin.processor,
  },

  // ==============================================================
  // ── TS / JS Rules ─────────────────────────────────────────────
  // ==============================================================

  // Web a11y — DOM accessibility
  // good: <img alt="Description" />
  // bad:  <img /> (missing alt text)
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    ...webA11yPlugin.flatConfigs.recommended,
  },

  // React Native a11y — RN-specific accessibility props
  // good: <View accessible accessibilityLabel="Submit" />
  // bad:  <View onClick={handle} /> (no accessibility props)
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: { 'react-native-a11y': rnA11yPlugin },
    rules: rnA11yPlugin.configs.all.rules,
  },

  // React Native best practices (no-raw-text, no-inline-styles, no-color-literals, etc.)
  // good: <Text>Hello</Text>
  // bad:  <View>Hello</View> (raw text outside <Text>)
  {
    files: ['apps/betterangels/**/*.{ts,tsx}', 'libs/expo/**/*.{ts,tsx}'],
    plugins: { 'react-native': reactNativePlugin },
    rules: {
      'react-native/no-unused-styles': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'react-native/sort-styles': 'warn',
      'react-native/split-platform-components': 'warn',
      'react-native/no-raw-text': 'warn',
      'react-native/no-single-element-style-arrays': 'warn',
    },
  },

  // Formatting & code quality
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // Disallows more than max consecutive blank lines
      // good: one blank line between blocks
      // bad:  two or more blank lines in a row (max: 1)
      'no-multiple-empty-lines': ['error', { max: 1 }],
      // Requires every file to end with exactly one blank line
      // good: file ends with a single trailing newline
      // bad:  file ends without a trailing newline, or with multiple
      'eol-last': ['error', 'always'],
      // Enforces single quotes, allows backticks and double quotes when needed
      // good: const x = 'hello'; const y = `hi ${name}`; const z = "it's";
      // bad:  const x = "hello";
      quotes: [
        'error',
        'single',
        { allowTemplateLiterals: true, avoidEscape: true },
      ],
      // Flags declared-but-unused variables; _ prefix suppresses the warning
      // good: const _unused = 1; (suppressed by ^_ pattern)
      // bad:  const unused = 1; // never used -> error
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // ================================================================
  // ── GRAPHQL Rules ───────────────────────────────────────────────
  // ================================================================
  // Validates that GraphQL type names referenced in queries exist in the schema
  // good: query { users { id } } (assuming "users" and "id" are valid schema types)
  // bad:  query { userz { id } } ("userz" is not a known type)
  {
    files: ['**/*.graphql'],
    plugins: { '@graphql-eslint': graphqlPlugin },
    languageOptions: { parser: graphqlPlugin.parser },
    rules: {
      '@graphql-eslint/known-type-names': 'error',
    },
  },
];
