import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
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
}: IApolloClient): ApolloClient => {
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
      uploadHttpLink,
    ]),
    cache: new InMemoryCache(),
  });
};
