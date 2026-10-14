/**
 * Storage abstraction for components that persist key-value state.
 *
 * The only implementation is ``asyncStorageAdapter``, reached through
 * ``EnvironmentSwitcherProvider``'s ``storage`` prop. The synchronous half of
 * the union has no implementer since ``localStorageAdapter`` was removed —
 * the active-org store owns synchronous persistence now, through its own
 * ``ActiveOrgPersistence`` contract, because it is read during render and on
 * every request and so cannot await.
 */
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
}
