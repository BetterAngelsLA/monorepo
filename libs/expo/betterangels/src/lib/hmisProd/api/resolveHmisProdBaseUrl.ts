import { HMIS_PROD_BASE_URLS } from './constants';

/**
 * Which HMIS instance each BA backend authenticates against: only the prod
 * backend talks to LA Clarity; local and dev backends are configured against
 * the sandbox HMIS. Keyed by the BA API host (`useApiConfig().apiUrl`).
 *
 * TODO: replace with a backend-provided value when this graduates past the
 * test phase.
 */
const BA_API_HOST_TO_HMIS_BASE_URL: Record<string, string> = {
  'api.prod.betterangels.la': HMIS_PROD_BASE_URLS.production,
};

/**
 * Resolve the Clarity web host for the BA backend the app is currently talking
 * to. Unknown/local/dev hosts fall back to sandbox so we never accidentally
 * hit LA prod.
 */
export const resolveHmisProdBaseUrl = (baApiUrl: string): string => {
  try {
    return (
      BA_API_HOST_TO_HMIS_BASE_URL[new URL(baApiUrl).host] ??
      HMIS_PROD_BASE_URLS.sandbox
    );
  } catch {
    console.warn(
      `[resolveHmisProdBaseUrl] unresolved baApiUrl [${baApiUrl}]. Defaulting to sandbox url.`,
    );

    return HMIS_PROD_BASE_URLS.sandbox;
  }
};
