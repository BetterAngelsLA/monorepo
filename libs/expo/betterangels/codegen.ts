import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../../../apps/betterangels-backend/schema.graphql',
  documents: './src/lib/apollo/graphql/**/*.ts',
  generates: {
    './src/lib/apollo/gql-types/': {
      preset: 'client',
      plugins: [],
    },
  },
};

export default config;
