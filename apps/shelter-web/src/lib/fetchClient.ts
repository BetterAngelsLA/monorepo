import { composeFetchInterceptors } from '@monorepo/expo/shared/clients';
import { createCsrfInterceptor, createOrgInterceptor, CSRF_COOKIE_NAME, DEFAULT_ORG_STORAGE_KEY } from '@monorepo/ba-platform';
import { readCsrfToken, refreshCsrfToken } from '@monorepo/shared/web';
import { localStorageAdapter } from '@monorepo/react/shared';

export const fetchClient = composeFetchInterceptors(
  createOrgInterceptor(localStorageAdapter, DEFAULT_ORG_STORAGE_KEY),
  createCsrfInterceptor(readCsrfToken, refreshCsrfToken, CSRF_COOKIE_NAME),
)(window.fetch);
