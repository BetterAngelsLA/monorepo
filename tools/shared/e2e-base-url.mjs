/**
 * Which URL a Playwright suite should point at, for one app.
 *
 * Every e2e project's config used to spell this out: `BASE_URL` if CI exports
 * one, else a localhost server. That worked while exactly one suite was wired
 * for a deployed preview, because the workflow could resolve that one URL and
 * export it. With several suites the workflow cannot: one `BASE_URL` cannot
 * describe a shelter-web preview and a storybook preview at once.
 *
 * So the choice moves into each config, where the app under test is known:
 *
 *   const preview = e2eBaseUrl('shelter-web');
 *   const baseURL = preview ?? LOCAL_DEV_SERVER_URL;
 *   const webServer = preview ? undefined : { … start the dev server … };
 *
 * Resolution order:
 *   1. `BASE_URL` — explicit target (a developer, or a run against something
 *      already deployed). Wins over everything.
 *   2. The app is in `PREVIEW_DEPLOYED_APPS` — this run deployed it, so test the
 *      branch preview the deploy just published, read from the app's own
 *      `apps/<app>/.env.deploy.preview` (`SITE_URL`), at
 *      `/branches/<branch>/` — the same base path the deploy bakes into the
 *      build (`tools/shared/get-base-path.mjs`).
 *   3. Otherwise `undefined`: the caller falls back to its own dev server. This
 *      is the "nothing was deployed for this branch" case — a specs-only change
 *      on a PR, or a local run — and it is deliberately a local run rather than
 *      a 404 at a branch URL that does not exist.
 *
 * `PREVIEW_DEPLOYED_APPS` is computed by the workflows from Nx
 * (`nx show projects --affected --with-target deploy`), so no project names are
 * hardcoded in CI, and the list is empty for a local run.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Find the workspace root by walking up from the working directory.
 *
 * Not `import.meta.url`: Playwright loads the config through its own TS
 * transform, which can inline this module as CommonJS, where `import.meta` is a
 * syntax error. Every Nx target runs with a project directory as cwd, so walking
 * up until `nx.json` is both cwd-agnostic and loader-agnostic.
 */
function findWorkspaceRoot(start) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(resolve(dir, 'nx.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not find the workspace root (nx.json) walking up from ${start}.`,
      );
    }
    dir = parent;
  }
}

const workspaceRoot = findWorkspaceRoot(process.cwd());

const withTrailingSlash = (url) => (url.endsWith('/') ? url : `${url}/`);

/** Apps this run deployed, from `PREVIEW_DEPLOYED_APPS` (comma separated). */
export function previewDeployedApps(env = process.env) {
  return String(env.PREVIEW_DEPLOYED_APPS ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

/** `SITE_URL` from an app's deploy env, i.e. the public origin of its preview. */
function siteUrlFor(app) {
  const file = resolve(workspaceRoot, 'apps', app, '.env.deploy.preview');
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
  return content
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('SITE_URL='))
    ?.slice('SITE_URL='.length)
    .trim();
}

/**
 * @param {string} app workspace project the suite tests (its deploy env is read)
 * @param {{ env?: Record<string, string | undefined> }} [options]
 * @returns {string | undefined} base URL, or undefined to use a local server
 */
export function e2eBaseUrl(app, options = {}) {
  const env = options.env ?? process.env;

  if (env.BASE_URL) return withTrailingSlash(env.BASE_URL);

  if (!previewDeployedApps(env).includes(app)) return undefined;

  const branch = env.BRANCH_NAME;
  if (!branch) {
    throw new Error(
      `BRANCH_NAME is required to address the "${app}" branch preview (set PREVIEW_DEPLOYED_APPS and BRANCH_NAME together).`,
    );
  }

  const siteUrl = siteUrlFor(app);
  if (!siteUrl) {
    throw new Error(
      `No SITE_URL in apps/${app}/.env.deploy.preview, so the "${app}" preview URL is unknown. Add one, or set BASE_URL explicitly.`,
    );
  }

  return `${siteUrl.replace(/\/+$/, '')}/branches/${branch.replace(/\//g, '-')}/`;
}
