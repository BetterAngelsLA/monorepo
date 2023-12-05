import { ApolloProvider } from '@apollo/client';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import client from './apollo';

/* polyfills */
//** URL polyfill */
import 'react-native-url-polyfill/auto';

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./src/app');
  return (
    <ApolloProvider client={client}>
      <ExpoRoot context={ctx} />
    </ApolloProvider>
  );
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
