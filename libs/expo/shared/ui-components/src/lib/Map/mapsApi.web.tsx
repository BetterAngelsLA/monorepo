/**
 * Web half of the maps seam, which Metro substitutes for `mapsApi.tsx` on the
 * `web` platform. Backed by `@teovilla/react-native-web-maps`, which maps the
 * `react-native-maps` API onto the Google Maps JavaScript API.
 *
 * Four of teovilla's gaps are closed here, and all four fail *silently* — the map
 * still renders, just wrong or not at all: it exports no `PROVIDER_GOOGLE` /
 * `PROVIDER_DEFAULT`, so the prop every call site passes arrives `undefined` and
 * the map is skipped; it takes the Maps JavaScript API key as a *prop* where the
 * native SDKs read theirs from the app.config.js plugins, so no call site has
 * one; it ignores region *deltas* (`zoom: props.initialCamera?.zoom || 3` opened
 * every map at a continental view); and it never reads a controlled `region`, so
 * those call sites fell back to `initialRegion ?? {lat: 0, lng: 0}` — a world map
 * at 0,0.
 *
 * The last two are closed by converting deltas into Google's zoom and handing
 * teovilla an `initialCamera`. Call sites are typechecked against `mapsApi.tsx`,
 * whose types are the real package's.
 */
import * as TeovillaModule from '@teovilla/react-native-web-maps';
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type MutableRefObject,
} from 'react';
import type { Camera, MapViewProps, Region } from 'react-native-maps';
import type { TWebMapsConfig } from './types';
import { regionToZoom } from './utils/regionToZoom';

/**
 * Installed once by the app (`src/init.ts`), the way `configurePlacesProxy`
 * installs the Places proxy: teovilla wants the Maps JavaScript API key as a
 * prop, and no call site has one.
 */
let webMapsApiKey: string | undefined;

export function configureWebMaps({ apiKey }: TWebMapsConfig): void {
  webMapsApiKey = apiKey;
}

// Same values react-native-maps uses, so call sites behave identically on both
// platforms.
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = undefined;

type TTeovillaMapViewProps = MapViewProps & {
  googleMapsApiKey?: string;
  /**
   * teovilla escape hatch, not part of the `react-native-maps` API: spread last
   * into the Google map's own options. Nothing passes it today — the shim uses
   * it to translate `scrollEnabled` into `draggable`, which teovilla otherwise
   * drops.
   */
  options?: Record<string, unknown>;
};

/**
 * teovilla's published types are incomplete: `dist/typescript/index.d.ts` only
 * re-exports `./components/marker-clusterer`, so TypeScript cannot see what its
 * runtime provides. Cast once, here, rather than sprinkling `any` through every
 * call site; the wrapper's own props stay typed against `react-native-maps`.
 */
type TTeovillaRuntime = {
  default: ComponentType<TTeovillaMapViewProps & { ref?: unknown }>;
  Marker: ComponentType<Record<string, unknown>>;
};

const Teovilla = TeovillaModule as unknown as TTeovillaRuntime;
const TeovillaMapView = Teovilla.default;

/**
 * The imperative surface this shim needs. teovilla's handle is exactly
 * `react-native-maps`' MapView API, but its published types do not describe it
 * (see the cast note above), so only the one method used here is declared.
 */
type TImperativeMap = {
  animateToRegion?: (region: Region, duration?: number) => void;
};

/**
 * Google Maps takes a zoom *level*; react-native-maps takes a lat/lng *span*.
 * `regionToZoom` is the conversion `useClusters` already applies, so the framing
 * and the clustering agree on what a zoom means. The result is a fixed scale
 * (zoom z is 360/2^z degrees across a 256px tile), which is what we want here:
 * it reproduces the mobile framing regardless of how wide the browser is.
 * Native instead fits the deltas to the view, so on a very wide viewport native
 * shows the same span across more pixels at a higher zoom. Matching mobile's
 * framing is the point of this shim.
 */
function regionToCamera(region: Region): Camera {
  return {
    center: { latitude: region.latitude, longitude: region.longitude },
    zoom: regionToZoom(region),
    // Required by the Camera type; teovilla only reads center and zoom.
    heading: 0,
    pitch: 0,
  };
}

