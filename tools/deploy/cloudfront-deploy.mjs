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

const { root } = JSON.parse(
  execSync(
    `yarn nx show project "${NX_TASK_TARGET_PROJECT}" --json 2>/dev/null | sed -n '/^{/,$p'`,
    { encoding: 'utf8' },
  ),
);
const distPath = `dist/${root}`;

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
 *
 * Nothing waits for the invalidation to complete. Confirming it needs
 * `cloudfront:GetInvalidation`, which the deploy role does not carry (it only
 * has `cloudfront:CreateInvalidation`), so the check cannot run from here. What
 * follows — the e2e step, which installs the browser before it starts — is the
 * gap the edge gets in practice. If the role ever gains that permission,
 * `aws cloudfront wait invalidation-completed --id <id>` belongs here.
 */
const invalidationId = execSync(
  `aws cloudfront create-invalidation --distribution-id "${CF_DISTRIBUTION_ID}" --paths "${cfPath}/*" --query 'Invalidation.Id' --output text --no-cli-pager`,
  { encoding: 'utf8' },
).trim();
console.log(`✅ CloudFront invalidation sent: ${invalidationId}`);
