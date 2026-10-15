#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, sep } from 'path';
import { getBranchBasePath } from '../shared/get-base-path.mjs';

/** How long to give the edge before declaring the deploy not-live. */
const REVISION_TIMEOUT_MS = 5 * 60 * 1000;
const REVISION_POLL_MS = 5 * 1000;

// --- Validate env ---
const required = [
  'S3_BUCKET',
  'CF_DISTRIBUTION_ID',
  'NX_TASK_TARGET_PROJECT',
  'ASSUME_ROLE',
];
const missing = required.filter((v) => !process.env[v]);
if (missing.length) {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const { S3_BUCKET, CF_DISTRIBUTION_ID, NX_TASK_TARGET_PROJECT, ASSUME_ROLE } =
  process.env;
const BASE_PATH = getBranchBasePath();
console.log(`📌 Base path: ${BASE_PATH}`);

// --- Assume IAM role ---
console.log(`🔑 Assuming role: ${ASSUME_ROLE}...`);
try {
  const creds = execSync(
    `aws sts assume-role --role-arn "${ASSUME_ROLE}" --role-session-name "deploy-${NX_TASK_TARGET_PROJECT}" --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' --output text`,
    { encoding: 'utf8' },
  )
    .trim()
    .split('\t');
  if (creds.length < 3) throw new Error('Failed to parse STS credentials');
  process.env.AWS_ACCESS_KEY_ID = creds[0];
  process.env.AWS_SECRET_ACCESS_KEY = creds[1];
  process.env.AWS_SESSION_TOKEN = creds[2];
} catch (err) {
  console.error(`❌ Failed to assume role: ${err.message}`);
  process.exit(1);
}
console.log('✅ Assumed role.');

// --- Resolve paths ---
const s3Path = BASE_PATH.replace(/^\//, '').replace(/\/$/, '');
const cfPath = BASE_PATH.replace(/\/$/, '');
const s3Dest = `s3://${S3_BUCKET}/${s3Path}`;

const { root } = JSON.parse(
  execSync(
    `yarn nx show project "${NX_TASK_TARGET_PROJECT}" --json 2>/dev/null | sed -n '/^{/,$p'`,
    { encoding: 'utf8' },
  ),
);
const distPath = `dist/${root}`;

const invalidated = invalidationPaths();

console.log(
  `📦 ${NX_TASK_TARGET_PROJECT} → ${s3Dest} | 🚀 ${invalidated.length} paths`,
);

// --- Deploy ---
execSync(`aws s3 sync "${distPath}" "${s3Dest}" --delete --no-cli-pager`, {
  stdio: 'inherit',
});
console.log('✅ S3 sync complete.');

execSync(
  `aws cloudfront create-invalidation --distribution-id "${CF_DISTRIBUTION_ID}" --paths ${invalidated
    .map((path) => `"${path}"`)
    .join(' ')} --no-cli-pager`,
  { stdio: 'inherit' },
);
console.log('✅ CloudFront invalidation sent.');

await confirmServedRevision();

/**
 * The paths that need refreshing at the edge: the build minus `assets/`.
 *
 * Vite writes content-hashed filenames into `assets/`, so a changed file
 * arrives under a new name and an unchanged one is byte-identical —
 * invalidating those cannot change what is served, it only makes the
 * invalidation slow. Everything else (`index.html`, the icons,
 * `site.webmanifest`, …) keeps its name, so those are the mutable ones. The
 * directory entry itself covers requests that resolve to the default root
 * object.
 */
function invalidationPaths() {
  const hashedDir = 'assets/';
  const paths = [`${cfPath}/`];

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);

      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }

      const rel = relative(distPath, full).split(sep).join('/');

      if (!rel.startsWith(hashedDir)) {
        paths.push(`${cfPath}/${rel}`);
      }
    }
  };

  walk(distPath);

  return paths;
}

/**
 * The content-hashed asset URLs an HTML document references — the identity of a
 * build, since Vite renames an asset whenever its contents change.
 */
function assetRefs(html) {
  return [...new Set(html.match(/\/assets\/[\w.-]+/g) ?? [])].sort();
}

/**
 * Fail unless the edge is serving the build just uploaded.
 *
 * A deploy can report success and still leave the previous revision at the edge
 * for a while, and anything that then tests the site — the e2e suite in
 * particular — would pass or fail describing someone else's code. Sending an
 * invalidation does not wait for it to complete, so this polls the deployed HTML
 * for the asset names we built. `SITE_URL` is per site (`.env.deploy.<config>`);
 * sites without one skip the check.
 */
async function confirmServedRevision() {
  const { SITE_URL } = process.env;

  if (!SITE_URL) {
    console.log('⏭️  SITE_URL not set — skipping the deployed-revision check.');
    return;
  }

  const expected = assetRefs(
    readFileSync(join(distPath, 'index.html'), 'utf8'),
  );
  const url = `${SITE_URL.replace(/\/$/, '')}${cfPath}/index.html`;
  const deadline = Date.now() + REVISION_TIMEOUT_MS;

  let served;

  while (Date.now() < deadline) {
    try {
      served = assetRefs(await fetch(url).then((res) => res.text()));

      if (served.join() === expected.join()) {
        console.log(`✅ Serving this revision: ${expected.join(', ')}`);
        return;
      }
    } catch (err) {
      served = [`(${err.message})`];
    }

    await new Promise((resolve) => setTimeout(resolve, REVISION_POLL_MS));
  }

  console.error(
    `❌ ${url} is still not serving this revision after ${REVISION_TIMEOUT_MS / 1000}s.`,
  );
  console.error(`   expected: ${expected.join(', ') || '(none)'}`);
  console.error(`   served:   ${served?.join(', ') || '(no assets found)'}`);
  process.exit(1);
}
