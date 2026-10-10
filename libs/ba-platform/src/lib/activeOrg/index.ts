export {
  clearActiveOrgId,
  configureActiveOrgStorage,
  getActiveOrgId,
  setActiveOrgId,
  subscribeActiveOrgId,
} from './activeOrgStore';
// `reconcileActiveOrgId` is deliberately NOT re-exported: its contract is
// "write during render, notify later", which only the provider that owns the
// org state can honour. Reaching it means importing `./activeOrgStore` directly.
export type { ActiveOrgPersistence } from './activeOrgStore';
