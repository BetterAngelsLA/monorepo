import { ApolloProvider } from '@apollo/client';
import {
  ApiConfigProvider,
  UserProvider,
} from '@monorepo/react/betterangels-admin';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { apiUrl, demoApiUrl } from '../config';
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
    <ApiConfigProvider productionUrl={apiUrl} demoUrl={demoApiUrl}>
      <ApolloProvider client={apolloClient}>
        <BrowserRouter basename={basename}>
          <UserProvider>
            <App />
          </UserProvider>
        </BrowserRouter>
      </ApolloProvider>
    </ApiConfigProvider>
  </StrictMode>
);
