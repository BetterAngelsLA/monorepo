import { Kind, parse, type OperationDefinitionNode } from 'graphql';
import { schema } from '../graphql/__generated__/schema';

// Cache directive->operations mappings to avoid re-parsing
const directiveCache = new Map<string, Set<string>>();

/**
 * Get all operations marked with a specific directive.
 * @param directiveName - The directive name (e.g., 'hmisDirective')
 * @returns Set of operation names with the directive
 */
export function getOperationsByDirective(directiveName: string): Set<string> {
  if (directiveCache.has(directiveName)) {
    return directiveCache.get(directiveName)!;
  }

  const ast = parse(schema);
  const ops = new Set<string>();

  for (const def of ast.definitions) {
    if (
      (def.kind === Kind.OBJECT_TYPE_DEFINITION ||
        def.kind === Kind.OBJECT_TYPE_EXTENSION) &&
      (def.name.value === 'Query' || def.name.value === 'Mutation')
    ) {
      for (const field of def.fields || []) {
        if (field.directives?.some((d) => d.name.value === directiveName)) {
          ops.add(field.name.value);
        }
      }
    }
  }

  directiveCache.set(directiveName, ops);
  return ops;
}

/**
 * Check if a GraphQL operation contains a field marked with the specified directive.
 * @param operation - The GraphQL operation definition
 * @param directiveName - The directive to check for
 * @returns true if any field in the operation has the directive
 */
export function operationHasDirective(
  operation: OperationDefinitionNode | undefined,
  directiveName: string
): boolean {
  if (!operation?.selectionSet) return false;

  const directiveOps = getOperationsByDirective(directiveName);

  for (const selection of operation.selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      if (directiveOps.has(selection.name.value)) {
        return true;
      }
    }
  }

  return false;
}
