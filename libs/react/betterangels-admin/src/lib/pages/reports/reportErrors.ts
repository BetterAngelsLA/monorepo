/**
 * The two error policies this page applies to a failed query.
 *
 * A **refusal** (401/403, or the GraphQL codes the server uses for the same thing) is a
 * permission answer and gets its own copy; everything else is a **fault** and gets the generic
 * message. The distinction is not cosmetic: telling a reader their role cannot see individual
 * interactions when the API returned a 500 or the browser was offline is a false diagnosis of a
 * fault they could retry.
 *
 * `isRefusedTileError` in `DeckMapLayers` applies the same policy to the density tiles, whose
 * errors arrive as loaders.gl message strings rather than as Apollo errors — the shapes differ,
 * the rule does not.
 */

import {
  CombinedGraphQLErrors,
  ServerError,
  ServerParseError,
} from '@apollo/client/errors';

/** The one user-facing message for a fault. Backend error bodies are never shown. */
export const GENERIC_ERROR_MESSAGE =
  'Sorry, something went wrong. Please try again.';

/** The HTTP statuses that mean "you may not", as opposed to "it did not work". */
const REFUSAL_STATUSES = new Set([401, 403]);

/** The GraphQL codes the server uses for the same refusal. */
const REFUSAL_CODES = new Set([
  'UNAUTHENTICATED',
  'PERMISSION_DENIED',
  'FORBIDDEN',
]);

/** `extensions.http.status`, when the server reports the status it would have used. */
function httpStatusOf(
  extensions: Readonly<Record<string, unknown>> | undefined,
) {
  const http = extensions?.['http'];
  if (typeof http !== 'object' || http === null || !('status' in http)) {
    return undefined;
  }
  return Number(http.status);
}

/**
 * Whether an HTTP status is a refusal rather than a fault.
 *
 * Exported because the density tiles reach this decision from a different shape — a loaders.gl
 * message string rather than an Apollo error — and the policy is the half that must not
 * diverge. A caller that has a status should ask this rather than restate the set.
 */
export function isRefusalStatus(status: number): boolean {
  return REFUSAL_STATUSES.has(status);
}

/**
 * Whether an Apollo error is a refusal rather than a fault.
 *
 * `ServerError`/`ServerParseError` carry the HTTP status; a GraphQL error over a 200 carries a
 * code instead. Anything else — a dropped connection, a parse failure, a resolver that threw —
 * is a fault.
 */
export function isRefusalError(error: unknown): boolean {
  if (ServerError.is(error) || ServerParseError.is(error)) {
    return isRefusalStatus(error.statusCode);
  }
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some((graphQLError) => {
      const extensions = graphQLError.extensions;
      if (REFUSAL_CODES.has(String(extensions?.['code'] ?? ''))) {
        return true;
      }
      return isRefusalStatus(httpStatusOf(extensions) ?? 0);
    });
  }
  return false;
}
