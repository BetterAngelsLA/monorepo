import type { ViewportSize } from '@playwright/test';

/**
 * Viewport per device class, each on an app Tailwind screen boundary (`lg`, 1152,
 * is where the header collapses). Mirrors the projects in playwright.config.ts.
 */
export const VIEWPORTS = {
  DESKTOP: { width: 1280, height: 720 },
  TABLET: { width: 768, height: 1024 },
  MOBILE: { width: 375, height: 812 },
} satisfies Record<string, ViewportSize>;
