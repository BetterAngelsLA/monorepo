import { expect, test } from '@playwright/test';

test('lists the footer links and the copyright', async ({ page }) => {
  await page.goto('./');

  const footer = page.getByRole('contentinfo');

  await expect(footer).toBeVisible();

  for (const label of [
    'navigate to Homepage',
    'navigate to About page',
    'navigate to Privacy Policy page',
  ]) {
    await expect(footer.getByRole('link', { name: label })).toBeVisible();
  }

  await expect(footer).toContainText('© 2025 Better Angels Inc.');
});
