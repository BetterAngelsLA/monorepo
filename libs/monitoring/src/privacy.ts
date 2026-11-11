export type BrowserPrivacyRule = {
  regex: RegExp;
  replacement: string;
  eventFilter?: string[];
};

export type BrowserPrivacyRouteMode = 'collapse' | 'mask-ids';

const URL_EVENT_TYPES = [
  'BrowserInteraction',
  'JavaScriptError',
  'PageView',
  'PageAction',
  'AjaxRequest',
  'PageViewTiming',
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Shared browser obfuscation policy.
 *
 * `collapse` replaces the whole route with a placeholder. `mask-ids` keeps the
 * route shape but replaces UUID/integer identifiers. Both share the metadata
 * allowlist and free-text redaction so the apps cannot drift.
 */
export function createPrivacyRules({
  environment,
  appVersion,
  routeMode,
}: {
  environment: string;
  appVersion: string;
  routeMode: BrowserPrivacyRouteMode;
}): BrowserPrivacyRule[] {
  const safeValues = [environment, appVersion, 'web'].map(escapeRegExp);

  const routeRules: BrowserPrivacyRule[] =
    routeMode === 'collapse'
      ? [
          {
            regex: /^https?:\/\/[^\s]*$/i,
            replacement: 'https://redacted.invalid/[route]',
          },
          {
            regex: /^(?:\/|[^\s/?#]+\/)[\s\S]*$/,
            replacement: '/[route]',
          },
        ]
      : [
          {
            // Strip URL credentials before the generic email rule can alter them.
            regex: /^(https?:\/\/)[^/?#]*@/i,
            replacement: '$1',
          },
          {
            // Keep origin + path; drop query and fragment, which carry the values
            // most likely to be free-form (tokens, emails, pasted search text).
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
        ];

  const safeSuffix =
    routeMode === 'collapse'
      ? 'https://redacted\\.invalid/\\[route\\]|/\\[route\\]'
      : 'https?:\\/\\/[^\\s]+|\\/[^\\s]*';

  return [
    ...routeRules,
    {
      regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      replacement: '[email]',
    },
    {
      // Free-form text in these events has no route or metric value. Keep exact
      // deployment metadata, opaque session ids, and already-sanitized values.
      regex: new RegExp(
        `^(?!(?:${safeValues.join('|')}|[a-f0-9]{16}|${safeSuffix})(?![\\s\\S]))[\\s\\S]+`,
      ),
      replacement: '[redacted]',
      eventFilter: ['BrowserInteraction', 'JavaScriptError', 'PageAction'],
    },
  ];
}
