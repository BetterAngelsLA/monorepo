import { createApolloClient } from '@monorepo/expo/shared/apollo';
import { apiUrl, demoApiUrl } from './config';

export const productionClient = createApolloClient(apiUrl);
export const demoClient = createApolloClient(demoApiUrl);
