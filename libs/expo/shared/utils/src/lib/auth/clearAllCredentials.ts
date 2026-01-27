import { clearAllHmisCredentials } from './hmisAuth';
import { clearAll as clearNativeCookies } from './nativeCookieJar';

export const clearAllCredentials = async (): Promise<void> => {
  await Promise.all([clearAllHmisCredentials(), clearNativeCookies()]);
};
