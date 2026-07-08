import type { ExtensionError, GraphQLResponse } from '../types';

/**
 * Extract raw extension-level errors from a GraphQL response.
 *
 * Handles the `clients/schema.py` → `validate_client_profile_data` →
 * `GraphQLError` error path, which embeds `{field, location, errorCode}`
 * objects in `response.errors[0].extensions.errors`.
 */
export function getExtensionErrors(
  response: GraphQLResponse
): ExtensionError[] {
  return response.errors?.[0]?.extensions?.errors ?? [];
}
