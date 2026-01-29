import { Platform } from 'react-native';
import {
  backendAuthInterceptor,
  composeFetchInterceptors,
  contentTypeInterceptor,
  createCsrfInterceptor,
  createRefererInterceptor,
  ensureStorageReadyInterceptor,
  omitCredentialsInterceptor,
  storeCookiesInterceptor,
  userAgentInterceptor,
} from './interceptors';

/**
 * Creates a fetch client for React Native with composable interceptors
 *
 * Interceptor execution order:
 * - Request phase (top to bottom): Storage ready → CSRF check → headers added → credentials set
 * - Response phase (bottom to top): log failures → store cookies
 */
export const createNativeFetch = (referer: string) => {
  if (Platform.OS === 'web') {
    throw new Error('createNativeFetch is for React Native platforms only');
  }

  return composeFetchInterceptors(
    ensureStorageReadyInterceptor, // Must be first - ensures storage ready
    createCsrfInterceptor(referer), // Ensure CSRF token before request
    userAgentInterceptor, // Add User-Agent header
    createRefererInterceptor(referer), // Add Referer header
    contentTypeInterceptor, // Add Content-Type: application/json for JSON bodies
    backendAuthInterceptor, // Add auth headers (cookies, CSRF, HMIS token)
    omitCredentialsInterceptor, // Set credentials: 'omit'
    storeCookiesInterceptor // Store cookies from response
  );
};
