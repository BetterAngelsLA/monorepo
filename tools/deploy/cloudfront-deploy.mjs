#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { getBranchBasePath } from '../shared/get-base-path.mjs';

// --- Validate env ---
const required = ['S3_BUCKET', 'CF_DISTRIBUTION_ID', 'ASSUME_ROLE'];
const missing = required.filter((v) => !process.env[v]);
if (missing.length) {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const { S3_BUCKET, CF_DISTRIBUTION_ID, ASSUME_ROLE } = process.env;
// Set by Nx; only a label here, so a manual --dist run works without it.
const NX_TASK_TARGET_PROJECT = process.env.NX_TASK_TARGET_PROJECT || 'web';
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

// Web builds land in dist/apps/<project> (the convention every deploy target
// follows). Prefer an explicit --dist, then that convention, then dist/<project>
// — and fail if none exist: `aws s3 sync --delete` against a missing directory
// would happily empty the bucket prefix.
const distFlag = process.env.npm_config_dist;
const candidates = [
  distFlag,
  `dist/apps/${NX_TASK_TARGET_PROJECT}`,
  `dist/${NX_TASK_TARGET_PROJECT}`,
].filter(Boolean);
const distPath = candidates.find((candidate) => existsSync(candidate));
if (!distPath) {
  console.error(
    `❌ No build output found (looked for ${candidates.join(', ')}). Run the project's export/build target first, or pass --dist.`,
  );
  process.exit(1);
}

console.log(`📦 ${NX_TASK_TARGET_PROJECT} → ${s3Dest} (from ${distPath})`);

// --- Build identity ---
/*
 * The id the app compares itself against. Bundles carry the same value inlined
 * as `EXPO_PUBLIC_BUILD_ID` (see the project's `export-web` target), so a tab
 * can tell whether the deployment has moved past it.
 *
 * A commit sha rather than a timestamp: it is stable for a rebuild of the same
 * tree, so a redeploy of unchanged code does not make every open tab prompt.
 */
const buildIdFromEnv = process.env.EXPO_PUBLIC_BUILD_ID?.trim();
const buildId = (
  buildIdFromEnv || execSync('git rev-parse --short=12 HEAD', { encoding: 'utf8' }).trim()
).trim();

/*
 * The bundle carries whatever this variable held at *export* time, so a deploy
 * that invents its own id publishes a manifest the bundle can never equal — and
 * the client would then offer a reload on every single load. For the one app
 * that reads the manifest that is fatal, so refuse rather than ship it.
 *
 * The other apps this script deploys (admin, shelter-web, storybook) have no
 * update prompt; they get a manifest because `version.json` is written for all
 * of them, and a git fallback is a reasonable label for an artifact nobody
 * compares against.
 */
const appReadsManifest = NX_TASK_TARGET_PROJECT === 'betterangels';

if (!buildIdFromEnv && appReadsManifest) {
  console.error(
    '❌ EXPO_PUBLIC_BUILD_ID is unset, but this app compares version.json against it.\n' +
      '   Building and deploying with different ids would prompt every open tab forever.\n' +
      '   Re-run the export with EXPO_PUBLIC_BUILD_ID set to the commit being deployed.',
  );
  process.exit(1);
}

if (!buildIdFromEnv) {
  console.warn(
    '⚠️  EXPO_PUBLIC_BUILD_ID is unset; version.json labels the artifact with the git sha.',
  );
}

console.log(`🏷  build id: ${buildId} (source: ${buildIdFromEnv ? 'env' : 'git'})`);
const versionManifest = `${distPath}/version.json`;

writeFileSync(
  versionManifest,
  `${JSON.stringify({ buildId, deployedAt: new Date().toISOString() }, null, 2)}\n`,
);

// --- Deploy ---
/*
 * Two passes, because the two kinds of file want opposite cache policies and
 * `aws s3 sync` takes one `--cache-control` per run.
 *
 * 1. Content-hashed assets are immutable: a given URL's bytes never change, so
 *    they can be cached for a year. This pass deliberately omits `--delete` so
 *    the *previous* build's assets stay in place. A browser that still holds old
 *    HTML then fetches its own chunks and runs old code — degraded, but working.
 *    With `--delete`, those requests 404 and the app paints nothing at all.
 *
 * 2. Everything else — `index.html`, `version.json`, metadata — is the entry
 *    point and must be revalidated on every load, or a stale shell outlives the
 *    assets it names. `--delete` is safe here: there is no per-build content to
 *    preserve at the root.
 *
 * Stale assets are pruned by age afterwards (see below) instead of by the sync.
 */
execSync(
  `aws s3 sync "${distPath}" "${s3Dest}" --no-cli-pager --cache-control "public, max-age=31536000, immutable" --exclude "*" --include "_expo/static/*" --include "assets/*"`,
  { stdio: 'inherit' },
);

execSync(
  `aws s3 sync "${distPath}" "${s3Dest}" --delete --no-cli-pager --cache-control "no-cache" --exclude "_expo/*" --exclude "assets/*"`,
  { stdio: 'inherit' },
);
console.log('✅ S3 sync complete.');

// --- Prune old assets ---
/*
 * Retention replaces `--delete`: assets older than the window below are removed
 * once no plausible cached shell can still reference them. Browsers revalidate
 * `index.html` on every load now (the `no-cache` above), so the window only has
 * to cover a tab left open across a deploy, plus headroom for a client whose
 * clock or cache behaviour is unusual.
 */
const ASSET_RETENTION_DAYS = Number(process.env.ASSET_RETENTION_DAYS ?? 30);

/*
 * Validated *before* the upload below, not when it is finally used: a bad value
 * used to throw on `new Date(NaN).toISOString()` after both syncs and before the
 * invalidation, which fails a deploy that has already shipped the revision and
 * left the edge unpurged. And a zero or negative window would make every asset
 * ever uploaded eligible for deletion.
 */
if (!Number.isInteger(ASSET_RETENTION_DAYS) || ASSET_RETENTION_DAYS < 1) {
  console.error(
    `❌ ASSET_RETENTION_DAYS must be a positive integer (got ${JSON.stringify(process.env.ASSET_RETENTION_DAYS)}).`,
  );
  process.exit(1);
}

const prefixBase = s3Path ? `${s3Path}/` : '';

/*
 * Age alone is not a safe criterion: an asset the current build still references
 * can be older than the window (a font nobody has touched), and deleting it
 * would break the app that is serving right now. So the current build's own keys
 * are excluded unconditionally, and the window only ever applies to superseded
 * assets.
 */
const currentKeys = new Set(
  readdirSync(distPath, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const relative = join(entry.parentPath ?? entry.path, entry.name);

      return relative.startsWith(distPath)
        ? relative.slice(distPath.length).replace(/^\/+/, '')
        : relative;
    }),
);

