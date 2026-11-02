import { LOGIN_BANNER_STORAGE_KEY } from '@monorepo/react/shelter/constants';
import type { Page } from '@playwright/test';
import { presetLocalStorage } from '../presetLocalStorage';

export async function presetLoginBannerDismissed(page: Page): Promise<void> {
  await presetLocalStorage(page, { [LOGIN_BANNER_STORAGE_KEY]: 'true' });
}
