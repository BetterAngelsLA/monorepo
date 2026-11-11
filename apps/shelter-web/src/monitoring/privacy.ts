import { createPrivacyRules } from '@monorepo/monitoring';

/** Rules operate on values, never keys. Do not blanket-redact PageView:
 * its opaque session identifier is needed by uniqueCount(session).
 * URLs are deliberately collapsed: operator routes can contain sensitive IDs.
 */
export function browserPrivacyRules(environment: string, appVersion: string) {
  return createPrivacyRules({
    environment,
    appVersion,
    routeMode: 'collapse',
  });
}
