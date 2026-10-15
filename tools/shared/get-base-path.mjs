import { execSync } from 'child_process';

/**
 * Computes the base path for the current context.
 *
 * - Dev server → "/"
 * - VITE_APP_BASE_PATH env (explicit override) → use as-is (it must start with
 *   `/`; without that, web asset URLs come out relative and the page is blank)
 * - Local (no CI) → "/" — only deployed builds are branch-scoped
 * - Production configuration → "/"
 * - CI: BRANCH_NAME env → "/branches/{branch}"
 * - Git fallback → "/branches/{branch}"
 */
export function getBranchBasePath() {
  if (process.env.NODE_ENV === 'development') return '/';
  if (process.env.VITE_APP_BASE_PATH) return process.env.VITE_APP_BASE_PATH;
  // Deployed previews live at /branches/<branch>/; local builds and the local
  // preview server serve from the root. `CI` is passed into the container by
  // docker-compose-ci.yml, so deploys keep their branch scope.
  if (!process.env.CI) return '/';
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
