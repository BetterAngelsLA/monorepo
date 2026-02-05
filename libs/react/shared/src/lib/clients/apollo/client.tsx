import {
  ApolloClient,
  ApolloLink,
  from,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';

import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { csrfLink } from './csrf';

type IApolloClient = {
  apiUrl: string;
  csrfCookieName: string;
  csrfHeaderName: string;
};

export const createApolloClient = ({
  apiUrl,
  csrfCookieName,
  csrfHeaderName,
}: IApolloClient): ApolloClient<NormalizedCacheObject> => {
  const uploadLink = createUploadLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
  });

  const restLink = new RestLink({
    uri: apiUrl,
    credentials: 'include',
  });

  return new ApolloClient({
    link: from([
      csrfLink({
        apiUrl: `${apiUrl}/admin/login/`,
        cookieName: csrfCookieName,
        headerName: csrfHeaderName,
      }),
      restLink,
      uploadLink as unknown as ApolloLink,
    ]),
    cache: new InMemoryCache(),
  });
};
