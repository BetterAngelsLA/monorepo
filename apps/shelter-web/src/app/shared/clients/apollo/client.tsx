import {
  ApolloClient,
  from,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';

import { RestLink } from 'apollo-link-rest';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { csrfLink } from './csrf';

type IApolloClient = {
  apiUrl: string;
};

export const createApolloClient = (
  props: IApolloClient
): ApolloClient<NormalizedCacheObject> => {
  const { apiUrl } = props;

  const headers = { Referer: apiUrl };

  const uploadLink = createUploadLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
    headers,
  });

  const restLink = new RestLink({
    uri: apiUrl,
    credentials: 'include',
    headers,
  });

  return new ApolloClient({
    link: from([csrfLink(`${apiUrl}/admin/login/`), restLink, uploadLink]),
    cache: new InMemoryCache(),
  });
};
