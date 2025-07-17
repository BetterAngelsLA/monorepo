import { ApolloProvider } from '@apollo/client';
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
import { createApolloClient } from './app/clients/apollo/client';

const basename = import.meta.env.VITE_APP_BASE_PATH || '/';

const apolloClient = createApolloClient({
  apiUrl: import.meta.env.VITE_BETTERANGELS_ADMIN_API_URL,
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ApiConfigProvider apiUrl={apiUrl}>
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
