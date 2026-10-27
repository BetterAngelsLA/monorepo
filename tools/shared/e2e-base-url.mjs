/**
 * The base URL a Playwright suite should test, resolved per suite.
 *
 *   const preview = e2eBaseUrl('shelter-web');
 *   const baseURL = preview ?? LOCAL_DEV_SERVER_URL;
 *   const webServer = preview ? undefined : { ...start the dev server... };
 *
 * Order: explicit `BASE_URL`; else the branch preview when `PREVIEW_DEPLOYED_APPS`
 * (computed by CI from `nx show projects --affected --with-target deploy`) lists
 * the app; else `undefined`, and the suite starts its own server.
 *
 * It must never throw: the Nx Playwright plugin imports every config to infer
 * targets, so an exception here fails the project graph, not one suite.
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

  // Never throw from here. The Nx Playwright plugin imports every
  // `playwright.config.ts` to infer its targets, so a config that throws does
  // not fail one suite — it fails the project graph, and therefore every task in
  // the job. An unresolvable URL falls back to the suite's own dev server, and
  // says so: running locally is honest, but it must not look like the preview
  // was tested.
  const branch = env.BRANCH_NAME;
  if (!branch) {
    warn(
      `"${app}" was deployed but BRANCH_NAME is unset; falling back to the local server.`,
    );
    return undefined;
  }

  const siteUrl = siteUrlFor(app);
  if (!siteUrl) {
    warn(
      `No SITE_URL in apps/${app}/.env.deploy.preview, so the "${app}" preview URL is unknown; falling back to the local server (set BASE_URL to override).`,
    );
    return undefined;
  }

  return `${siteUrl.replace(/\/+$/, '')}/branches/${branch.replace(/\//g, '-')}/`;
}

const warned = new Set();
function warn(message) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[e2e-base-url] ${message}`);
}
