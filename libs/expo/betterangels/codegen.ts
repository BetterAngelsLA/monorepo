import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../../../apps/betterangels-backend/schema.graphql',
  documents: 'src/**/*.{graphql,ts,tsx}',
  generates: {
    './src/': {
      preset: 'near-operation-file',
      plugins: ['typescript-operations'],
      presetConfig: {
        baseTypesPath: 'types.ts',
        folder: '__graphql__',
      },
    },
  },
};

export default config;
