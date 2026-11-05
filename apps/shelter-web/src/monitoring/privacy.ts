/** Rules operate on values, never keys. Do not blanket-redact PageView:
 * its opaque session identifier is needed by uniqueCount(session).
 * URLs are deliberately collapsed: operator routes can contain sensitive IDs.
 */
export function browserPrivacyRules(environment: string, appVersion: string) {
  const safeValues = [environment, appVersion, 'web'].map((value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  return [
    {
      regex: /^https?:\/\/[^\s]*$/i,
      replacement: 'https://redacted.invalid/[route]',
    },
    {
      regex: /^(?:\/|[^\s/?#]+\/)[\s\S]*$/,
      replacement: '/[route]',
    },
    {
      regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      replacement: '[email]',
    },
    {
      // The agent uses 16 hex characters for anonymous session identifiers.
      // Preserve those across event types, plus exact deployment metadata.
      regex: new RegExp(
        `^(?!(?:${safeValues.join('|')}|[a-f0-9]{16}|https://redacted\\.invalid/\\[route\\]|/\\[route\\])(?![\\s\\S]))[\\s\\S]+`,
      ),
      replacement: '[redacted]',
      eventFilter: ['BrowserInteraction', 'JavaScriptError', 'PageAction'],
    },
  ];
}
