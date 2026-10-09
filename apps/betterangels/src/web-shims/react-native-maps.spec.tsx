/**
 * Regression tests for the `react-native-maps` web shim.
 *
 * teovilla builds its Google Map with `zoom: props.initialCamera?.zoom || 3` and
 * reads only `latitude`/`longitude` from `initialRegion`, so without this shim
 * every map on web opened at zoom 3 (a continental view) regardless of the
 * deltas the call site asked for — and a controlled `region` prop was ignored
 * outright, leaving the map at 0,0.
 *
 * These tests assert the contract that fixes that: whatever region prop the call
 * site uses, teovilla receives an `initialCamera` with a zoom derived from the
 * deltas.
 */
import { createRef } from 'react';
import { act, render } from '@testing-library/react-native';

import MapView from './react-native-maps';

const hoisted = vi.hoisted(() => ({
  props: null as Record<string, unknown> | null,
  animateToRegion: vi.fn(),
}));

vi.mock('../../config', () => ({ googlePlacesApiKey: 'test-key' }));

vi.mock('@teovilla/react-native-web-maps', async () => {
  const React = await import('react');

  const MockMapView = React.forwardRef<unknown, Record<string, unknown>>(
    (props, ref) => {
      hoisted.props = props;

      // Mirrors teovilla: the handle is re-attached as the map loads, and
      // `animateToRegion` is a no-op until then.
      React.useImperativeHandle(
        ref,
        () => ({ animateToRegion: hoisted.animateToRegion }),
        [],
      );

      return null;
    },
  );

  return {
    __esModule: true,
    default: MockMapView,
    // The shim re-exports these; teovilla's published types hide them, which is
    // why the shim casts. They are not exercised here beyond being present.
    Marker: () => null,
    Polygon: () => null,
    Polyline: () => null,
    Circle: () => null,
    Callout: () => null,
    Geojson: () => null,
  };
});

const LA = { latitude: 34.05, longitude: -118.24 };

beforeEach(() => {
  hoisted.props = null;
  hoisted.animateToRegion.mockClear();
});

