/**
 * The map's contract with the suite: the stable test ids its icon-only controls
 * are addressed by, and the DOM details — Google's container class and the
 * camera seam our own `Map.tsx` renders.
 *
 * The control names the app gives those buttons (`aria-label`) are deliberately
 * not restated here: the suite addresses them by test id, and asserting the
 * names is a job for a dedicated accessibility pass rather than for the UI
 * assertions.
 */

/** Google's container class, added by the maps API once a map is live. */
export const MAP_CANVAS = '.gm-style';

/**
 * The hidden element `Map.tsx` renders with the current camera. The maps API
 * keeps zoom and centre to itself, so this is the only way to observe them.
 */
export const MAP_CAMERA_TESTID = 'map-camera';

export const ZOOM_IN_TESTID = 'map-zoom-in';
export const ZOOM_OUT_TESTID = 'map-zoom-out';
export const SHOW_MY_LOCATION_TESTID = 'map-show-my-location';

/** Has visible text, so it is addressed by that instead of a test id. */
export const SEARCH_THIS_AREA_LABEL = 'Search this area';

/**
 * Where the map centres when the browser offers no location — the app's own
 * fallback (`components/Map/constants.maps.ts`), restated so a change to it
 * shows up as a failing assertion rather than as a silently different view.
 */
export const LA_COUNTY_CENTER = {
  latitude: 34.04499,
  longitude: -118.251601,
} as const;

/** The app's opening zoom (`DEFAULT_MAP_ZOOM`). */
export const DEFAULT_MAP_ZOOM = 13;
