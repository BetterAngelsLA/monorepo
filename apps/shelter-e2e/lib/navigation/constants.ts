export type NavTarget = {
  /**
   * Visible text, not the accessible name: the app's `aria-label`s override the
   * text, so a role-name lookup would assert the attribute instead.
   */
  label: string;
} & ({ path: string } | { url: string });

/**
 * Targets restate the app's routes (`constants/routePaths.ts`) rather than
 * importing them: importing would follow a rewired route silently.
 */
export const NAV_LINKS: readonly NavTarget[] = [
  { label: 'Home', path: '/' },
  {
    label: 'About Us',
    url: 'https://www.betterangels.la/pillars/shelter',
  },
  { label: 'Watch Video', path: '/video' },
  { label: 'Sign In', path: '/sign-in' },
];

export const FLYOUT_ONLY_LINKS: readonly NavTarget[] = [
  {
    label: 'Access Center Directory',
    url: 'https://www.lahsa.org/documents?id=2760-ces-access-center-directory.pdf',
  },
];

export const FLYOUT_LINKS: readonly NavTarget[] = [
  ...NAV_LINKS,
  ...FLYOUT_ONLY_LINKS,
];

/** The icon-only hamburger's accessible name. */
export const NAV_TOGGLE_LABEL = 'Open navigation';
