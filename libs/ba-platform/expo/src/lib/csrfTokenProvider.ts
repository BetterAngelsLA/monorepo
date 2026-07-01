import CookieManager from '@preeternal/react-native-cookie-manager';
import type { TokenReader } from '@monorepo/ba-platform';

/**
 * React Native ``TokenReader`` — reads a cookie value via ``CookieManager``.
 *
 * On React Native there is no global ``document.cookie``; cookies are
 * scoped per-URL.  The returned reader queries cookies for ``baseUrl``.
 */
export const createNativeTokenReader = (baseUrl: string): TokenReader =>
  async (name: string) => {
    try {
      const cookies = await CookieManager.get(baseUrl);
      return cookies[name]?.value ?? null;
    } catch {
      return null;
    }
  };
