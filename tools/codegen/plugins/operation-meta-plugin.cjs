/**
 * Codegen plugin that writes `_meta.generated.ts` files alongside
 * each generated operation file.
 *
 * For every named operation (query or mutation), extracts:
 *   - operationKey:   the field name under `response.data` (e.g. `'updateShelter'`)
 *   - successTypename: the `__typename` of the successful result type
 *
 * Success typename is resolved via two strategies:
 *   1. Inline fragments — scans the first field's top-level `... on SomeType`
 *      for the first non-`OperationInfo` type. Does not recurse into nested objects.
 *   2. Schema lookup  — resolves the field's return type from the GraphQL schema
 */

const { writeFileSync, mkdirSync } = require('node:fs');
const { dirname } = require('node:path');
const {
  Kind,
  visit,
  isUnionType,
  isInterfaceType,
  GraphQLNonNull,
  GraphQLList,
} = require('graphql');

// Strips GraphQL wrappers (NonNull, List) to reach the underlying named type.
/**
 * @param {import('graphql').GraphQLOutputType} type
 * @returns {import('graphql').GraphQLNamedType | null}
 */
function unwrapType(type) {
  let current = type;
  while (current instanceof GraphQLNonNull || current instanceof GraphQLList) {
    current = current.ofType;
  }
  return current && current.name ? current : null;
}

/**
 * @param {string} str
 * @returns {string}
 */
function camelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Derives the generated TS type name from the operation name and type.
// E.g. `UpdateShelterProfile` mutation → `UpdateShelterProfileMutation`
/**
 * @param {string} operationName
 * @param {'query' | 'mutation'} operationType
 * @returns {string}
 */
function generatedTypeName(operationName, operationType) {
  const suffix = operationType === 'query' ? 'Query' : 'Mutation';
  return `${operationName}${suffix}`;
}

/**
 * @type {import('@graphql-codegen/plugin-helpers').CodegenPlugin}
 */
module.exports = {
  /**
   * @param {import('graphql').GraphQLSchema} _schema
   * @param {import('@graphql-codegen/plugin-helpers').Types.DocumentFile[]} documents
   * @param {any} _config
   * @param {{ outputFile: string }} info
   * @returns {string}
   */
  plugin(schema, documents, _config, info) {
    const outputFile = info.outputFile;
    const metaFile = outputFile.replace('.generated.ts', '_meta.generated.ts');
    const baseName = outputFile.replace('.generated.ts', '').split('/').pop();
    const outputDir = dirname(outputFile);

    if (outputDir) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Parse the GraphQL document and extract operation metadata
    const operations = [];

    for (const { document } of documents) {
      if (!document) continue;

      visit(document, {
        OperationDefinition(node) {
          if (!node.name) {
            console.warn(
              '[operation-meta] Skipping unnamed operation — operations must be named to generate meta.'
            );
            return;
          }

          const operationName = node.name.value;

          const field = node.selectionSet.selections.find(
            (s) => s.kind === Kind.FIELD
          );
          if (!field || !field.name) {
            console.warn(
              `[operation-meta] Skipping ${operationName} — no field found in selection set.`
            );
            return;
          }
          const fieldName = field.name.value;

          // Strategy 1: extract success typename from inline fragments.
          // The first `... on <Type>` where Type is not 'OperationInfo' wins.
          let successTypename = null;
          if (field.selectionSet) {
            for (const sel of field.selectionSet.selections) {
              if (
                sel.kind === Kind.INLINE_FRAGMENT &&
                sel.typeCondition &&
                sel.typeCondition.name.value !== 'OperationInfo'
              ) {
                successTypename = sel.typeCondition.name.value;
                break;
              }
            }
          }

          // Warn if inline fragments exist but all are OperationInfo.
          if (!successTypename) {
            const hasFragments = field.selectionSet?.selections.some(
              (s) => s.kind === Kind.INLINE_FRAGMENT
            );
            if (hasFragments) {
              console.warn(
                `[operation-meta] No success typename for ${operationName}:${fieldName} — ` +
                  `all inline fragments are OperationInfo.`
              );
            }
          }

          // Strategy 2: resolve the field's return type from the schema.
          // Used when inline fragments are absent (e.g. flat queries).
          if (!successTypename && schema) {
            const rootType =
              node.operation === 'query'
                ? schema.getQueryType()
                : schema.getMutationType();
            if (rootType) {
              const fieldDef = rootType.getFields()[fieldName];
              if (fieldDef) {
                const type = unwrapType(fieldDef.type);
                if (type) {
                  if (isUnionType(type) || isInterfaceType(type)) {
                    console.warn(
                      `[operation-meta] Skipping successTypename for ${operationName}:${fieldName} — ` +
                        `return type "${type.name}" is a ${
                          isUnionType(type) ? 'union' : 'interface'
                        }, ` +
                        `add inline fragments to disambiguate.`
                    );
                  } else if (type.name === 'OperationInfo') {
                    console.warn(
                      `[operation-meta] Field ${operationName}:${fieldName} resolves to OperationInfo — ` +
                        `this likely indicates a schema issue or missing inline fragments.`
                    );
                  } else {
                    successTypename = type.name;
                  }
                }
              }
            }
          }

          // Warn if no success typename could be resolved through any strategy.
          if (!successTypename && !schema) {
            console.warn(
              `[operation-meta] No success typename for ${operationName}:${fieldName} — ` +
                `schema unavailable and no inline fragments found.`
            );
          }

          operations.push({
            name: operationName,
            fieldName,
            successTypename,
            type: node.operation,
          });
        },
      });
    }

    if (!operations.length) return '';

    // Build the companion _meta.generated.ts file.
    // Every operation gets an `operationKey`. Operations with a
    // resolvable success typename also get `successTypename` + `Meta`.
    const imports = [];
    const seenTypes = new Set();

    for (const op of operations) {
      const typeName = generatedTypeName(op.name, op.type);
      if (!seenTypes.has(typeName)) {
        seenTypes.add(typeName);
        imports.push(
          `import type { ${typeName} } from './${baseName}.generated';`
        );
      }
    }

    const sections = [];

    for (const op of operations) {
      const typeName = generatedTypeName(op.name, op.type);
      const camelName = camelCase(op.name);

      sections.push(
        '',
        `export const ${camelName}OperationKey: keyof Omit<${typeName}, '__typename'> = '${op.fieldName}';`
      );

      if (op.successTypename) {
        sections.push(
          `export const ${camelName}SuccessTypename: Extract<`,
          `  NonNullable<${typeName}['${op.fieldName}']>,`,
          `  { __typename: '${op.successTypename}' }`,
          `>['__typename'] = '${op.successTypename}';`,
          '',
          `export const ${camelName}Meta = {`,
          `  operationKey: ${camelName}OperationKey,`,
          `  successTypename: ${camelName}SuccessTypename,`,
          `} as const;`
        );
      }
    }

    const output = [
      '// Auto-generated by tools/codegen/plugins/operation-meta-plugin.cjs — do not edit',
      '',
      ...imports,
      ...sections,
      '',
    ].join('\n');

    writeFileSync(metaFile, output, 'utf-8');
    return '';
  },
};
