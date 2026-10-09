import { isIOSBrowser } from './isIOSBrowser';

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)';
const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
const WINDOWS_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36';

describe('isIOSBrowser', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when there is no navigator', () => {
    vi.stubGlobal('navigator', undefined);

    expect(isIOSBrowser()).toBe(false);
  });

  it('returns true for iOS browsers', () => {
    vi.stubGlobal('navigator', { userAgent: IPHONE_UA });

    expect(isIOSBrowser()).toBe(true);

    vi.stubGlobal('navigator', { userAgent: IPAD_UA });

    expect(isIOSBrowser()).toBe(true);
  });

  it('treats iPadOS desktop-mode Safari as iOS', () => {
    vi.stubGlobal('navigator', { userAgent: MAC_UA, maxTouchPoints: 5 });

    expect(isIOSBrowser()).toBe(true);
  });

  it('returns false for desktop and Android browsers', () => {
    vi.stubGlobal('navigator', { userAgent: MAC_UA, maxTouchPoints: 0 });

    expect(isIOSBrowser()).toBe(false);

    vi.stubGlobal('navigator', { userAgent: WINDOWS_UA, maxTouchPoints: 0 });

    expect(isIOSBrowser()).toBe(false);

    vi.stubGlobal('navigator', { userAgent: ANDROID_UA });

    expect(isIOSBrowser()).toBe(false);
  });

  it('returns false for a React Native navigator', () => {
    vi.stubGlobal('navigator', { product: 'ReactNative' });

    expect(isIOSBrowser()).toBe(false);
  });
});
