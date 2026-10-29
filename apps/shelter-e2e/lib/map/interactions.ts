import type { Page } from '@playwright/test';
import { mapCanvas } from './queries';

/**
 * What the suite does to the map, beyond a single `locator.click()` — which is
 * why only composed gestures live here. A folder with no such gesture simply
 * has no `interactions.ts`.
 */

/**
 * Drag the map by `dx`/`dy` from its centre.
 *
 * A real pointer gesture, not a synthetic event: the maps API ignores events
 * that don't come from the mouse.
 */
export async function dragMap(
  page: Page,
  { dx, dy }: { dx: number; dy: number },
): Promise<void> {
  const box = await mapCanvas(page).boundingBox();

  if (!box) {
    throw new Error('The map did not render, so it cannot be dragged.');
  }

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 12 });
  await page.mouse.up();
}
