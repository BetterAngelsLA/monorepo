import { HttpLink } from '@apollo/client';
import { initApolloRuntimeConfig } from '@monorepo/apollo';
import { createWebFetchClient } from '@monorepo/ba-platform/web';
import { ApolloClientProvider, getGraphqlUrl } from '@monorepo/ba-platform';
import {
  ApiConfigProvider,
  ShelterFeatureControlProvider,
  UserProvider,
  createShelterTypePolicies,
} from '@monorepo/react/shelter';
import { createOperatorTypePolicies } from '@monorepo/react/shelter-operator';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app';

const isDevEnv = import.meta.env.DEV;

initApolloRuntimeConfig({
  isDevEnv,
});

const apiUrl = import.meta.env.VITE_SHELTER_API_URL || '';

const basename = import.meta.env.VITE_APP_BASE_PATH || '/';
const fetchClient = createWebFetchClient();
const link = new HttpLink({ uri: getGraphqlUrl(apiUrl), fetch: fetchClient, credentials: 'include' });
const typePolicies = createShelterTypePolicies({
  isDevEnv,
  extraPolicies: createOperatorTypePolicies(),
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ApiConfigProvider apiUrl={apiUrl} fetch={fetchClient}>
      <ApolloClientProvider link={link} typePolicies={typePolicies}>
        <ShelterFeatureControlProvider>
          <BrowserRouter basename={basename}>
            <UserProvider>
              <App />
            </UserProvider>
          </BrowserRouter>
        </ShelterFeatureControlProvider>
      </ApolloClientProvider>
    </ApiConfigProvider>
  </StrictMode>
);
