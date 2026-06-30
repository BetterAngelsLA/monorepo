import {
  composeFetchInterceptors,
  userAgentInterceptor,
  bodyInterceptor,
  createRefererInterceptor,
  includeCredentialsInterceptor,
  backendAuthInterceptor,
  interceptorHmis,
  createCsrfInterceptor as createNativeCsrfInterceptor,
} from '@monorepo/expo/shared/clients';
import { createOrgInterceptor, DEFAULT_ORG_STORAGE_KEY } from '@monorepo/ba-platform';
import { asyncStorageAdapter } from '@monorepo/expo/shared/utils';

export const fetchClient = composeFetchInterceptors(
  createOrgInterceptor(asyncStorageAdapter, DEFAULT_ORG_STORAGE_KEY),
  createNativeCsrfInterceptor(''),
  userAgentInterceptor,
  createRefererInterceptor(''),
  bodyInterceptor,
  backendAuthInterceptor,
  includeCredentialsInterceptor,
  interceptorHmis,
)(fetch);
