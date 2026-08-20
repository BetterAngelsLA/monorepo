import type { CodegenConfig } from '@graphql-codegen/cli';
import { SCALAR_IMPORT_PLUGIN, SHARED_SCALAR_CONFIG } from '../../../tools/codegen/scalars';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../../../apps/betterangels-backend/schema.graphql',
  documents: [
    'src/**/*.{graphql,ts,tsx}',
    '!src/**/__generated__/**/*.{graphql,ts,tsx}',
  ],
  ignoreNoDocuments: true,
  generates: {
    'src/': {
      preset: 'near-operation-file',
      plugins: [
        SCALAR_IMPORT_PLUGIN,
        'typescript-operations',
        'typed-document-node',
        '../../../tools/codegen/plugins/operation-meta-plugin.cjs',
      ],
      config: {
        nonOptionalTypename: true,
        ...SHARED_SCALAR_CONFIG,
        useTypeImports: true,
      },
      presetConfig: {
        baseTypesPath: '~@monorepo/ba-platform/types',
        folder: '__generated__',
        importTypes: true,
      },
    },
  },
};

export default config;
