import type { CodegenConfig } from '@graphql-codegen/cli';
import { readFileSync } from 'fs';

const schemaPath = '../../../../apps/betterangels-backend/schema.graphql';
const schemaString = readFileSync(schemaPath, 'utf8');

const config: CodegenConfig = {
  overwrite: true,
  schema: schemaPath,
  generates: {
    'src/lib/apollo/graphql/__generated__/schema.ts': {
      plugins: ['add'],
      config: {
        content: [
          '// This file is generated - do not edit',
          `export const schema = ${JSON.stringify(schemaString)};`,
        ].join('\n'),
      },
    },
  },
};

export default config;
