import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NitroCookies from 'react-native-nitro-cookies';
import {
  HMIS_API_URL_STORAGE_KEY,
  HMIS_AUTH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from '@monorepo/expo/shared/utils';

type SessionExpiredCallback = () => void;

/**
 * Function that checks a session/token expiry time.
 * Returns expiry timestamp in milliseconds, or null if no session exists.
 */
export type ExpiryChecker = (backendUrl?: string) => Promise<number | null>;

/**
 * Check Django session cookie expiry
 */
const checkDjangoSessionExpiry: ExpiryChecker = async (backendUrl) => {
  if (!backendUrl) return null;

  const cookies = await NitroCookies.get(backendUrl);
  const sessionCookie = cookies[SESSION_COOKIE_NAME];
  
  return sessionCookie?.expires ? new Date(sessionCookie.expires).getTime() : null;
};

/**
 * Check HMIS JWT token expiry
 */
const checkHmisTokenExpiry: ExpiryChecker = async () => {
  const hmisApiUrl = await AsyncStorage.getItem(HMIS_API_URL_STORAGE_KEY);
  if (!hmisApiUrl) return null;

  const cookies = await NitroCookies.get(hmisApiUrl);
  const hmisCookie = cookies[HMIS_AUTH_COOKIE_NAME];
  if (!hmisCookie?.value) return null;

  try {
    // JWT format: header.payload.signature - decode payload
    const payload = hmisCookie.value.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    // JWT exp is in seconds, convert to milliseconds
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch (error) {
    console.debug('[SessionManager] Failed to decode HMIS JWT:', error);
    return null;
  }
};

// Add new session checkers here
const expiryCheckers: ExpiryChecker[] = [
  checkDjangoSessionExpiry,
  checkHmisTokenExpiry,
];

class SessionManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private callback: SessionExpiredCallback | null = null;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener>;
  private lastExpiries: Map<number, number | null> = new Map();
  private readonly backendUrl: string;

  constructor(backendUrl: string) {
    this.backendUrl = backendUrl;
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  destroy() {
    this.clearTimeout();
    this.appStateSubscription?.remove();
  }

  setCallback(callback: SessionExpiredCallback | null) {
    this.callback = callback;
  }

  /**
   * Check session expiry and schedule timeout if changed.
   * Called on every request (NitroCookies.get() is fast and synchronous).
   */
  async checkAndSchedule(): Promise<void> {
    try {
      // Run all checkers in parallel
      const expiryResults = await Promise.all(
        expiryCheckers.map((checker, index) => 
          checker(this.backendUrl).then(expiry => ({ index, expiry }))
        )
      );

      // Track changes
      let hasChanged = false;
      for (const { index, expiry } of expiryResults) {
        if (expiry !== this.lastExpiries.get(index)) {
          hasChanged = true;
          this.lastExpiries.set(index, expiry);
        }
      }

      if (!hasChanged) return;

      this.clearTimeout();

      // Schedule timeout to earliest expiry
      const validExpiries = expiryResults
        .map(({ expiry }) => expiry)
        .filter((time): time is number => time !== null);

      if (validExpiries.length === 0) return;

      const msUntilExpiry = Math.min(...validExpiries) - Date.now();

      if (msUntilExpiry <= 0) {
        this.triggerExpiration();
      } else {
        this.timeoutId = setTimeout(() => this.triggerExpiration(), msUntilExpiry);
      }
    } catch (error) {
      console.debug('[SessionManager] Failed to check cookies:', error);
    }
  }

  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private handleAppStateChange = (state: AppStateStatus) => {
    if (state !== 'active') {
      this.clearTimeout(); // Save battery when backgrounded
    }
  };

  private triggerExpiration() {
    this.clearTimeout();
    this.callback?.();
  }

  /**
   * Force trigger expiration for testing.
   * Bypasses cookie checks and directly fires the callback.
   */
  triggerExpirationForTesting() {
    this.triggerExpiration();
  }
}

// Singleton instance managed by SessionManagerProvider
let currentSessionManager: SessionManager | null = null;

export function getSessionManager(): SessionManager | null {
  return currentSessionManager;
}

export function setSessionManager(manager: SessionManager | null): void {
  currentSessionManager = manager;
}

export { SessionManager };
