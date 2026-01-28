import { isHmisTokenExpired } from './hmisAuth';
import { clearAllCredentials } from './clearAllCredentials';

/**
 * Validates if the stored HMIS auth token is still valid.
 * If the token is expired or invalid, clears all credentials (app session + HMIS).
 *
 * @returns true if token is valid, false if invalid/expired
 */
export const validateHmisToken = async (): Promise<boolean> => {
  const isExpired = await isHmisTokenExpired();

  if (isExpired) {
    console.warn('HMIS token expired, clearing all credentials');
    await clearAllCredentials();
    return false;
  }

  return true;
};
