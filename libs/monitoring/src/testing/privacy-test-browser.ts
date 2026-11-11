// Minimal browser scope for exercising the installed agent's serializers offline.
// No BrowserAgent is started and no network requests are made.
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    document: { readyState: 'complete', visibilityState: 'visible' },
    location: new URL('https://test.invalid/'),
    navigator: { userAgent: 'privacy-test' },
    performance: globalThis.performance,
    crypto: globalThis.crypto,
  },
});
