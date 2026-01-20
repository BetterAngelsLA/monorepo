import type { CodegenConfig } from '@graphql-codegen/cli';
import fs from 'fs';

const backendSchema = fs.readFileSync(
  '../../../../apps/betterangels-backend/schema.graphql',
  'utf8'
);
const escapedSchema = backendSchema.replace(/`/g, '\\`');

const config: CodegenConfig = {
  overwrite: true,
  schema: '../../../../apps/betterangels-backend/schema.graphql',
  generates: {
    'src/lib/apollo/graphql/__generated__/schema.graphql': {
      plugins: ['schema-ast'],
      config: {
        includeDirectives: true,
      },
    },
    'src/lib/apollo/graphql/__generated__/schema.ts': {
      plugins: ['add'],
      config: {
        content: `// This file is generated - do not edit\nexport const schema = \`${escapedSchema}\`;\n`,
      },
    },
  },
};

export default config;
