import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../../../apps/betterangels-backend/schema.graphql',
  documents: [
    'src/**/*.{graphql,ts,tsx}',
    '!src/**/__generated__/**/*.{graphql,ts,tsx}',
  ],
  generates: {
    'src/': {
      preset: 'near-operation-file',
      plugins: ['typescript-operations', 'typed-document-node'],
      config: {
        scalars: {
          NonBlankString: 'string',
        },
        useTypeImports: true,
      },
      presetConfig: {
        baseTypesPath: '@monorepo/ba-platform/types',
        folder: '__generated__',
        importTypes: true,
      },
    },
  },
};

export default config;
