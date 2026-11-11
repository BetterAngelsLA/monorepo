import { createPrivacyRules } from '@monorepo/monitoring';

/**
 * Browser obfuscation applies to values, not individual field names.
 *
 * Route-level, not route-collapsed: New Relic keeps the URL shape so per-route
 * dashboards work, while every identifier inside the path is replaced. The app's
 * dynamic route segments are integer ids (accounts) and UUIDs (clients, notes),
 * so masking those two shapes covers every `[id]` route.
 */
export function browserPrivacyRules(environment: string, appVersion: string) {
  return createPrivacyRules({
    environment,
    appVersion,
    routeMode: 'mask-ids',
  });
}
