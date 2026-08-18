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
import { apolloLink, basename, fetchClient } from './init';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ApiConfigProvider apiUrl={apiUrl} buildFetch={() => fetchClient}>
      <ApolloClientProvider link={apolloLink}>
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
