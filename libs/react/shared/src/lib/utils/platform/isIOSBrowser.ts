const IOS_BROWSER_REGEX = /iPad|iPhone|iPod/i;

/**
 * Detects an iOS browser from the user agent.
 *
 * Web-only by design — it reads `navigator`, which React Native does not
 * populate with a `userAgent`, so it always returns `false` there. RN callers
 * should use `Platform.OS === 'ios'` instead.
 *
 * iPadOS 13+ reports itself as a Mac, so touch support is used to tell it apart
 * from a real Mac.
 */
export function isIOSBrowser(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;

  if (IOS_BROWSER_REGEX.test(ua)) {
    return true;
  }

  return /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
}
