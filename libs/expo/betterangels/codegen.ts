import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../../../apps/betterangels-backend/schema.graphql',
  documents: 'src/**/*.{graphql,ts,tsx}',
  generates: {
    'src/types.ts': {
      plugins: ['typescript'],
    },
    'src/': {
      preset: 'near-operation-file',
      plugins: ['typescript-operations', 'typescript-react-apollo'],
      presetConfig: {
        baseTypesPath: 'graphql/types.ts',
        folder: '__generated__',
      },
    },
  },
};

export default config;
