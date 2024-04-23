import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../../../apps/betterangels-backend/schema.graphql',
  documents: './src/lib/apollo/graphql/**/*.{graphql,ts,tsx}',
  generates: {
    './src/lib/apollo/gql-types/index.tsx': {
      plugins: ['typescript-operations', 'typescript-react-apollo'],
    },
  },
};

export default config;
