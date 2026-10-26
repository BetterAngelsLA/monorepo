import type { Locator, Page } from '@playwright/test';
import {
  MAP_CAMERA_TESTID,
  MAP_CANVAS,
  SEARCH_THIS_AREA_BTN_LABEL,
  SHOW_MY_LOCATION_BTN_TESTID,
  ZOOM_IN_BTN_TESTID,
  ZOOM_OUT_BTN_TESTID,
} from './constants';

/**
 * How the suite asks the map questions: where its controls are, and where the
 * camera is. What it does to them is `interactions.ts`; what must be true of
 * them is `ui.ts`.
 *
 * The icon-only controls are addressed by test id rather than by their
 * accessible name, so that a reworded name fails a name assertion (in `ui.ts`)
 * instead of showing up here as a locator timeout. Controls with visible text —
 * "Search this area" — are addressed by that text, which *is* their contract.
 */

export type TMapCamera = {
  zoom: number;
  center: { latitude: number; longitude: number };
};

/** Google's container — also what a drag gesture has to be aimed at. */
export function mapCanvas(page: Page): Locator {
  return page.locator(MAP_CANVAS);
}

export function zoomInButton(page: Page): Locator {
  return page.getByTestId(ZOOM_IN_BTN_TESTID);
}

export function zoomOutButton(page: Page): Locator {
  return page.getByTestId(ZOOM_OUT_BTN_TESTID);
}

/** Only rendered once the browser has granted the geolocation permission. */
export function showMyLocationButton(page: Page): Locator {
  return page.getByTestId(SHOW_MY_LOCATION_BTN_TESTID);
}

export function searchThisAreaButton(page: Page): Locator {
  return page.getByRole('button', { name: SEARCH_THIS_AREA_BTN_LABEL });
}

/** The camera the app currently has the map on. */
export async function readCamera(page: Page): Promise<TMapCamera> {
  const seam = page.getByTestId(MAP_CAMERA_TESTID);

  const [zoom, center] = await Promise.all([
    seam.getAttribute('data-zoom'),
    seam.getAttribute('data-center'),
  ]);

  const [latitude, longitude] = (center ?? '').split(',').map(Number);

  return { zoom: Number(zoom), center: { latitude, longitude } };
}