describe('react-native-maps web shim', () => {
  it('derives a camera from initialRegion deltas instead of teovilla zoom 3', () => {
    render(
      <MapView
        provider="google"
        initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    // log2(360 / 0.03) = 13.55 -> 14, versus teovilla's fallback of 3.
    expect(hoisted.props?.initialCamera).toEqual({
      center: { latitude: 34.05, longitude: -118.24 },
      zoom: 14,
      heading: 0,
      pitch: 0,
    });
  });

  it('derives a camera from a controlled region, which teovilla ignores entirely', () => {
    render(
      <MapView
        provider="google"
        region={{
          latitude: 40.7,
          longitude: -74.0,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      />,
    );

    // log2(360 / 0.005) = 16.14 -> 16, not teovilla's 0,0 @ zoom 3.
    expect(hoisted.props?.initialCamera).toEqual({
      center: { latitude: 40.7, longitude: -74.0 },
      zoom: 16,
      heading: 0,
      pitch: 0,
    });
  });

  it('does not leak the controlled region through to teovilla', () => {
    render(
      <MapView
        provider="google"
        region={{ ...LA, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      />,
    );

    expect(hoisted.props).not.toHaveProperty('region');
  });

  it('leaves initialCamera untouched when the call site supplies one', () => {
    const initialCamera = {
      center: { latitude: 1, longitude: 2 },
      zoom: 9,
      heading: 0,
      pitch: 0,
    };

    render(<MapView provider="google" initialCamera={initialCamera} />);

    expect(hoisted.props?.initialCamera).toEqual(initialCamera);
  });

  it('ignores an AnimatedRegion, which has no numeric coordinates', () => {
    // `region` is typed `Region | AnimatedRegion`; an AnimatedMapRegion cannot be
    // expressed as a camera, so it must not produce one full of undefined.
    render(
      <MapView
        provider="google"
        region={{ setValue: () => undefined } as never}
      />,
    );

    expect(hoisted.props?.initialCamera).toBeUndefined();
  });

  it('falls back rather than producing a NaN zoom for a partial initialRegion', () => {
    // Call sites build initialRegion from possibly-absent data, e.g. a client
    // with no last-seen location.
    render(<MapView provider="google" initialRegion={LA as never} />);

    expect(hoisted.props?.initialCamera).toBeUndefined();
  });

  it('does not touch the imperative API before the map reports ready', () => {
    // teovilla's animateToRegion reads the *global* `google.maps` to build its
    // bounds, so calling it before the Maps JS SDK has loaded throws
    // "google.maps.LatLngBounds is not a constructor". A controlled region must
    // therefore stay pending until onMapReady.
    render(
      <MapView
        provider="google"
        region={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    expect(hoisted.animateToRegion).not.toHaveBeenCalled();
  });

  it('re-centres when the controlled region changes', () => {
    const { rerender } = render(
      <MapView
        provider="google"
        region={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    // Framing on mount comes from initialCamera; the imperative call only
    // becomes legal once the map is live.
    act(() => {
      (hoisted.props?.onMapReady as (() => void) | undefined)?.();
    });

    hoisted.animateToRegion.mockClear();

    rerender(
      <MapView
        provider="google"
        region={{
          latitude: 40.7,
          longitude: -74.0,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      />,
    );

    expect(hoisted.animateToRegion).toHaveBeenCalledTimes(1);
    expect(hoisted.animateToRegion).toHaveBeenCalledWith(
      {
        latitude: 40.7,
        longitude: -74.0,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      0,
    );
  });

  it('applies a region that arrived before the map was ready, once it is', () => {
    const { rerender } = render(
      <MapView
        provider="google"
        region={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    // A region change lands while the SDK is still loading: it must not be
    // dropped on the floor.
    rerender(
      <MapView
        provider="google"
        region={{
          latitude: 40.7,
          longitude: -74.0,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      />,
    );

    expect(hoisted.animateToRegion).not.toHaveBeenCalled();

    act(() => {
      (hoisted.props?.onMapReady as (() => void) | undefined)?.();
    });

    expect(hoisted.animateToRegion).toHaveBeenCalledTimes(1);
  });

  it('rejects non-finite or zero deltas instead of producing a broken zoom', () => {
    // zoom is log2(360 / longitudeDelta): NaN deltas would yield zoom NaN and a
    // zero delta would yield Infinity, both of which the Maps API rejects.
    // typeof NaN === 'number', so the old numeric guard let these through.
    render(
      <MapView
        provider="google"
        initialRegion={{
          latitude: 34.05,
          longitude: -118.24,
          latitudeDelta: NaN,
          longitudeDelta: 0,
        }}
      />,
    );

    expect(hoisted.props?.initialCamera).toBeUndefined();
  });

  it('forwards the caller ref to the teovilla handle', () => {
    const ref = createRef<unknown>();

    render(
      <MapView
        ref={ref}
        provider="google"
        initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    expect(ref.current).toEqual({ animateToRegion: hoisted.animateToRegion });
  });

  it('translates scrollEnabled into the Google draggable option', () => {
    // teovilla drops `scrollEnabled` entirely, so without this the six static
    // mini-maps are drag-pannable on web and a drag moves the map off its pin.
    const { unmount } = render(
      <MapView
        provider="google"
        scrollEnabled={false}
        initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    expect(hoisted.props?.options).toEqual({ draggable: false });

    unmount();

    // The default stays draggable, so the interactive maps are unaffected.
    render(
      <MapView
        provider="google"
        initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    expect(hoisted.props?.options).toEqual({ draggable: true });
  });

  // teovilla binds `onBoundsChanged` → onRegionChange (continuous) but
  // `onDragEnd` → onRegionChangeComplete, and never forwards Google's `idle`. A
  // wheel/pinch zoom therefore never reached the app at all, so
  // InteractionsMap's clusters never broke apart when zooming in.
  const fireRegionChange = (
    region: Record<string, number>,
    details: unknown,
  ) => {
    (
      hoisted.props?.onRegionChange as unknown as (
        r: Record<string, number>,
        d: unknown,
      ) => void
    )(region, details);
  };

  it('forwards a continuous region change verbatim', () => {
    const onRegionChange = vi.fn();

    render(
      <MapView
        provider="google"
        initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
        onRegionChange={onRegionChange}
      />,
    );

    const region = { ...LA, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    act(() => fireRegionChange(region, { isGesture: true }));

    expect(onRegionChange).toHaveBeenCalledWith(region, { isGesture: true });
  });

  it('settles a continuous region change into onRegionChangeComplete', () => {
    vi.useFakeTimers();
    const onRegionChangeComplete = vi.fn();

    try {
      render(
        <MapView
          provider="google"
          initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
          onRegionChangeComplete={onRegionChangeComplete}
        />,
      );

      const region = { ...LA, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      act(() => {
        fireRegionChange(region, { isGesture: true });
      });

      // Not yet — the move has not settled.
      expect(onRegionChangeComplete).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(onRegionChangeComplete).toHaveBeenCalledTimes(1);
      expect(onRegionChangeComplete).toHaveBeenCalledWith(region, {
        isGesture: true,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('collapses a burst of region changes into a single completion', () => {
    vi.useFakeTimers();
    const onRegionChangeComplete = vi.fn();

    try {
      render(
        <MapView
          provider="google"
          initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
          onRegionChangeComplete={onRegionChangeComplete}
        />,
      );

      act(() => {
        // A wheel-zoom burst.
        fireRegionChange({ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }, {});
        fireRegionChange({ ...LA, latitudeDelta: 0.02, longitudeDelta: 0.02 }, {});
        fireRegionChange({ ...LA, latitudeDelta: 0.01, longitudeDelta: 0.01 }, {});
        vi.advanceTimersByTime(250);
      });

      expect(onRegionChangeComplete).toHaveBeenCalledTimes(1);
      // The last region wins, not the first.
      expect(
        (onRegionChangeComplete.mock.calls[0][0] as { longitudeDelta: number })
          .longitudeDelta,
      ).toBe(0.01);
    } finally {
      vi.useRealTimers();
    }
  });
});
