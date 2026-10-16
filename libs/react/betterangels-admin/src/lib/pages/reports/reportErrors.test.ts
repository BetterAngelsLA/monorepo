import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { describe, expect, it } from 'vitest';
import { isRefusalError } from './reportErrors';

const graphQLError = (extensions?: Record<string, unknown>) =>
  new CombinedGraphQLErrors({
    data: null,
    errors: [{ message: 'not allowed', extensions }],
  });

const serverError = (statusCode: number) =>
  new ServerError(`request failed with ${statusCode}`, {
    response: new Response(null, { status: statusCode }),
    bodyText: '',
  });

describe('isRefusalError', () => {
  it('treats a 401 or a 403 as a refusal', () => {
    expect(isRefusalError(serverError(401))).toBe(true);
    expect(isRefusalError(serverError(403))).toBe(true);
  });

  it('treats the auth-shaped GraphQL codes as a refusal', () => {
    // A permission failure over HTTP 200 arrives as `errors[]`, not as a status.
    expect(isRefusalError(graphQLError({ code: 'UNAUTHENTICATED' }))).toBe(true);
    expect(isRefusalError(graphQLError({ code: 'PERMISSION_DENIED' }))).toBe(true);
    // The backend's own unauthenticated error carries both, and either alone is enough.
    expect(
      isRefusalError(graphQLError({ code: 'UNAUTHENTICATED', http: { status: 401 } })),
    ).toBe(true);
    expect(isRefusalError(graphQLError({ http: { status: 403 } }))).toBe(true);
  });

  it('treats everything else as a fault, so a 500 is not a permission diagnosis', () => {
    expect(isRefusalError(serverError(500))).toBe(false);
    expect(isRefusalError(new Error('fetch failed 500'))).toBe(false);
    // A 200 GraphQL error with no auth code is a resolver fault or a validation error.
    expect(isRefusalError(graphQLError())).toBe(false);
    expect(isRefusalError(graphQLError({ code: 'VALIDATION_ERROR' }))).toBe(false);
    // An offline browser surfaces as a link error, not an Apollo response.
    expect(isRefusalError(new TypeError('Failed to fetch'))).toBe(false);
    expect(isRefusalError(undefined)).toBe(false);
    expect(isRefusalError('boom')).toBe(false);
  });
});
