/**
 * What the map must do, as one entry point: `assertMapUi`. Everything else in
 * this folder exists to serve it.
 */
import { expect, type Page } from '@playwright/test';
import { DEFAULT_MAP_ZOOM, LA_COUNTY_CENTER } from './constants';
import { dragMap } from './interactions';
import {
  mapCanvas,
  readCamera,
  searchThisAreaButton,
  showMyLocationButton,
  zoomInButton,
  zoomOutButton,
} from './queries';

/** A point the map can be centred on, in the app's own shape. */
export type TLatLng = { latitude: number; longitude: number };

/** Coordinates at the precision the app's own constants are written in. */
function asKey({ latitude, longitude }: TLatLng): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

async function centerOf(page: Page): Promise<string> {
  const { center } = await readCamera(page);

  return asKey(center);
}

/**
 * The map's basic UI, exercised the way a user drives it: it opens on the
 * fallback centre, the zoom controls move it, and dragging reveals
 * search-this-area while using it clears that again.
 *
 * The geolocation-dependent half is `assertCurrentLocation`, which needs the
 * spec to have granted the permission.
 *
 * One entry point per flow, on purpose: every page that mounts this map (home,
 * search) should have to prove the same things about it.
 *
 * Size-agnostic: pins no viewport.
 */
export async function assertMapUi(page: Page): Promise<void> {
  // `.gm-style` is added by the maps API, so this also proves the maps key is
  // configured for the environment under test.
  await expect(mapCanvas(page)).toBeVisible({ timeout: 15_000 });

  // With no location granted, `getCurrentPosition` fails and the app falls back
  // to LA county.
  await expect.poll(() => centerOf(page)).toBe(asKey(LA_COUNTY_CENTER));

  const openingZoom = (await readCamera(page)).zoom;

  expect(openingZoom).toBe(DEFAULT_MAP_ZOOM);

  await zoomInButton(page).click();
  await expect
    .poll(async () => (await readCamera(page)).zoom)
    .toBe(openingZoom + 1);

  await zoomOutButton(page).click();
  await expect
    .poll(async () => (await readCamera(page)).zoom)
    .toBe(openingZoom);

  /*
   * Search-this-area: dragging reveals it, using it clears it. The opening
   * expectation passes for the wrong reason today — every idle reveals the
   * button, the initial one included (see the skipped spec) — and starts
   * discriminating when that gap is closed.
   */
  await expect(searchThisAreaButton(page)).toBeVisible();

  await searchThisAreaButton(page).click();
  await expect(searchThisAreaButton(page)).toBeHidden();

  await dragMap(page, { dx: -140, dy: 90 });
  await expect(searchThisAreaButton(page)).toBeVisible();
}

/**
 * The geolocation-dependent half of the map's UI.
 *
 * The spec has to grant the permission and mock the position for this to be
 * reachable at all: the control only renders once `useLocationPermission`
 * reports it. That also means the page decides its opening centre on its own,
 * which is the first thing asserted here — the fallback case belongs to
 * `assertMapUi`.
 *
 * Then the control itself: it sets the searched location and the camera follows
 * only when it isn't already there, so the map has to be moved away first for
 * the click to prove anything.
 */
export async function assertCurrentLocation(
  page: Page,
  location: TLatLng,
): Promise<void> {
  await expect(mapCanvas(page)).toBeVisible({ timeout: 15_000 });

  await expect.poll(() => centerOf(page)).toBe(asKey(location));

  await dragMap(page, { dx: -140, dy: 90 });
  await expect.poll(() => centerOf(page)).not.toBe(asKey(location));

  await showMyLocationButton(page).click();

  await expect.poll(() => centerOf(page)).toBe(asKey(location));
}
