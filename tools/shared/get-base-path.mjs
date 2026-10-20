import { execSync } from 'child_process';

/**
 * The base path the *deployed* URL uses — what the deploy tooling addresses.
 *
 * - Dev server → "/"
 * - VITE_APP_BASE_PATH env (explicit override) → use as-is (it must start with
 *   `/`; without that, web asset URLs come out relative and the page is blank)
 * - Production configuration → "/"
 * - CI: BRANCH_NAME env → "/branches/{branch}"
 * - Git fallback → "/branches/{branch}"
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
      branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
      // Detached HEAD (common in CI checkouts without BRANCH_NAME) → 'main'
      if (branch === 'HEAD') branch = 'main';
      branch = branch.replace(/\//g, '-');
    } catch {
      branch = 'main';
    }
  }
  return `/branches/${branch}`;
}

/**
 * The base path a *build* should use — what the app bakes into `base` and
 * `<base href>`.
 *
 * Local builds, and the preview server they are served by, live at the root;
 * only CI produces a branch-scoped build. Deploy and preview-comment code calls
 * `getBranchBasePath()` instead: a local `nx run <app>:deploy --configuration
 * preview` still uploads to `/branches/<branch>/`, which is not where a local
 * build would have put its assets.
 */
export function getBuildBasePath() {
  if (process.env.NODE_ENV === 'development') return '/';
  if (process.env.VITE_APP_BASE_PATH) return process.env.VITE_APP_BASE_PATH;
  if (!process.env.CI) return '/';
  return getBranchBasePath();
}

/**
 * Vite plugin that injects <base href> into the HTML head.
 * Vite's `base` option rewrites asset paths but does NOT inject a <base href> tag.
 */
export function baseHrefPlugin(basePath) {
  const href = basePath.endsWith('/') ? basePath : basePath + '/';
  return {
    name: 'html-base-href',
    transformIndexHtml(html) {
      return html.replace('</head>', `  <base href="${href}" />\n  </head>`);
    },
  };
}
