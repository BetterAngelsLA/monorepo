import {
  Kind,
  parse,
  type DefinitionNode,
  type DirectiveNode,
  type FieldDefinitionNode,
  type ObjectTypeDefinitionNode,
  type ObjectTypeExtensionNode,
  type OperationDefinitionNode,
} from 'graphql';
import { filter, flatMap, map, pipe } from 'remeda';
import { schema } from '../graphql/__generated__/schema';

// Cache directive->operations mappings to avoid re-parsing
const directiveCache = new Map<string, Set<string>>();

type QueryOrMutationDef = ObjectTypeDefinitionNode | ObjectTypeExtensionNode;

const QUERY_OR_MUTATION_NAMES = ['Query', 'Mutation'];

const isQueryOrMutationDef = (def: DefinitionNode): def is QueryOrMutationDef =>
  (def.kind === Kind.OBJECT_TYPE_DEFINITION ||
    def.kind === Kind.OBJECT_TYPE_EXTENSION) &&
  QUERY_OR_MUTATION_NAMES.includes(def.name.value);

const hasDirectiveNamed = (field: FieldDefinitionNode, name: string): boolean =>
  field.directives?.some((d: DirectiveNode) => d.name.value === name) ?? false;

/**
 * Get all operations marked with a specific directive.
 * @param directiveName - The directive name (e.g., 'hmisDirective')
 * @returns Set of operation names with the directive
 */
export function getOperationsByDirective(directiveName: string): Set<string> {
  const cached = directiveCache.get(directiveName);
  if (cached) {
    return cached;
  }
  const ast = parse(schema);

  // Pipeline that extracts operation names with the directive:
  // 1. Filter to Query/Mutation type definitions
  // 2. Flatten their field arrays
  // 3. Filter fields that have the specified directive
  // 4. Map to field names
  const ops = new Set<string>(
    pipe(
      ast.definitions,
      filter(isQueryOrMutationDef),
      flatMap((def) => (def.fields ?? []) as readonly FieldDefinitionNode[]),
      filter((field): field is FieldDefinitionNode =>
        hasDirectiveNamed(field, directiveName)
      ),
      map((field) => field.name.value)
    )
  );

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

  return operation.selectionSet.selections.some(
    (selection) =>
      selection.kind === Kind.FIELD && directiveOps.has(selection.name.value)
  );
}
