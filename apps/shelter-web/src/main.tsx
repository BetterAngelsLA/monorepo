import { ApolloProvider } from '@apollo/client/react';
import { initApolloRuntimeConfig } from '@monorepo/apollo';
import { FeatureControlProvider } from '@monorepo/react/shared';
import { createApolloClient } from '@monorepo/react/shared/apollo';
import { createShelterTypePolicies } from '@monorepo/react/shelter';
import {
  ApiConfigProvider,
  AuthProvider,
  UserProvider,
} from '@monorepo/react/shelter-operator';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/app';

const isDevEnv = import.meta.env.DEV;

initApolloRuntimeConfig({
  isDevEnv,
});

const csrfCookieName =
  import.meta.env.VITE_SHELTER_CSRF_COOKIE_NAME || 'csrftoken';
const csrfHeaderName =
  import.meta.env.VITE_SHELTER_CSRF_HEADER_NAME || 'x-csrftoken';

const apolloClient = createApolloClient({
  apiUrl: import.meta.env.VITE_SHELTER_API_URL,
  csrfCookieName,
  csrfHeaderName,
  typePolicies: createShelterTypePolicies(isDevEnv),
  isDevEnv,
});

const apiUrl = import.meta.env.VITE_SHELTER_API_URL || '';

// to allow preview by branch
const basename = import.meta.env.VITE_APP_BASE_PATH || '/';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ApiConfigProvider apiUrl={apiUrl}>
      <ApolloProvider client={apolloClient}>
        <FeatureControlProvider>
          <BrowserRouter basename={basename}>
            <UserProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </UserProvider>
          </BrowserRouter>
        </FeatureControlProvider>
      </ApolloProvider>
    </ApiConfigProvider>
  </StrictMode>
);
