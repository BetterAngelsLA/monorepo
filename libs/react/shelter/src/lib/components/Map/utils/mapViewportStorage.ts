import { SESSION_STORAGE_MAP_BOUNDS } from '../../../constants';
import { TMapBounds } from '../types.maps';

/**
 * Persists the current map viewport before navigating to a shelter detail page
 * so the exact same boundaries (and search results) can be restored on return.
 */
export function saveMapBounds(bounds: TMapBounds): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_MAP_BOUNDS, JSON.stringify(bounds));
  } catch {
    // sessionStorage can be unavailable (private mode, quota exceeded).
    // Navigation proceeds without viewport restore in that case.
  }
}

/**
 * Reads and consumes the previously saved map bounds so they're applied only
 * once, immediately after returning from a shelter detail page. Returns null
 * when nothing is saved or the stored value is malformed.
 */
export function consumeSavedMapBounds(): TMapBounds | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_MAP_BOUNDS);
  if (!raw) {
    return null;
  }
  // Consume the saved bounds so they aren't re-applied on navigations that
  // don't originate from a shelter detail page.
  sessionStorage.removeItem(SESSION_STORAGE_MAP_BOUNDS);
  try {
    return JSON.parse(raw) as TMapBounds;
  } catch {
    return null;
  }
}
