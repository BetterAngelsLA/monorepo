import { ApolloProvider } from '@apollo/client';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/app';
import { createApolloClient } from './app/clients/apollo/client';

const basename = import.meta.env.VITE_APP_BASE_PATH || '/';

const apolloClient = createApolloClient({
  apiUrl: import.meta.env.VITE_SHELTER_API_URL,
});

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
