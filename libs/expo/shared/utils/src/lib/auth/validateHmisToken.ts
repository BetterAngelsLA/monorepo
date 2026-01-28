import { authStorage } from './authStorage';

/**
 * Validates if the stored HMIS auth token is still valid.
 * If the token is expired or invalid, clears all credentials (app session + HMIS).
 *
 * @param hmisDomain - The HMIS domain to check the token for
 * @returns true if token is valid, false if invalid/expired
 */
export const validateHmisToken = async (
  hmisDomain: string
): Promise<boolean> => {
  const isExpired = authStorage.isHmisTokenExpired(hmisDomain);

  if (isExpired) {
    console.warn('HMIS token expired, clearing all credentials');
    await authStorage.clearAllCredentials();
    return false;
  }

  return true;
};
