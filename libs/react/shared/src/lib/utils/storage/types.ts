/**
 * Storage abstraction consumed by org-link, ``ActiveOrgProvider``, and
 * any other component that needs to share persisted key-value state.
 *
 * Accepts synchronous implementations (``localStorage``) and async ones
 * (``AsyncStorage`` for React Native).
 */
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
}
