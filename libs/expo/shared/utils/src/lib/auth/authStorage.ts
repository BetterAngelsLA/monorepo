import NitroCookies from 'react-native-nitro-cookies';

/**
 * Simplified auth storage using native cookie management
 * With nitro-cookies and credentials: 'include', cookies are automatically
 * sent with requests, so we don't need manual cookie retrieval.
 */
class AuthStorage {
  /**
   * Clear all cookies from all domains
   * Used when switching environments or signing out
   */
  async clearAllCredentials(): Promise<void> {
    await NitroCookies.clearAll();
  }
}

// Singleton instance
const authStorageInstance = new AuthStorage();

export const authStorage = authStorageInstance;
