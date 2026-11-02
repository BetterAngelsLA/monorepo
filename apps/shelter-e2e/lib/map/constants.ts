/** Google's container class, added by the maps API once a map is live. */
export const MAP_CANVAS = '.gm-style';

/**
 * The hidden element `Map.tsx` renders with the current camera; the maps API
 * keeps zoom and centre to itself, so this is the only way to read them.
 */
export const MAP_CAMERA_TESTID = 'map-camera';

export const ZOOM_IN_BTN_TESTID = 'map-zoom-in';
export const ZOOM_OUT_BTN_TESTID = 'map-zoom-out';
export const SHOW_MY_LOCATION_BTN_TESTID = 'map-show-my-location';

/** Has visible text, so it is addressed by that instead of a test id. */
export const SEARCH_THIS_AREA_BTN_LABEL = 'Search this area';

/**
 * The app's fallback centre (`components/Map/constants.maps.ts`), restated so a
 * change shows up as a failing assertion.
 */
export const LA_COUNTY_CENTER = {
  latitude: 34.04499,
  longitude: -118.251601,
} as const;

export const DEFAULT_MAP_ZOOM = 13;
