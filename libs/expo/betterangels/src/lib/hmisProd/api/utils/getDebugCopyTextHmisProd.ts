import type { HmisProdRequestDebugInfo } from '../types';

/** True only for actual 2xx responses (`status` is absent on request-level failures). */
const isSuccessStatusHmisProd = (status?: number): boolean => {
  if (status === undefined) {
    return false;
  }

  return status >= 200 && status < 300;
};

/**
 * Clipboard text for the hmisProd debug "Copy" buttons
 * (`HMIS_PROD_DEMO_DEBUG_MODE`).
 *
 * 2xx responses contain client data, so their body is excluded to keep
 * sensitive data out of the app clipboard — only the request metadata is
 * copied. Failures (no response received, or a non-2xx status) keep the raw
 * body: those are the payloads we need reported, and they carry no client
 * data.
 */
export const getDebugCopyTextHmisProd = (
  debugInfo: HmisProdRequestDebugInfo | null,
): string | null => {
  if (!debugInfo) {
    return null;
  }

  if (!isSuccessStatusHmisProd(debugInfo.status)) {
    return JSON.stringify(debugInfo, null, 2);
  }

  // Allowlist (not denylist) on purpose: any future debug field is excluded
  // from success copies unless deliberately added here.
  return JSON.stringify(
    {
      url: debugInfo.url,
      status: debugInfo.status,
      hasAuthToken: debugInfo.hasAuthToken,
      authDomain: debugInfo.authDomain,
    },
    null,
    2,
  );
};
