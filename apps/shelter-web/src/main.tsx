import { ApolloProvider } from '@apollo/client/react';
import { initApolloRuntimeConfig } from '@monorepo/apollo';
import { createApolloClient } from '@monorepo/react/shared/apollo';
import {
  ApiConfigProvider,
  ShelterFeatureControlProvider,
  UserProvider,
  createShelterTypePolicies,
} from '@monorepo/react/shelter';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { App } from './app';

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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ApiConfigProvider apiUrl={apiUrl}>
      <ApolloProvider client={apolloClient}>
        <ShelterFeatureControlProvider>
          <UserProvider>
            <App />
          </UserProvider>
        </ShelterFeatureControlProvider>
      </ApolloProvider>
    </ApiConfigProvider>
  </StrictMode>
);
