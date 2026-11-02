import type { Locator, Page } from '@playwright/test';
import {
  MAP_CAMERA_TESTID,
  MAP_CANVAS,
  SEARCH_THIS_AREA_BTN_LABEL,
  SHOW_MY_LOCATION_BTN_TESTID,
  ZOOM_IN_BTN_TESTID,
  ZOOM_OUT_BTN_TESTID,
} from './constants';

export type TMapCamera = {
  zoom: number;
  center: { latitude: number; longitude: number };
};

export function getMapCanvas(page: Page): Locator {
  return page.locator(MAP_CANVAS);
}

export function getZoomInButton(page: Page): Locator {
  return page.getByTestId(ZOOM_IN_BTN_TESTID);
}

export function getZoomOutButton(page: Page): Locator {
  return page.getByTestId(ZOOM_OUT_BTN_TESTID);
}

/** Only rendered once the browser has granted the geolocation permission. */
export function getShowMyLocationButton(page: Page): Locator {
  return page.getByTestId(SHOW_MY_LOCATION_BTN_TESTID);
}

export function getSearchThisAreaButton(page: Page): Locator {
  return page.getByRole('button', { name: SEARCH_THIS_AREA_BTN_LABEL });
}

export async function readCamera(page: Page): Promise<TMapCamera> {
  const seam = page.getByTestId(MAP_CAMERA_TESTID);

  const [zoom, center] = await Promise.all([
    seam.getAttribute('data-zoom'),
    seam.getAttribute('data-center'),
  ]);

  const [latitude, longitude] = (center ?? '').split(',').map(Number);

  return { zoom: Number(zoom), center: { latitude, longitude } };
}
