/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SESSION_STORAGE_MAP_VIEWPORT } from '../../../constants';
import { useRestoredMapViewport } from './useRestoredMapViewport';

const VIEWPORT = {
  center: { latitude: 34.1, longitude: -118.3 },
  zoom: 12,
};

beforeEach(() => {
  sessionStorage.clear();
});

describe('useRestoredMapViewport', () => {
  it('returns the saved viewport as the Map default camera', () => {
    sessionStorage.setItem(
      SESSION_STORAGE_MAP_VIEWPORT,
      JSON.stringify(VIEWPORT)
    );

    const { result } = renderHook(() => useRestoredMapViewport());

    expect(result.current.defaultCenter).toEqual(VIEWPORT.center);
    expect(result.current.defaultZoom).toBe(12);
  });

  it('does not consume the saved value (single-use happens in HomePage)', () => {
    sessionStorage.setItem(
      SESSION_STORAGE_MAP_VIEWPORT,
      JSON.stringify(VIEWPORT)
    );

    renderHook(() => useRestoredMapViewport());

    expect(sessionStorage.getItem(SESSION_STORAGE_MAP_VIEWPORT)).toBe(
      JSON.stringify(VIEWPORT)
    );
  });

  it('returns an undefined camera when nothing is saved', () => {
    const { result } = renderHook(() => useRestoredMapViewport());

    expect(result.current.defaultCenter).toBeUndefined();
    expect(result.current.defaultZoom).toBeUndefined();
  });

  it('returns an undefined camera when the stored value is malformed', () => {
    sessionStorage.setItem(SESSION_STORAGE_MAP_VIEWPORT, '{not valid json');

    const { result } = renderHook(() => useRestoredMapViewport());

    expect(result.current.defaultCenter).toBeUndefined();
    expect(result.current.defaultZoom).toBeUndefined();
  });
});
