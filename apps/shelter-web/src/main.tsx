import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app/app';
import { ApolloClientProvider } from './app/shared/providers/apolloClient/apolloClientProvider';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ApolloClientProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApolloClientProvider>
  </StrictMode>
);
