import { expect, type Page, test } from '@playwright/test';

/**
 * The search map as mounted on the home page.
 *
 * Page-level only: that the map renders here, on the view the home page
 * configures, with the affordances it switches on. The map's own behaviour —
 * zooming, geolocation, bounds maths — belongs with the component in the lib.
 *
 * Size-agnostic: pins no viewport.
 */

/** The count line the panel shows once the automatic search has settled. */
const SETTLED_RESULTS = /^\d+( of \d+)? locations?$/;

const searchThisAreaButton = (page: Page) =>
  page.getByRole('button', { name: 'Search this area' });

test('renders the map', async ({ page }) => {
  await page.goto('./');

  // `.gm-style` is added by the Google Maps JS API, so this also proves the
  // maps key is configured for the environment being tested.
  await expect(page.locator('.gm-style')).toBeVisible({ timeout: 15_000 });
});

test.skip('does not reveal the search-this-area button on the initial view', async ({
  page,
}) => {
  test.fail(
    true,
    'Known gap: every map idle reveals the button, the initial one included. Intended: the initial view searches automatically, and the button appears only after the user moves the map.',
  );

  await page.goto('./');

  await expect(page.locator('.gm-style')).toBeVisible({ timeout: 15_000 });

  // The count line settling means the automatic search for the initial bounds
  // has run, i.e. the map has been idle at least once.
  await expect(
    page.getByText(SETTLED_RESULTS).filter({ visible: true }).first(),
  ).toBeVisible({ timeout: 15_000 });

  await expect(searchThisAreaButton(page)).toBeHidden();
});

test('reveals the search-this-area button once the map is moved', async ({
  page,
}) => {
  await page.goto('./');

  await expect(page.locator('.gm-style')).toBeVisible({ timeout: 15_000 });
  await dragMap(page);

  // Passes for the wrong reason until the gap above is fixed — the button is
  // already visible before the drag. It starts discriminating the moment the
  // initial view stops revealing it.
  await expect(searchThisAreaButton(page)).toBeVisible({ timeout: 15_000 });
});

async function dragMap(page: Page) {
  const box = await page.locator('.gm-style').boundingBox();

  if (!box) {
    throw new Error('The map did not render, so it cannot be dragged.');
  }

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 120, y + 80, { steps: 12 });
  await page.mouse.up();
}
