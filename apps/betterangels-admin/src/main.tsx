import { ApolloProvider } from '@apollo/client/react';
import {
  ApiConfigProvider,
  AuthProvider,
  UserProvider,
} from '@monorepo/react/betterangels-admin';
import { createApolloClient } from '@monorepo/react/shared';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { apiUrl } from '../config';
import App from './app/app';

const basename = import.meta.env.VITE_APP_BASE_PATH || '/';
const csrfCookieName =
  import.meta.env.VITE_BETTERANGELS_ADMIN_CSRF_COOKIE_NAME || 'csrftoken';
const csrfHeaderName =
  import.meta.env.VITE_BETTERANGELS_ADMIN_CSRF_HEADER_NAME || 'x-csrftoken';

const apolloClient = createApolloClient({
  apiUrl: import.meta.env.VITE_BETTERANGELS_ADMIN_API_URL,
  csrfCookieName,
  csrfHeaderName,
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
