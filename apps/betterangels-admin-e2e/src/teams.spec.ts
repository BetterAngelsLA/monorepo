import { test, expect } from '@playwright/test';

test('can add a team in the default org', async ({ page }) => {
  await page.goto('/teams');

  // Should see the Teams heading
  await expect(page.locator('h1')).toContainText('Teams');

  // Click "Add Team" button
  await page.getByRole('button', { name: 'Add Team' }).click();

  // Fill in team name in the drawer
  const teamName = `E2E Test Team ${Date.now()}`;
  await page.getByLabel('Team Name').fill(teamName);

  // Click Create
  await page.getByRole('button', { name: 'Create' }).click();

  // Verify the team appears in the table or card list
  await expect(page.getByText(teamName).first()).toBeVisible();
});
