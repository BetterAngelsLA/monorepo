#!/usr/bin/env node
import { execSync } from 'child_process';
import { getBranchBasePath } from '../shared/get-base-path.mjs';

// --- Validate env ---
const required = ['S3_BUCKET', 'CF_DISTRIBUTION_ID', 'NX_TASK_TARGET_PROJECT', 'ASSUME_ROLE'];
const missing = required.filter((v) => !process.env[v]);
if (missing.length) {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const { S3_BUCKET, CF_DISTRIBUTION_ID, NX_TASK_TARGET_PROJECT, ASSUME_ROLE } = process.env;
const BASE_PATH = getBranchBasePath();
console.log(`📌 Base path: ${BASE_PATH}`);

// --- Assume IAM role ---
console.log(`🔑 Assuming role: ${ASSUME_ROLE}...`);
try {
  const creds = execSync(
    `aws sts assume-role --role-arn "${ASSUME_ROLE}" --role-session-name "deploy-${NX_TASK_TARGET_PROJECT}" --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' --output text`,
    { encoding: 'utf8' }
  ).trim().split('\t');
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
  execSync(`yarn nx show project "${NX_TASK_TARGET_PROJECT}" --json`, { encoding: 'utf8' })
);
const distPath = `dist/${root}`;

console.log(`📦 ${NX_TASK_TARGET_PROJECT} → ${s3Dest} | 🚀 ${cfPath}/*`);

// --- Deploy ---
execSync(`aws s3 sync "${distPath}" "${s3Dest}" --delete --no-cli-pager`, { stdio: 'inherit' });
console.log('✅ S3 sync complete.');

execSync(
  `aws cloudfront create-invalidation --distribution-id "${CF_DISTRIBUTION_ID}" --paths "${cfPath}/*" --no-cli-pager`,
  { stdio: 'inherit' }
);
console.log('✅ CloudFront invalidation sent.');
