/** Browser obfuscation applies to values, not individual field names. */
export function browserPrivacyRules(environment: string, appVersion: string) {
  const safeValues = [environment, appVersion, 'web'].map((value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );

  return [
    { regex: /\/\d+(?=[/?#\s]|$)/g, replacement: '/[id]' },
    {
      regex:
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      replacement: '[id]',
    },
    {
      regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      replacement: '[email]',
    },
    {
      // Preserve a parseable URL and host for New Relic's interaction naming,
      // while replacing all path content with one generic route label.
      regex: /^(https?:\/\/[^/?#]+)(?:\/[^?#]*)?(?:[?#].*)?$/i,
      replacement: '$1/[route]',
      eventFilter: ['BrowserInteraction'],
    },
    {
      // Do not attempt to recognize names, notes, secrets or stack contents.
      // Preserve only exact deployment metadata values in these event types.
      regex: new RegExp(
        `^(?!(?:${safeValues.join('|')}|https?:\\/\\/[^/?#]+\\/\\[route\\])(?![\\s\\S]))[\\s\\S]+`,
      ),
      replacement: '[redacted]',
      eventFilter: ['BrowserInteraction', 'JavaScriptError'],
    },
  ];
}
