// @ts-check
import graphqlPlugin from '@graphql-eslint/eslint-plugin';
import nxPlugin from '@nx/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import a11yPlugin from 'eslint-plugin-react-native-a11y';

export default [
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      '**/dist',
      'node_modules',
      '**/coverage',
      '**/.expo',
      '**/generated',
      '**/*.d.ts',
      '.yarn',
    ],
  },

  // Registers the @nx plugin so @nx/enforce-module-boundaries can resolve
  ...nxPlugin.configs['flat/base'],
  // Enables import resolution rules (no-unresolved, named, etc.)
  importPlugin.flatConfigs.recommended,
  // Teaches the resolver to understand .ts/.tsx extensions
  importPlugin.flatConfigs.typescript,
  // Sets up @typescript-eslint parser + TS-specific nx rules
  ...nxPlugin.configs['flat/typescript'],
  // Sets up JS-specific nx rules (no TS parser needed)
  ...nxPlugin.configs['flat/javascript'],

  // Module boundaries (all JS/TS)
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // Reports conflicting named/default exports from the same module
      // good: export const foo = 1; export default bar;
      // bad:  export { foo }; export default foo;
      'import/export': 'error',
      // Prevents projects from importing libs with incompatible tags
      // good: type:feature importing from type:ui (allowed per depConstraints)
      // bad:  type:util importing from type:feature (util → feature is blocked)
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['.*libs/tailwind.*'],
          depConstraints: [
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
          ],
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

  // a11y accessibility
  // Enforces React Native accessibility props and roles on interactive elements
  // good: <View accessible accessibilityLabel="Submit" />
  // bad:  <View onClick={handle} /> (no accessibility props)
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: { 'react-native-a11y': a11yPlugin },
    rules: a11yPlugin.configs.all.rules,
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
