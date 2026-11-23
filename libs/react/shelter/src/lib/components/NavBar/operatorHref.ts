import { operatorPath } from '../../constants';

/**
 * The operator route as a URL the browser can follow.
 *
 * These links are plain `<a>`s on purpose: the operator app fixes its replay
 * masking when it initialises, so the hop has to be a full page load rather
 * than a router transition. A raw `href` is resolved by the browser rather than
 * by `BrowserRouter`'s basename, so it has to carry Vite's base itself — a
 * branch deployment serves the app from `/branches/<branch>`.
 */
export const operatorHref = `${import.meta.env.BASE_URL.replace(/\/$/, '')}${operatorPath}`;
