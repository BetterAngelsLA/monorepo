/**
 * Browser obfuscation applies to values, not individual field names.
 *
 * Route-level, not route-collapsed: New Relic keeps the URL shape so per-route
 * dashboards work, while every identifier inside the path is replaced. The app's
 * dynamic route segments are integer ids (accounts) and UUIDs (clients, notes),
 * so masking those two shapes covers every `[id]` route.
 */
const URL_EVENT_TYPES = [
  'BrowserInteraction',
  'JavaScriptError',
  'PageView',
  'PageAction',
  'AjaxRequest',
  'PageViewTiming',
];

export function browserPrivacyRules(environment: string, appVersion: string) {
  const safeValues = [environment, appVersion, 'web'].map((value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );

  return [
    {
      // Strip URL credentials before the generic email rule can alter them.
      regex: /^(https?:\/\/)[^/?#]*@/i,
      replacement: '$1',
    },
    {
      // Keep origin + path; drop query and fragment, which carry the values most
      // likely to be free-form (tokens, emails, pasted search text).
      regex: /^(https?:\/\/[^/?#]+)(\/[^?#]*)?(?:[?#][\s\S]*)?$/i,
      replacement: '$1$2',
      eventFilter: URL_EVENT_TYPES,
    },
    {
      // Same for the scheme-less request URLs the AJAX serializer emits.
      regex: /^([^?#\s]*\/[^?#\s]*)[?#][\s\S]*$/,
      replacement: '$1',
      eventFilter: ['PageView', 'AjaxRequest', 'PageViewTiming'],
    },
    {
      // Clients and notes use UUID primary keys.
      regex:
        /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=[/?#\s]|$)/gi,
      replacement: '/[id]',
    },
    {
      // Accounts and other tables use integer primary keys.
      regex: /\/\d+(?=[/?#\s]|$)/g,
      replacement: '/[id]',
    },
    {
      regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      replacement: '[email]',
    },
    {
      // Free-form text in these events has no route or metric value. Keep exact
      // deployment metadata and already-sanitized routes; redact everything else.
      regex: new RegExp(
        `^(?!(?:${safeValues.join('|')}|https?:\\/\\/[^\\s]+|\\/[^\\s]*)(?![\\s\\S]))[\\s\\S]+`,
      ),
      replacement: '[redacted]',
      eventFilter: ['BrowserInteraction', 'JavaScriptError', 'PageAction'],
    },
  ];
}