try {
  const cutoff = new Date(
    Date.now() - ASSET_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  let pruned = 0;
  const failed = [];

  for (const assetPrefix of ['_expo/static/', 'assets/']) {
    // JSON, not `--output text`: text renders a null result as the literal
    // `None`, which the old parser would happily try to delete, and a
    // whitespace split is only safe while no key contains whitespace — which
    // this script does not control.
    const listing = execSync(
      `aws s3api list-objects-v2 --bucket "${S3_BUCKET}" --prefix "${prefixBase}${assetPrefix}" --query "Contents[?LastModified<='${cutoff}'].Key" --output json --no-cli-pager`,
      { encoding: 'utf8' },
    );

    const stale = (JSON.parse(listing || '[]') ?? [])
      .filter((key) => typeof key === 'string')
      .filter((key) => !currentKeys.has(key.slice(prefixBase.length)));

    // Batched: delete-objects takes at most 1000 keys per call.
    for (let i = 0; i < stale.length; i += 1000) {
      const batch = stale.slice(i, i + 1000);
      const objects = JSON.stringify({ Objects: batch.map((Key) => ({ Key })) });

      const result = execSync(
        `aws s3api delete-objects --bucket "${S3_BUCKET}" --delete '${objects}' --query "Errors" --output json --no-cli-pager`,
        { encoding: 'utf8' },
      );

      // Per-key failures come back as a 200 with an `Errors` array, so an
      // unchecked delete reports more than it achieved.
      failed.push(...(JSON.parse(result || '[]') ?? []));
      pruned += batch.length;
    }
  }

  console.log(
    pruned
      ? `🧹 Pruned ${pruned} superseded asset(s) older than ${ASSET_RETENTION_DAYS}d.`
      : `🧹 Nothing to prune (${ASSET_RETENTION_DAYS}d window).`,
  );

  if (failed.length) {
    console.warn(`⚠️  ${failed.length} asset deletion(s) were refused by S3.`);
  }
} catch (err) {
  // Never fail a deploy on housekeeping: the new revision is already up.
  console.warn(`⚠️  Asset pruning skipped: ${err.message}`);
}

/*
 * What gets purged depends on the app, because this one script deploys four of
 * them and only this one is a single-entry SPA whose assets are all hashed.
 *
 * For the Expo app, only the mutable files are purged: content-hashed assets
 * arrive under a new name when they change, so invalidating them cannot change
 * what is served, and `/*` made every deploy wait on a purge of several
 * megabytes that were already immutable. Its unhashed files are listed too —
 * `favicon.ico` and `metadata.json` are not content-addressed and would
 * otherwise keep serving the previous build.
 *
 * The others (admin, shelter-web, storybook) carry mutable files this list does
 * not know about: `site.webmanifest`, `browserconfig.xml`, PWA icons, and
 * storybook's `iframe.html` plus `sb-manager/*`. They keep the whole-prefix
 * purge.
 */
const isSingleEntrySpa = NX_TASK_TARGET_PROJECT === 'betterangels';
const invalidationPaths = isSingleEntrySpa
  ? [
      `${cfPath}/`,
      `${cfPath}/index.html`,
      `${cfPath}/version.json`,
      `${cfPath}/favicon.ico`,
      `${cfPath}/metadata.json`,
    ]
  : [`${cfPath}/*`];
const invalidationId = execSync(
  `aws cloudfront create-invalidation --distribution-id "${CF_DISTRIBUTION_ID}" --paths ${invalidationPaths.map((p) => `"${p}"`).join(' ')} --query 'Invalidation.Id' --output text --no-cli-pager`,
  { encoding: 'utf8' },
).trim();
console.log(`✅ CloudFront invalidation sent: ${invalidationId}`);

/*
 * Wait for the edge rather than polling the deployed HTML ourselves: a deploy
 * that reports success while the previous revision is still being served would
 * make the e2e run describe someone else's code. AWS already knows when the
 * invalidation completes, and its waiter gives up on its own.
 *
 * The waiter needs `cloudfront:GetInvalidation` on the assumed deploy role, in
 * addition to `cloudfront:CreateInvalidation` for the call above.
 *
 * Only the preview configuration has a consumer for this: the e2e step reads
 * the preview right after the deploy, so a stale edge there means a run that
 * silently describes someone else's revision — fail rather than let that pass.
 * Production has no such consumer (no e2e step runs there), so an unconfirmed
 * invalidation is a warning: the upload already happened and CloudFront finishes
 * on its own, and failing would turn a successful main push red for nothing.
 * The entry-point invalidation is also the one most likely to be slow on a large
 * distribution, and re-running the job only re-confirms what AWS already did.
 */
const isProduction = process.env.NX_TASK_TARGET_CONFIGURATION === 'production';
try {
  execSync(
    `timeout 300 aws cloudfront wait invalidation-completed --distribution-id "${CF_DISTRIBUTION_ID}" --id "${invalidationId}" --no-cli-pager`,
    { stdio: 'inherit' },
  );
  console.log('✅ Edge is serving the new revision.');
} catch (err) {
  if (!isProduction) throw err;
  console.warn(
    `⚠️  Invalidation ${invalidationId} not confirmed (${err.message}); the S3 upload is complete and CloudFront will finish the invalidation on its own.`,
  );
}
