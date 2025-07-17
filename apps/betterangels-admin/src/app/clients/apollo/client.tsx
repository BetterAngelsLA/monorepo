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

  const uploadLink = createUploadLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
  });

  const restLink = new RestLink({
    uri: apiUrl,
    credentials: 'include',
  });

  return new ApolloClient({
    link: from([csrfLink(`${apiUrl}/admin/login/`), restLink, uploadLink]),
    cache: new InMemoryCache(),
  });
};
