import NitroCookies from 'react-native-nitro-cookies';
import { clearAllHmisCredentials } from './hmisAuth';

export const clearAllCredentials = async (): Promise<void> => {
  await Promise.all([clearAllHmisCredentials(), NitroCookies.clearAll()]);
};
