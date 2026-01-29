import { Platform } from 'react-native';
import {
  backendAuthInterceptor,
  composeFetchInterceptors,
  contentTypeInterceptor,
  createCsrfInterceptor,
  createRefererInterceptor,
  hmisInterceptor,
  includeCredentialsInterceptor,
  storeCookiesInterceptor,
  userAgentInterceptor,
} from './interceptors';

/**
 * Creates a fetch client for React Native with composable interceptors
 *
 * Interceptor execution order:
 * - Request phase (top to bottom): CSRF check → headers added → credentials set
 * - Response phase (bottom to top): extract HMIS api_url → store cookies
 */
export const createNativeFetch = (referer: string) => {
  if (Platform.OS === 'web') {
    throw new Error('createNativeFetch is for React Native platforms only');
  }

  return composeFetchInterceptors(
    createCsrfInterceptor(referer), // Ensure CSRF token before request
    userAgentInterceptor, // Add User-Agent header
    createRefererInterceptor(referer), // Add Referer header
    contentTypeInterceptor, // Add Content-Type: application/json for JSON bodies
    backendAuthInterceptor, // Add auth headers (CSRF, HMIS token)
    includeCredentialsInterceptor, // Set credentials: 'include' for cookies
    hmisInterceptor, // Extract and store HMIS api_url from responses
    storeCookiesInterceptor // Store cookies from response
  );
};
