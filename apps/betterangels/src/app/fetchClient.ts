import { createExpoFetchClient } from '@monorepo/ba-platform/expo';
import { apiUrl } from '../../config';

export const fetchClient = createExpoFetchClient(apiUrl);