/**
 * `region` is typed `Region | AnimatedRegion`. An `AnimatedMapRegion` is a
 * native-only Animated driver with no numeric coordinates, so it can never be
 * expressed as a camera — such call sites keep teovilla's default framing
 * rather than being handed a camera full of `undefined`.
 *
 * Deliberately stricter than a `typeof === 'number'` check: `typeof NaN` is
 * `'number'`, and `zoom` is `log2(360 / longitudeDelta)`, so a NaN delta would
 * become `zoom: NaN` and a zero delta `zoom: Infinity` — both rejected by the
 * Maps API. A non-finite or non-positive delta means "no usable region", which
 * is the same outcome as a missing one.
 */
function isPlainRegion(value: unknown): value is Region {
  const region = value as Region | undefined;

  return (
    !!region &&
    Number.isFinite(region.latitude) &&
    Number.isFinite(region.longitude) &&
    Number.isFinite(region.latitudeDelta) &&
    Number.isFinite(region.longitudeDelta) &&
    region.longitudeDelta > 0
  );
}

/**
 * Forwards to the latest render's prop without ever changing identity.
 *
 * teovilla memoizes its map element on the *identity* of these callbacks
 * (map-view.js:280), and call sites routinely pass inline arrows — e.g.
 * `onMapReady={() => updateClustersForRegion(mapRegion)}`. A new identity on
 * every render makes teovilla rebuild the element, which re-applies the
 * `center`/`zoom` props onto the live map.
 */
function useStableForwarder(
  propsRef: MutableRefObject<TTeovillaMapViewProps>,
  name: keyof MapViewProps,
) {
  return useCallback(
    (...args: unknown[]) => {
      const handler = propsRef.current[name];

      if (typeof handler === 'function') {
        (handler as (...a: unknown[]) => void)(...args);
      }
    },
    [propsRef, name],
  );
}

/** Region equality on the four values teovilla reports back. */
function sameRegion(a: Region, b: Region): boolean {
  return (
    a.latitude === b.latitude &&
    a.longitude === b.longitude &&
    a.latitudeDelta === b.latitudeDelta &&
    a.longitudeDelta === b.longitudeDelta
  );
}

/**
 * How long the map must stop reporting new bounds before the shim treats the
 * move as finished and calls `onRegionChangeComplete`. Short enough to feel
 * immediate, long enough to collapse a wheel-zoom burst into one call.
 * See `handleRegionChange`.
 */
const REGION_SETTLE_MS = 200;

