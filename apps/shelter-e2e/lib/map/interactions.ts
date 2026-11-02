import type { Page } from '@playwright/test';
import { getMapCanvas } from './getters';

/**
 * A real pointer gesture: the maps API ignores synthetic events that don't come
 * from the mouse.
 */
export async function dragMap(
  page: Page,
  { dx, dy }: { dx: number; dy: number },
): Promise<void> {
  const box = await getMapCanvas(page).boundingBox();

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
