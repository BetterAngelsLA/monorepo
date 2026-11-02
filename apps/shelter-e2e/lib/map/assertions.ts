import { expect, type Page } from '@playwright/test';
import { DEFAULT_MAP_ZOOM, LA_COUNTY_CENTER } from './constants';
import {
  getMapCanvas,
  getSearchThisAreaButton,
  getShowMyLocationButton,
  getZoomInButton,
  getZoomOutButton,
  readCamera,
} from './getters';
import { dragMap } from './interactions';

export type TLatLng = { latitude: number; longitude: number };

function asKey({ latitude, longitude }: TLatLng): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

async function centerOf(page: Page): Promise<string> {
  const { center } = await readCamera(page);

  return asKey(center);
}

/** Size-agnostic: pins no viewport. */
export async function assertMapUi(page: Page): Promise<void> {
  // `.gm-style` is added by the maps API, so this also proves the maps key is
  // configured for the environment under test.
  await expect(getMapCanvas(page)).toBeVisible({ timeout: 15_000 });

  // No location granted, so `getCurrentPosition` fails and the app falls back.
  await expect.poll(() => centerOf(page)).toBe(asKey(LA_COUNTY_CENTER));

  const openingZoom = (await readCamera(page)).zoom;

  expect(openingZoom).toBe(DEFAULT_MAP_ZOOM);

  await getZoomInButton(page).click();
  await expect
    .poll(async () => (await readCamera(page)).zoom)
    .toBe(openingZoom + 1);

  await getZoomOutButton(page).click();
  await expect
    .poll(async () => (await readCamera(page)).zoom)
    .toBe(openingZoom);

  // Every idle reveals the button today, the initial one included, so this
  // first assertion is weak until that behaviour changes.
  await expect(getSearchThisAreaButton(page)).toBeVisible();

  await getSearchThisAreaButton(page).click();
  await expect(getSearchThisAreaButton(page)).toBeHidden();

  await dragMap(page, { dx: -140, dy: 90 });
  await expect(getSearchThisAreaButton(page)).toBeVisible();
}

/**
 * Needs geolocation granted and a mocked position: the control only renders once
 * permission is reported, and the page then centres on its own.
 */
export async function assertCurrentLocation(
  page: Page,
  location: TLatLng,
): Promise<void> {
  await expect(getMapCanvas(page)).toBeVisible({ timeout: 15_000 });

  await expect.poll(() => centerOf(page)).toBe(asKey(location));

  await dragMap(page, { dx: -140, dy: 90 });
  await expect.poll(() => centerOf(page)).not.toBe(asKey(location));

  await getShowMyLocationButton(page).click();

  await expect.poll(() => centerOf(page)).toBe(asKey(location));
}
