import type { ViewportSize } from '@playwright/test';

/**
 * Viewport sizes the suite tests at, named by device class rather than by pixel
 * count so a spec reads as intent:
 *
 *   test.use({ viewport: VIEWPORTS.MOBILE });
 *
 * The Playwright projects (see playwright.config.ts) use these same values, so
 * the sizes are defined once. Specs that are size-agnostic pin nothing and
 * inherit whatever project they run in.
 *
 * Each sits on a boundary of the app's Tailwind screens (375 / 768 / 1152 /
 * 1280 / 1536) — `lg` (1152) is where the header nav collapses, which is what
 * splits the nav specs' bands.
 */
export const VIEWPORTS = {
  DESKTOP: { width: 1280, height: 720 },
  TABLET: { width: 768, height: 1024 },
  MOBILE: { width: 375, height: 812 },
} satisfies Record<string, ViewportSize>;
