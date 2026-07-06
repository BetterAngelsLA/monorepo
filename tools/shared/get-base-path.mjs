import { execSync } from 'child_process';

/**
 * Computes the base path for the current context.
 *
 * - Dev server → "/"
 * - VITE_APP_BASE_PATH env (explicit override) → use as-is
 * - Production configuration → "/"
 * - CI/fallback → "/branches/{branch}"
 */
export function getBranchBasePath() {
  if (process.env.NODE_ENV === 'development') return '/';
  if (process.env.VITE_APP_BASE_PATH) return process.env.VITE_APP_BASE_PATH;
  if (process.env.NX_TASK_TARGET_CONFIGURATION === 'production') return '/';

  let branch;
  if (process.env.CI && process.env.BRANCH_NAME) {
    branch = process.env.BRANCH_NAME.replace(/\//g, '-');
  } else {
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD')
        .toString()
        .trim()
        .replace(/\//g, '-');
    } catch {
      branch = 'main';
    }
  }
  return `/branches/${branch}`;
}

/**
 * Vite plugin that injects <base href> into the HTML head.
 * Vite's `base` option rewrites asset paths but does NOT inject a <base href> tag.
 */
export function baseHrefPlugin() {
  return {
    name: 'html-base-href',
    transformIndexHtml(html) {
      const p = getBranchBasePath();
      const href = p.endsWith('/') ? p : p + '/';
      return html.replace('</head>', `  <base href="${href}" />\n  </head>`);
    },
  };
}