const MapView = forwardRef<unknown, TTeovillaMapViewProps>((props, ref) => {
  // `region` is deliberately not forwarded to teovilla (it ignores it); the
  // callback props stay in `rest` and are overridden by the stable forwarders
  // set after the spread below.
  const {
    initialRegion,
    initialCamera,
    region,
    scrollEnabled,
    options,
    zoomTapEnabled,
    ...rest
  } = props;

  const innerRef = useRef<TImperativeMap | null>(null);

  // Keep the caller-facing ref working while retaining our own handle on the
  // map. teovilla re-attaches its handle whenever `map` changes
  // (`useImperativeHandle(..., [map])`), so this ref is refreshed once the map
  // has actually loaded — no stale-closure problem.
  const setRef = useCallback(
    (node: unknown) => {
      innerRef.current = (node as TImperativeMap) ?? null;

      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as MutableRefObject<unknown>).current = node;
      }
    },
    [ref],
  );

  const controlledRegion = isPlainRegion(region) ? region : undefined;

  // `scrollEnabled` is a real react-native-maps prop that teovilla drops
  // entirely, so its six `scrollEnabled={false}` call sites (note mini-maps,
  // last-seen, default location) were drag-pannable on web — a drag moved the
  // map away from its own pin. teovilla spreads `props.options` last into the
  // Google map's options, so that is where `draggable` has to go.
  //
  // The same spread is how the next two are set:
  //
  //  - **Double-click zoom.** teovilla maps `zoomTapEnabled` to
  //    `disableDoubleClickZoom: !zoomTapEnabled`, and react-native-maps
  //    documents that prop as `@default true`. No call site passes it, so
  //    `!undefined` turned double-click zoom OFF on web. Restore the documented
  //    default; `zoomTapEnabled={false}` still disables it.
  //  - **Google's desktop chrome.** teovilla leaves `streetViewControl` and
  //    `fullscreenControl` at Google's defaults, and both land in the
  //    bottom-right corner that `MapLocateMeBtn` occupies (absolute, right 16 /
  //    bottom 15%) — measured overlapping it. A phone-shaped port has no use for
  //    a street-view pegman or a fullscreen button, so the corner is ours. The
  //    map-type toggle is top-left and stays.
  //
  // Memoised on the values, not the object: a fresh `options` identity on every
  // render would bust teovilla's map memo and undo the stability above.
  const resolvedOptions = useMemo(
    () => ({
      ...options,
      draggable: scrollEnabled !== false,
      disableDoubleClickZoom: !(zoomTapEnabled ?? true),
      streetViewControl: false,
      fullscreenControl: false,
    }),
    [options, scrollEnabled, zoomTapEnabled],
  );

  // Whichever prop the call site used, teovilla needs it as a camera.
  const resolvedInitialCamera = useMemo(() => {
    if (initialCamera) {
      return initialCamera;
    }

    // Guarded rather than trusted: call sites build `initialRegion` from
    // possibly-absent data (e.g. a client with no last-seen location), and an
    // undefined delta would become `zoom: NaN` instead of falling back.
    const sourceRegion = isPlainRegion(initialRegion)
      ? initialRegion
      : controlledRegion;

    return sourceRegion ? regionToCamera(sourceRegion) : undefined;
  }, [initialCamera, initialRegion, controlledRegion]);

  // --- Latched "initial" props ---------------------------------------------
  //
  // teovilla re-applies these to the live map whenever they change: they are
  // dependencies of its `mapNode` memo (map-view.js:280), and the element it
  // builds hands `center`/`zoom` straight to @react-google-maps/api.
  //
  // Call sites drive `initialRegion` from state that `onRegionChangeComplete`
  // itself updates (see InteractionsMap), so an unlatched value is a feedback
  // loop: drag -> setState -> new deltas -> new zoom -> drag. In a real browser
  // that produced a continuous stream of `setCenter` calls during a single drag
  // while the zoom jumped in and out.
  //
  // `initial*` is initial-only on native as well — react-native-maps does not
  // move the map when `initialRegion` changes — so latching restores parity
  // instead of diverging from it. It latches only once a value exists, so call
  // sites whose data arrives asynchronously are still framed correctly.
  //
  // State rather than a ref: this value is read during render, and reading a ref
  // during render is unsound under concurrent rendering (a discarded render
  // could still mutate it). It is written at most once, so the single extra
  // render when latched data arrives is the intended initial framing.
  const [latchedCamera, setLatchedCamera] = useState<Camera | undefined>(
    () => resolvedInitialCamera,
  );
  const [latchedRegion, setLatchedRegion] = useState<Region | undefined>(() =>
    isPlainRegion(initialRegion) ? initialRegion : undefined,
  );

  useEffect(() => {
    if (latchedCamera === undefined && resolvedInitialCamera !== undefined) {
      setLatchedCamera(resolvedInitialCamera);
    }
  }, [latchedCamera, resolvedInitialCamera]);

  useEffect(() => {
    if (latchedRegion === undefined && isPlainRegion(initialRegion)) {
      setLatchedRegion(initialRegion);
    }
  }, [latchedRegion, initialRegion]);

  // --- Stable callbacks ----------------------------------------------------
  // Inline arrows at call sites would otherwise change identity every render
  // and bust teovilla's memo (see useStableForwarder).
  const latestProps = useRef(props);

  useEffect(() => {
    latestProps.current = props;
  });

  const lastMapRegion = useRef<Region | null>(null);

  // Whether teovilla has handed us a live Google map (its `onMapReady`, fired
  // from the Maps JS `onLoad`). The imperative API must not be used before
  // then: teovilla's `animateToRegion` reads the *global* `google.maps` (not the
  // map instance) to build its bounds, so calling it before the SDK has loaded
  // throws `google.maps.LatLngBounds is not a constructor`. A controlled
  // `region` therefore has to wait for readiness.
  const [isMapReady, setIsMapReady] = useState(false);

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
    latestProps.current.onMapReady?.();
  }, []);

  const handlePanDrag = useStableForwarder(latestProps, 'onPanDrag');
  const handlePress = useStableForwarder(latestProps, 'onPress');
  const handleDoublePress = useStableForwarder(latestProps, 'onDoublePress');

  const regionSettleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRegionRef = useRef<{ region: Region; details: unknown } | null>(
    null,
  );

  const reportRegion = useCallback((nextRegion: Region, details: unknown) => {
    // A real `onRegionChangeComplete` supersedes the settle timer the continuous
    // handler scheduled: teovilla fires this one from Google's `dragEnd` and the
    // settler from the last `bounds_changed` of the same drag, so without this
    // the caller's handler runs twice per drag. Native fires it once.
    if (regionSettleRef.current !== null) {
      clearTimeout(regionSettleRef.current);
      regionSettleRef.current = null;
    }

    pendingRegionRef.current = null;

    // Remember what the map reported, so the effect below can tell a user
    // gesture apart from a programmatic move.
    lastMapRegion.current = nextRegion;

    const handler = latestProps.current.onRegionChangeComplete;

    if (typeof handler === 'function') {
      (handler as (region: Region, details: unknown) => void)(
        nextRegion,
        details,
      );
    }
  }, []);

  // teovilla binds `onBoundsChanged` → props.onRegionChange (continuous) but
  // `onDragEnd` → props.onRegionChangeComplete, and never forwards Google's
  // `idle`. So a wheel/pinch zoom — or any programmatic move — never reached
  // `onRegionChangeComplete` at all, which is why InteractionsMap's clusters
  // never broke apart when zooming in.
  //
  // `idle` is the honest equivalent and teovilla does not expose it, so settle on
  // the last continuous region after a short pause. That preserves the callers'
  // "the map has finished moving" contract while making zoom changes visible, and
  // a caller that passes `onRegionChange` still receives it verbatim.
  const handleRegionChange = useCallback(
    (nextRegion: Region, details: unknown) => {
      const direct = latestProps.current.onRegionChange;

      if (typeof direct === 'function') {
        (direct as (region: Region, details: unknown) => void)(
          nextRegion,
          details,
        );
      }

      pendingRegionRef.current = { region: nextRegion, details };

      if (regionSettleRef.current !== null) {
        clearTimeout(regionSettleRef.current);
      }

      regionSettleRef.current = setTimeout(() => {
        regionSettleRef.current = null;
        const pending = pendingRegionRef.current;
        pendingRegionRef.current = null;

        if (pending) reportRegion(pending.region, pending.details);
      }, REGION_SETTLE_MS);
    },
    [reportRegion],
  );

  useEffect(
    () => () => {
      if (regionSettleRef.current !== null) {
        clearTimeout(regionSettleRef.current);
        regionSettleRef.current = null;
      }
    },
    [],
  );

  const handleRegionChangeComplete = reportRegion;

  // Gap 4: a *controlled* `region` still has to move the map when it changes.
  // `initialCamera` only covers the first frame, and teovilla re-reads the live
  // map centre on every later render, so props cannot drive this — it has to go
  // through the imperative API.
  //
  // Depends on the region's *values*, never the object: call sites build the
  // region literal inline, so keying on identity would re-centre the map on
  // every render and fight the user.
  const { latitude, longitude, latitudeDelta, longitudeDelta } =
    controlledRegion ?? {};

  useEffect(() => {
    if (
      !isMapReady ||
      latitude === undefined ||
      longitude === undefined ||
      latitudeDelta === undefined ||
      longitudeDelta === undefined
    ) {
      return;
    }

    const next: Region = { latitude, longitude, latitudeDelta, longitudeDelta };
    const reported = lastMapRegion.current;

    // The gesture echo: `onRegionChangeComplete` feeds these very numbers back
    // in as the controlled `region`. Animating to them would fight the user.
    if (reported && sameRegion(reported, next)) {
      return;
    }

    innerRef.current?.animateToRegion?.(next, 0);
  }, [isMapReady, latitude, longitude, latitudeDelta, longitudeDelta]);

  return (
    <TeovillaMapView
      {...rest}
      ref={setRef}
      initialRegion={latchedRegion}
      initialCamera={latchedCamera}
      options={resolvedOptions}
      // Forced after the spread: teovilla only supports Google, and a call site
      // passing an undefined provider would otherwise blank the map.
      provider={PROVIDER_GOOGLE}
      googleMapsApiKey={props.googleMapsApiKey ?? webMapsApiKey}
      onMapReady={handleMapReady}
      onRegionChange={handleRegionChange}
      onRegionChangeComplete={handleRegionChangeComplete}
      onPanDrag={handlePanDrag}
      onPress={handlePress}
      onDoublePress={handleDoublePress}
    />
  );
});

MapView.displayName = 'MapView';

export const Marker = Teovilla.Marker;

export default MapView;
