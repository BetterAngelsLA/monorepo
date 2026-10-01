import { expect, test } from '@playwright/test';

/**
 * Sign-in form behaviour — anonymous and client-side only. The form is never
 * submitted, so no login/API side effects occur.
 *
 * Runs against the local production preview server by default, or against any
 * deployed base URL via `BASE_URL` (see playwright.config.ts).
 *
 * Run just this file:
 *   yarn playwright test -c apps/shelter-e2e sign-in
 */
test.describe('sign-in', () => {
  test('renders the form with a disabled submit button', async ({ page }) => {
    await page.goto('sign-in');

    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(
      page.getByText(
        'Sign in with your Better Angels account to access privately shared shelters.',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeDisabled();
  });

  test('enables submit for a valid email; @example.com switches to password mode', async ({
    page,
  }) => {
    await page.goto('sign-in');

    const emailInput = page.getByLabel('Email Address');
    const submitButton = page.getByRole('button', { name: 'Sign In' });

    await emailInput.fill('volunteer@betterangels.la');
    await expect(submitButton).toBeEnabled();

    // `@example.com` addresses use the password flow instead of email codes.
    await emailInput.fill('volunteer@example.com');
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(submitButton).toBeDisabled();

    await page.getByLabel('Password').fill('password');
    await expect(submitButton).toBeEnabled();
  });
});
