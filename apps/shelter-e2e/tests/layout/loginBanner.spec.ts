import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

function getBanner(page: Page) {
  return page.getByTestId('login-banner');
}

function getDismissButton(page: Page) {
  return page.getByTestId('login-banner-dismiss');
}

test('shows a sign-in banner that can be dismissed and stays dismissed after a reload', async ({
  page,
}) => {
  await page.goto('./');

  await expect(getBanner(page)).toBeVisible();

  await getDismissButton(page).click();
  await expect(getBanner(page)).toHaveCount(0);

  await page.reload();
  await expect(getBanner(page)).toHaveCount(0);
});
