import { ApolloClient } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import {
  ApiConfigProvider,
  AuthProvider,
  UserProvider,
} from '@monorepo/react/betterangels-admin';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { apiUrl } from '../config';
import App from './app/app';
import { fetchClient } from './lib/fetchClient';

const basename = import.meta.env.VITE_APP_BASE_PATH || '/';

const fetchClient = composeFetchInterceptors(
  createOrgInterceptor(localStorageAdapter, DEFAULT_ORG_STORAGE_KEY),
  createCsrfInterceptor(readCsrfToken, refreshCsrfToken, CSRF_COOKIE_NAME),
)(window.fetch);

const apolloClient = new ApolloClient({
  link: new UploadHttpLink({ uri: `${apiUrl}/graphql`, fetch: fetchClient }),
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ApiConfigProvider apiUrl={apiUrl} fetch={fetchClient}>
      <ApolloProvider client={apolloClient}>
        <BrowserRouter basename={basename}>
          <UserProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </UserProvider>
        </BrowserRouter>
      </ApolloProvider>
    </ApiConfigProvider>
  </StrictMode>
);
