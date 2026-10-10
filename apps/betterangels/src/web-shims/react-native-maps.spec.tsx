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
  it('derives a camera from initialRegion deltas instead of teovilla zoom 3', async () => {
    await render(
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

  it('derives a camera from a controlled region, which teovilla ignores entirely', async () => {
    await render(
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

  it('does not leak the controlled region through to teovilla', async () => {
    await render(
      <MapView
        provider="google"
        region={{ ...LA, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      />,
    );

    expect(hoisted.props).not.toHaveProperty('region');
  });

  it('leaves initialCamera untouched when the call site supplies one', async () => {
    const initialCamera = {
      center: { latitude: 1, longitude: 2 },
      zoom: 9,
      heading: 0,
      pitch: 0,
    };

    await render(<MapView provider="google" initialCamera={initialCamera} />);

    expect(hoisted.props?.initialCamera).toEqual(initialCamera);
  });

  it('ignores an AnimatedRegion, which has no numeric coordinates', async () => {
    // `region` is typed `Region | AnimatedRegion`; an AnimatedMapRegion cannot be
    // expressed as a camera, so it must not produce one full of undefined.
    await render(
      <MapView
        provider="google"
        region={{ setValue: () => undefined } as never}
      />,
    );

    expect(hoisted.props?.initialCamera).toBeUndefined();
  });

  it('falls back rather than producing a NaN zoom for a partial initialRegion', async () => {
    // Call sites build initialRegion from possibly-absent data, e.g. a client
    // with no last-seen location.
    await render(<MapView provider="google" initialRegion={LA as never} />);

    expect(hoisted.props?.initialCamera).toBeUndefined();
  });

  it('does not touch the imperative API before the map reports ready', async () => {
    // teovilla's animateToRegion reads the *global* `google.maps` to build its
    // bounds, so calling it before the Maps JS SDK has loaded throws
    // "google.maps.LatLngBounds is not a constructor". A controlled region must
    // therefore stay pending until onMapReady.
    await render(
      <MapView
        provider="google"
        region={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    expect(hoisted.animateToRegion).not.toHaveBeenCalled();
  });

  it('re-centres when the controlled region changes', async () => {
    const { rerender } = await render(
      <MapView
        provider="google"
        region={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    // Framing on mount comes from initialCamera; the imperative call only
    // becomes legal once the map is live.
    await act(async () => {
      (hoisted.props?.onMapReady as (() => void) | undefined)?.();
    });

    hoisted.animateToRegion.mockClear();

    await rerender(
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

  it('applies a region that arrived before the map was ready, once it is', async () => {
    const { rerender } = await render(
      <MapView
        provider="google"
        region={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    // A region change lands while the SDK is still loading: it must not be
    // dropped on the floor.
    await rerender(
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

    await act(async () => {
      (hoisted.props?.onMapReady as (() => void) | undefined)?.();
    });

    expect(hoisted.animateToRegion).toHaveBeenCalledTimes(1);
  });

  it('rejects non-finite or zero deltas instead of producing a broken zoom', async () => {
    // zoom is log2(360 / longitudeDelta): NaN deltas would yield zoom NaN and a
    // zero delta would yield Infinity, both of which the Maps API rejects.
    // typeof NaN === 'number', so the old numeric guard let these through.
    await render(
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

  it('forwards the caller ref to the teovilla handle', async () => {
    const ref = createRef<unknown>();

    await render(
      <MapView
        ref={ref}
        provider="google"
        initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    expect(ref.current).toEqual({ animateToRegion: hoisted.animateToRegion });
  });

  it('translates scrollEnabled into the Google draggable option', async () => {
    // teovilla drops `scrollEnabled` entirely, so without this the six static
    // mini-maps are drag-pannable on web and a drag moves the map off its pin.
    const { unmount } = await render(
      <MapView
        provider="google"
        scrollEnabled={false}
        initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    expect(hoisted.props?.options).toEqual({ draggable: false });

    await unmount();

    // The default stays draggable, so the interactive maps are unaffected.
    await render(
      <MapView
        provider="google"
        initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    expect(hoisted.props?.options).toEqual({ draggable: true });
  });

  it('forces the provider Google needs and injects the browser key', async () => {
    // The shim's two other jobs. teovilla bails out of rendering the map when
    // `provider !== 'google'` and does not export PROVIDER_GOOGLE, and it takes
    // the Maps JS key as a prop that no call site passes. Neither is visible in
    // the rendering above, so assert them directly.
    await render(
      <MapView
        initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      />,
    );

    expect(hoisted.props?.provider).toBe('google');
    expect(hoisted.props?.googleMapsApiKey).toBe('test-key');
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

  // teovilla fires this one from Google's `dragEnd`.
  const fireRegionChangeComplete = (
    region: Record<string, number>,
    details: unknown,
  ) => {
    (
      hoisted.props?.onRegionChangeComplete as unknown as (
        r: Record<string, number>,
        d: unknown,
      ) => void
    )(region, details);
  };

  it('reports a drag once, even though drag-end arrives with a settle pending', async () => {
    vi.useFakeTimers();
    const onRegionChangeComplete = vi.fn();

    try {
      await render(
        <MapView
          provider="google"
          initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
          onRegionChangeComplete={onRegionChangeComplete}
        />,
      );

      const region = { ...LA, latitudeDelta: 0.01, longitudeDelta: 0.01 };

      await act(async () => {
        // A drag: bounds arrive continuously, then drag-end.
        fireRegionChange(region, { isGesture: true });
        fireRegionChangeComplete(region, { isGesture: true });
      });

      expect(onRegionChangeComplete).toHaveBeenCalledTimes(1);

      // The drag-end report has to cancel the settle the continuous handler
      // scheduled, or the same drag is reported again ~200 ms later.
      await act(async () => {
        vi.advanceTimersByTime(250);
      });

      expect(onRegionChangeComplete).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('forwards a continuous region change verbatim', async () => {
    const onRegionChange = vi.fn();

    await render(
      <MapView
        provider="google"
        initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
        onRegionChange={onRegionChange}
      />,
    );

    const region = { ...LA, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    await act(async () => fireRegionChange(region, { isGesture: true }));

    expect(onRegionChange).toHaveBeenCalledWith(region, { isGesture: true });
  });

  it('settles a continuous region change into onRegionChangeComplete', async () => {
    vi.useFakeTimers();
    const onRegionChangeComplete = vi.fn();

    try {
      await render(
        <MapView
          provider="google"
          initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
          onRegionChangeComplete={onRegionChangeComplete}
        />,
      );

      const region = { ...LA, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      await act(async () => {
        fireRegionChange(region, { isGesture: true });
      });

      // Not yet — the move has not settled.
      expect(onRegionChangeComplete).not.toHaveBeenCalled();

      await act(async () => {
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

  it('collapses a burst of region changes into a single completion', async () => {
    vi.useFakeTimers();
    const onRegionChangeComplete = vi.fn();

    try {
      await render(
        <MapView
          provider="google"
          initialRegion={{ ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
          onRegionChangeComplete={onRegionChangeComplete}
        />,
      );

      await act(async () => {
        // A wheel-zoom burst.
        fireRegionChange(
          { ...LA, latitudeDelta: 0.03, longitudeDelta: 0.03 },
          {},
        );
        fireRegionChange(
          { ...LA, latitudeDelta: 0.02, longitudeDelta: 0.02 },
          {},
        );
        fireRegionChange(
          { ...LA, latitudeDelta: 0.01, longitudeDelta: 0.01 },
          {},
        );
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
