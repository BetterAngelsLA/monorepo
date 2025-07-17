import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { CSRF_HEADER_NAME, getCSRFToken } from '../common';

export const createApolloClient = (
  apiUrl: string,
  csrfUrl = `${apiUrl}/admin/login/`
) =>
  new ApolloClient({
    link: from([
      setContext(async (_, { headers = {} }) => {
        const token = await getCSRFToken(apiUrl, csrfUrl);
        return {
          headers: {
            ...headers,
            ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
          },
        };
      }),
      new RestLink({ uri: apiUrl, credentials: 'include' }),
      createUploadLink({
        uri: `${apiUrl}/graphql`,
        credentials: 'include',
      }),
    ]),
    cache: new InMemoryCache(),
    credentials: 'include',
  });
