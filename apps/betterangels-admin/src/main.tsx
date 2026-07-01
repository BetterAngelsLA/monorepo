import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { ApolloClientProvider } from '@monorepo/ba-platform';
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
const httpLink = new UploadHttpLink({ uri: `${apiUrl}/graphql`, fetch: fetchClient });

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ApiConfigProvider apiUrl={apiUrl} fetch={fetchClient}>
      <ApolloClientProvider link={httpLink}>
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
