import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { ApolloProvider } from '@apollo/client';
import App from './app/app';
import { createApolloClient } from './app/shared/clients/apollo/client';

const apolloClient = createApolloClient({
  apiUrl: import.meta.env.VITE_SHELTER_API_URL,
});

// Get the basename from the current path
const basename = window.location.pathname.split('/').slice(0, -1).join('/');

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
