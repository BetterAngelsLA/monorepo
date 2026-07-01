import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { initApolloRuntimeConfig } from '@monorepo/apollo';
import { ApolloClientProvider } from '@monorepo/ba-platform';
import {
  ApiConfigProvider,
  ShelterFeatureControlProvider,
  UserProvider,
  createShelterTypePolicies,
} from '@monorepo/react/shelter';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app';
import { fetchClient } from './lib/fetchClient';

const isDevEnv = import.meta.env.DEV;
initApolloRuntimeConfig({ isDevEnv });

const apiUrl = import.meta.env.VITE_SHELTER_API_URL || '';

const basename = import.meta.env.VITE_APP_BASE_PATH || '/';
const httpLink = new UploadHttpLink({ uri: `${apiUrl}/graphql`, fetch: fetchClient });
const typePolicies = createShelterTypePolicies(isDevEnv);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ApiConfigProvider apiUrl={apiUrl} fetch={fetchClient}>
      <ApolloClientProvider link={httpLink} typePolicies={typePolicies}>
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
