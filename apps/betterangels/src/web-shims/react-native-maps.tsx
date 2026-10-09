/**
 * Web shim for `react-native-maps`, wired in through `metro.config.js`.
 *
 * Backed by `@teovilla/react-native-web-maps`, which maps the `react-native-maps`
 * API onto the Google Maps JavaScript API. Four gaps have to be closed here, and
 * all four fail *silently* (the map still renders, just wrong or not at all):
 *
 * 1. teovilla does not export `PROVIDER_GOOGLE` / `PROVIDER_DEFAULT`. Every call
 *    site in this app passes `provider={PROVIDER_GOOGLE}`, so without these the
 *    prop arrives as `undefined` and teovilla bails out of rendering the map.
 * 2. teovilla requires the Maps JavaScript API key as a *prop*, whereas the
 *    native SDKs read theirs from the app.config.js plugins — so no call site
 *    passes one. The resolved browser key is injected here instead of threading
 *    a prop through every map usage.
 * 3. teovilla ignores region *deltas*. It builds its Google Map with
 *    `zoom: props.initialCamera?.zoom || 3` and reads only `latitude`/
 *    `longitude` out of `initialRegion`, so every map opened at zoom 3 — a
 *    continental view, versus the neighbourhood the same prop shows on native.
 * 4. teovilla does not read a controlled `region` prop *at all* (there is no
 *    `props.region` access anywhere in map-view.js). Call sites that pass
 *    `region` therefore fell back to `initialRegion ?? {lat: 0, lng: 0}` —
 *    rendering a world map centred on 0,0.
 *
 * Gaps 3 and 4 are closed by converting the deltas into the zoom Google Maps
 * wants and handing teovilla an `initialCamera`. Both are silent failures — the
 * map still renders, just somewhere else entirely.
 *
 * Types at call sites still come from the real `react-native-maps` (tsconfig
 * paths are not affected by this Metro-only substitution).
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
  type ReactNode,
} from 'react';
import type { Camera, MapViewProps, Region } from 'react-native-maps';

import { googlePlacesApiKey } from '../../config';

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
 * re-exports `./components/marker-clusterer`, so TypeScript cannot see the
 * exports its runtime actually provides (`dist/commonjs/index.web.js` exports
 * default/MapView plus Marker, Polygon, Polyline, Circle, Callout, Geojson).
 *
 * Cast once, here, rather than sprinkling `any` through every call site. The
 * wrapper's own props stay typed against the real `react-native-maps` API.
 */
type TTeovillaRuntime = {
  default: ComponentType<TTeovillaMapViewProps & { ref?: unknown }>;
  Marker: ComponentType<Record<string, unknown>>;
  Polygon: ComponentType<Record<string, unknown>>;
  Polyline: ComponentType<Record<string, unknown>>;
  Circle: ComponentType<Record<string, unknown>>;
  Callout: ComponentType<{ children?: ReactNode }>;
  Geojson: ComponentType<Record<string, unknown>>;
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
 * Same conversion the app already uses to reason about zoom in
 * `Map/utils/regionToZoom.ts` — duplicated rather than imported because this
 * module *is* the `react-native-maps` substitution, and importing from
 * ui-components would close a resolution cycle back through this file.
 *
 * The result is a fixed scale (zoom z is 360/2^z degrees across a 256px tile),
 * which is what we want here: it reproduces the mobile framing regardless of
 * how wide the browser is. Native instead fits the deltas to the view, so on a
 * very wide viewport native shows the same span across more pixels at a higher
 * zoom. Matching mobile's framing is the point of this shim.
 */
function regionToCamera(region: Region): Camera {
  return {
    center: { latitude: region.latitude, longitude: region.longitude },
    zoom: Math.round(Math.log2(360 / region.longitudeDelta)),
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
  // Memoised on the value, not the object: a fresh `options` identity on every
  // render would bust teovilla's map memo and undo the stability above.
  const resolvedOptions = useMemo(
    () => ({ ...options, draggable: scrollEnabled !== false }),
    [options, scrollEnabled],
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

  const reportRegion = useCallback((nextRegion: Region, details: unknown) => {
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
  const regionSettleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRegionRef = useRef<{ region: Region; details: unknown } | null>(
    null,
  );

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
  }, [
    isMapReady,
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  ]);

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
      googleMapsApiKey={props.googleMapsApiKey ?? googlePlacesApiKey}
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
export const Polygon = Teovilla.Polygon;
export const Polyline = Teovilla.Polyline;
export const Circle = Teovilla.Circle;
export const Callout = Teovilla.Callout;
export const Geojson = Teovilla.Geojson;

export default MapView;
