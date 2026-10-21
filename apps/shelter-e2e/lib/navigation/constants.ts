/**
 * The navigation links both header variants carry, in the order they appear,
 * with where each one points.
 *
 * Shared by `inline-nav.ts` and `flyout-nav.ts` so both bands assert the same
 * set — having one import it from the other would imply a dependency between
 * the bands that doesn't exist.
 *
 * Targets restate the app's routes (`libs/react/shelter/src/lib/constants/routePaths.ts`)
 * on purpose: a test that imported them would follow a rewired route silently,
 * and the point of asserting a link is to notice that it moved.
 *
 * Two links leave the app — `about us`, and the flyout's directory PDF — so they
 * are the only destinations this suite cannot check by navigating.
 */
export type NavTarget = {
  /**
   * The link's visible text, exactly as rendered — what the user reads and says.
   *
   * Deliberately not the accessible name: the app sets `aria-label`s on these
   * links (`"navigate to shelter homepage"` over the `Home` text), so matching by
   * role name would assert the attribute rather than the label.
   */
  label: string;
} & (
  | {
      /**
       * Internal route. Asserted as a suffix, because deployed builds are served
       * from `/branches/<branch>/` (see `tools/shared/get-base-path.mjs`).
       */
      path: string;
    }
  | { /** Absolute target, outside the app. */ url: string }
);

export const NAV_LINKS: readonly NavTarget[] = [
  { label: 'Home', path: '/' },
  {
    label: 'About Us',
    url: 'https://www.betterangels.la/pillars/shelter',
  },
  { label: 'Watch Video', path: '/video' },
  { label: 'Sign In', path: '/sign-in' },
];

/** The below-`lg` flyout carries one link the inline nav doesn't. */
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

/**
 * The accessible name the app gives the header's hamburger — an icon-only
 * button, so `aria-label` is what names it.
 */
export const NAV_TOGGLE_LABEL = 'Open navigation';
