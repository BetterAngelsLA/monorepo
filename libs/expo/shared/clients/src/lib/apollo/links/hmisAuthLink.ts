import { ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { getHmisAuthToken } from '@monorepo/expo/shared/utils';

const MODERN_BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Apollo link that adds HMIS token in custom header ONLY for HMIS operations
 * Uses X-HMIS-Token header to avoid conflicts with user Authorization
 * Reads token from cookies set by server
 */
export const createHmisAuthLink = (): ApolloLink => {
  return new SetContextLink(async (prevContext, operation) => {
    const headers = (prevContext['headers'] ?? {}) as Record<string, string>;
    const operationName = operation.operationName?.toLowerCase() || '';

    // Only add HMIS token for HMIS operations
    const isHmisOperation = operationName.includes('hmis');

    if (!isHmisOperation) {
      return { headers };
    }
    const nextHeaders: Record<string, string> = { ...headers };
    nextHeaders['User-Agent'] = MODERN_BROWSER_USER_AGENT;

    const authToken = await getHmisAuthToken();
    if (authToken) {
      nextHeaders['x-hmis-token'] = authToken; // Custom header instead of Authorization
    }

    return { headers: nextHeaders };
  });
};
