import type { CodegenConfig } from '@graphql-codegen/cli';
import { SCALAR_IMPORT_PLUGIN, SHARED_SCALAR_CONFIG } from '../../tools/codegen/scalars';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../../apps/betterangels-backend/schema.graphql',
  documents: [
    'src/**/*.{graphql,ts,tsx}',
    '!src/**/__generated__/**/*.{graphql,ts,tsx}',
  ],
  generates: {
    'src/lib/apollo/graphql/__generated__/types.ts': {
      plugins: [SCALAR_IMPORT_PLUGIN, 'typescript'],
      config: {
        ...SHARED_SCALAR_CONFIG,
      },
    },
    'src/': {
      preset: 'near-operation-file',
      plugins: [
        SCALAR_IMPORT_PLUGIN,
        'typescript-operations',
        'typed-document-node',
      ],
      config: {
        ...SHARED_SCALAR_CONFIG,
        useTypeImports: true,
      },
      presetConfig: {
        baseTypesPath: 'lib/apollo/graphql/__generated__/types.ts',
        folder: '__generated__',
        importTypes: true,
      },
    },
  },
};

export default config;
