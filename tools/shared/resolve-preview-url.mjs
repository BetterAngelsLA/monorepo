#!/usr/bin/env node
/**
 * Resolve the shelter-web preview URL the e2e suite should run against.
 *
 * Prints the URL on stdout. Exit codes:
 *   0  run the suite against the printed URL
 *   78 skip — nothing was deployed here and no preview exists for this branch
 *   1  the deploy was expected but the URL is not serving this branch's build
 *
 * Shared by the PR preview workflow and the main pipeline so the "which URL,
 * and is it actually this revision" logic exists once — the job of the old
 * `tools/scripts/e2e-shelter.sh`, minus running the suite (the Playwright
 * executor does that).
 *
 * Overrides, in order:
 *   BASE_URL        explicit target (local runs)
 *   PREVIEW_ORIGIN  preview origin instead of SITE_URL from the deploy env
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const SKIP = 78;

function skip(message) {
  console.error(`⏭️  ${message}`);
  process.exit(SKIP);
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

// An explicit target wins: used locally, and it keeps the deploy probe out of
// the way when pointing the suite at a deployment someone else made.
if (process.env.BASE_URL) {
  console.log(process.env.BASE_URL);
  process.exit(0);
}

const origin =
  process.env.PREVIEW_ORIGIN ||
  readFileSync('apps/shelter-web/.env.deploy.preview', 'utf8')
    .split('\n')
    .find((line) => line.startsWith('SITE_URL='))
    ?.slice('SITE_URL='.length)
    .trim();

if (!origin) {
  fail(
    'No preview origin: set PREVIEW_ORIGIN or add SITE_URL to apps/shelter-web/.env.deploy.preview.',
  );
}

const branch = process.env.BRANCH_NAME;
if (!branch) {
  fail('BRANCH_NAME is required to locate the branch preview.');
}

const basePath = `/branches/${branch}/`;

// `shelter-web` affected means the deploy step built and deployed this
// branch's preview, so it must be serving this revision. `shelter-e2e`
// affected means only the specs changed and the preview is whatever was
// deployed last — which may be nothing. Neither means the deploy had nothing
// to do, so there is nothing to test.
const affected = execSync('yarn nx show projects --affected', {
  encoding: 'utf8',
})
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const deployedHere = affected.includes('shelter-web');
if (!deployedHere && !affected.includes('shelter-e2e')) {
  skip('Neither shelter-web nor shelter-e2e is affected — the preview is unchanged.');
}

const url = `${origin.replace(/\/+$/, '')}${basePath}`;
console.error(`▶ Probing ${url}`);

const response = await fetch(url).catch((error) => {
  if (deployedHere) fail(`${url} could not be fetched: ${error.message}`);
  skip(`No preview for this branch at ${url} — skipping e2e.`);
});

const body = await response.text();
// A missing branch path returns 403 and no <base>, so check both: the status
// alone can be a 200 error page, and the base path is what proves the HTML is
// the build for *this* branch rather than a stale one.
if (response.ok && body.includes(`base href="${basePath}"`)) {
  console.log(url);
  process.exit(0);
}

if (deployedHere) {
  fail(`${url} (HTTP ${response.status}) is not serving this branch's build.`);
}
skip(`No preview for this branch at ${url} (HTTP ${response.status}) — skipping e2e.`);
