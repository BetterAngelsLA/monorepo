import { HttpLink } from '@apollo/client';
import { createWebFetchClient } from '@monorepo/ba-platform/web';
import { ApolloClientProvider, getGraphqlUrl } from '@monorepo/ba-platform';
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

const basename = import.meta.env.VITE_APP_BASE_PATH || '/';
const fetchClient = createWebFetchClient();
const link = new HttpLink({ uri: getGraphqlUrl(apiUrl), fetch: fetchClient, credentials: 'include' });

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ApiConfigProvider apiUrl={apiUrl} fetch={fetchClient}>
      <ApolloClientProvider link={link}>
        <BrowserRouter basename={basename}>
          <UserProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </UserProvider>
        </BrowserRouter>
      </ApolloClientProvider>
    </ApiConfigProvider>
  </StrictMode>
);
