#!/usr/bin/env node
import { execSync } from 'child_process';

import { getBranchBasePath } from '../shared/get-base-path.mjs';

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

// Nx writes every web build under dist/apps/<project>; avoid shelling out to
// `nx show project` (it can be empty when the graph fails) just to learn that.
const distPath = `dist/apps/${NX_TASK_TARGET_PROJECT}`;

console.log(`📦 ${NX_TASK_TARGET_PROJECT} → ${s3Dest}`);

// --- Deploy ---
execSync(`aws s3 sync "${distPath}" "${s3Dest}" --delete --no-cli-pager`, {
  stdio: 'inherit',
});
console.log('✅ S3 sync complete.');

/*
 * One path (the deploy prefix) rather than a walk of the files just written:
 * content-hashed assets arrive under a new name when they change, so
 * invalidating them cannot change what is served — the enumeration was an
 * optimization nobody measured, and one path is the cheapest thing CloudFront
 * processes.
 */
const invalidationId = execSync(
  `aws cloudfront create-invalidation --distribution-id "${CF_DISTRIBUTION_ID}" --paths "${cfPath}/*" --query 'Invalidation.Id' --output text --no-cli-pager`,
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
 * `/*` is also the invalidation most likely to be slow, and re-running the job
 * only re-confirms what AWS already did.
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
