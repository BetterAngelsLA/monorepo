import { ApolloClient } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { initApolloRuntimeConfig } from '@monorepo/apollo';
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

const apolloClient = new ApolloClient({
  link: new UploadHttpLink({ uri: `${apiUrl}/graphql`, fetch: fetchClient }),
  cache: createShelterTypePolicies(isDevEnv),
});

const basename = import.meta.env.VITE_APP_BASE_PATH || '/';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ApiConfigProvider apiUrl={apiUrl} fetch={fetchClient}>
      <ApolloProvider client={apolloClient}>
        <ShelterFeatureControlProvider>
          <BrowserRouter basename={basename}>
            <UserProvider>
              <App />
            </UserProvider>
          </BrowserRouter>
        </ShelterFeatureControlProvider>
      </ApolloProvider>
    </ApiConfigProvider>
  </StrictMode>
);
      </ApolloProvider>
    </ApiConfigProvider>
  </StrictMode>
);
      </ApolloProvider>
    </ApiConfigProvider>
  </StrictMode>
);
