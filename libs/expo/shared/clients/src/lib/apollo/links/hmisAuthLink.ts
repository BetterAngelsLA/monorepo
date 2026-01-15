import { ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getHmisAuthToken } from '@monorepo/expo/shared/utils';

/**
 * Apollo link that adds HMIS token in custom header ONLY for HMIS operations
 * Uses X-HMIS-Token header to avoid conflicts with user Authorization
 * Reads token from cookies set by server
 */
export const createHmisAuthLink = (): ApolloLink => {
  return setContext(async (operation, { headers }) => {
    const operationName = operation.operationName?.toLowerCase() || '';

    // Only add HMIS token for HMIS operations
    const isHmisOperation = operationName.includes('hmis');

    if (!isHmisOperation) {
      return { headers };
    }

    const authToken = await getHmisAuthToken();

    if (!authToken) {
      return { headers };
    }

    return {
      headers: {
        ...headers,
        'x-hmis-token': authToken, // Custom header instead of Authorization
      },
    };
  });
};
