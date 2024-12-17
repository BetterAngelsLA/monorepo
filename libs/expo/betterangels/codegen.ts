import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../../../apps/betterangels-backend/schema.graphql',
  documents: [
    'src/**/*.{graphql,ts,tsx}',
    '!src/**/__generated__/**/*.{graphql,ts,tsx}',
    '../../react/shelter/src/**/*.{graphql,ts,tsx}',
    '!../../react/shelter/src/**/__generated__/**/*.{graphql,ts,tsx}',
  ],
  generates: {
    'src/lib/apollo/graphql/__generated__/types.ts': {
      plugins: ['typescript'],
    },
    '../../react/shelter/src/lib/apollo/graphql/__generated__/types.ts': {
      plugins: ['typescript'],
    },
    'src/': {
      preset: 'near-operation-file',
      plugins: ['typescript-operations', 'typescript-react-apollo'],
      presetConfig: {
        baseTypesPath: 'lib/apollo/graphql/__generated__/types.ts',
        folder: '__generated__',
      },
    },
  },
};

export default config;
