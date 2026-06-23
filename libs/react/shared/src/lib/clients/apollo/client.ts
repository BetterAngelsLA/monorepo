import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  TypePolicies,
} from '@apollo/client';
import { createApolloCache } from '@monorepo/apollo';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { orgLink as defaultOrgLink } from '../../apollo/links';
import { csrfLink } from './csrf';

type IApolloClient = {
  apiUrl: string;
  csrfCookieName: string;
  csrfHeaderName: string;
  cacheStore?: InMemoryCache;
  typePolicies?: TypePolicies;
  isDevEnv?: boolean;
  /** Override the default org-link (e.g. when using a different storage key or adapter). */
  orgLink?: ApolloLink;
};

export const createApolloClient = ({
  apiUrl,
  csrfCookieName,
  csrfHeaderName,
  cacheStore,
  typePolicies,
  orgLink = defaultOrgLink,
}: IApolloClient): ApolloClient => {
  const cache = cacheStore || createApolloCache({ typePolicies });

  const uploadHttpLink = new UploadHttpLink({
    uri: `${apiUrl}/graphql`,
    credentials: 'include',
  });

  return new ApolloClient({
    link: ApolloLink.from([
      csrfLink({
        apiUrl: `${apiUrl}/admin/login/`,
        cookieName: csrfCookieName,
        headerName: csrfHeaderName,
      }),
      orgLink,
      uploadHttpLink,
    ]),
    cache,
    // NOTE: in v4 the notifyOnNetworkStatusChange default value changed to `true`.
    // Resetting default to false to mimic earlier (v3) behavior until we make
    // necessary updates to switch to the new default.
    defaultOptions: {
      watchQuery: {
        notifyOnNetworkStatusChange: false,
      },
    },
  });
};
