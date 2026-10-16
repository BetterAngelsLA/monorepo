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

/**
 * The API URL is asserted here rather than in `config.ts`.
 *
 * A top-level `throw` in a module that also contains a function reading `import.meta.env` is
 * mis-compiled by the current toolchain — the module's exports become invisible to importers
 * ("apiUrl is not exported by config.ts") and `vite build` fails outright. Confirmed as a
 * minimal repro on Vite 8.1.5. Asserting here runs at the same point in startup, one module
 * later.
 */
if (!apiUrl) {
  throw new Error(
    'VITE_BETTERANGELS_ADMIN_API_URL is not defined in your environment variables.',
  );
}

// `VITE_APP_BASE_PATH` is not read from the environment: `vite.config.mts` defines it as the
// output of `tools/shared/get-base-path.mjs`, which never returns `''` (it answers `/` or
// `/branches/<branch>`). The `??` fallback is therefore unreachable belt-and-braces, and `??`
// rather than `||` means a deliberately empty base path could never be silently rewritten.
const basename = import.meta.env.VITE_APP_BASE_PATH ?? '/';
// createWebFetchClient() is URL-agnostic — CSRF cookies are origin-scoped
// and the token lives on the same domain as the API.  The buildFetch factory
// signature exists for the Expo env-switching case; web ignores the apiUrl
// parameter.
const fetchClient = createWebFetchClient();
const link = new HttpLink({ uri: getGraphqlUrl(apiUrl), fetch: fetchClient });

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <ApiConfigProvider apiUrl={apiUrl} buildFetch={() => fetchClient}>
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
  </StrictMode>,
);
