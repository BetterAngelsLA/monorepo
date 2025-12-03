import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '@monorepo/react/shared';

import App from './app/app';

const csrfCookieName =
  import.meta.env.VITE_SHELTER_CSRF_COOKIE_NAME || 'csrftoken';
const csrfHeaderName =
  import.meta.env.VITE_SHELTER_CSRF_HEADER_NAME || 'x-csrftoken';

const apolloClient = createApolloClient({
  apiUrl: import.meta.env.VITE_SHELTER_API_URL,
  csrfCookieName,
  csrfHeaderName,
});

const basename = import.meta.env.VITE_APP_BASE_PATH || '/';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
    </ApolloProvider>
  </StrictMode>
);
