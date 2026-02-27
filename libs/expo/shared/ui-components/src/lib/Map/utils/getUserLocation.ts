import {
  Accuracy,
  LocationObject,
  getCurrentPositionAsync,
  getForegroundPermissionsAsync,
  getLastKnownPositionAsync,
  requestForegroundPermissionsAsync,
} from 'expo-location';
import haversine from 'haversine-distance';

export type TGetUserLocationResponse = {
  location?: LocationObject;
  requireSettingsUpdate?: true;
};

export type TGetUserLocationOptions = {
  /** If provided, a fresh GPS fix is requested after the initial result.
   *  Called only when the fresh position differs from the initial by more
   *  than `refineThresholdMetres` (default 50). */
  onRefine?: (location: LocationObject) => void;
  /** Minimum distance in metres before `onRefine` fires. Default: 50. */
  refineThresholdMetres?: number;
};

const DEFAULT_REFINE_THRESHOLD = 50;

/**
 * Get the user's current device location.
 *
 * Returns the best available position instantly (OS-cached first, then GPS).
 * Optionally refines with a fresh GPS fix in the background via `onRefine`.
 */
export async function getUserLocation(
  options?: TGetUserLocationOptions
): Promise<TGetUserLocationResponse | null> {
  try {
    const existingPerms = await getForegroundPermissionsAsync();

    if (existingPerms.granted) {
      const location = await fetchLocation();
      scheduleRefine(location, options);
      return { location };
    }

    const newPerms = await requestForegroundPermissionsAsync();

    if (newPerms.granted) {
      const location = await fetchLocation();
      scheduleRefine(location, options);
      return { location };
    }

    // If `canAskAgain` changed, the user actively updated permission
    if (existingPerms.canAskAgain !== newPerms.canAskAgain) {
      return null;
    }

    if (!newPerms.canAskAgain) {
      return { requireSettingsUpdate: true };
    }

    return null;
  } catch (error) {
    console.warn('[getUserLocation] Error getting user location:', error);
    return null;
  }
}

/**
 * Try the instant OS-cached position first; only fire up the GPS
 * radio if there is nothing cached.
 */
async function fetchLocation(): Promise<LocationObject> {
  const lastKnown = await getLastKnownPositionAsync();
  if (lastKnown) return lastKnown;

  return await getCurrentPositionAsync({
    accuracy: Accuracy.Balanced,
  });
}

/**
 * Fire-and-forget: request a fresh GPS fix and call `onRefine` if the
 * position moved significantly.
 */
function scheduleRefine(
  initial: LocationObject,
  options?: TGetUserLocationOptions
) {
  if (!options?.onRefine) return;

  const { onRefine } = options;
  const threshold = options.refineThresholdMetres ?? DEFAULT_REFINE_THRESHOLD;

  getCurrentPositionAsync({ accuracy: Accuracy.Balanced })
    .then((fresh) => {
      if (haversine(initial.coords, fresh.coords) > threshold) {
        onRefine(fresh);
      }
    })
    .catch(() => {
      // Fresh GPS unavailable — keep the initial position
    });
}
