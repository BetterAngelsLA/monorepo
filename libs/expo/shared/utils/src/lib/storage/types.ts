export interface PersistentSynchronousStorageApi {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clearAll(): void;
  /** Every key in this scope, for account-wide deletion. */
  keys(): string[];
}
