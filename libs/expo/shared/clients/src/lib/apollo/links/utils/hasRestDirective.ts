import { DocumentNode, visit } from 'graphql';

export function hasRestDirective(query: DocumentNode): boolean {
  let found = false;

  visit(query, {
    Directive(node) {
      if (node.name.value === 'rest') {
        found = true;
      }
    },
  });

  return found;
}
