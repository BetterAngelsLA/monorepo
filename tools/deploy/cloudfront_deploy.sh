#!/usr/bin/env bash
set -euo pipefail

: "${S3_BUCKET:?Need to set S3_BUCKET}"
: "${CF_DISTRIBUTION_ID:?Need to set CF_DISTRIBUTION_ID}"
: "${NX_TASK_TARGET_PROJECT:?Must be run via Nx so NX_TASK_TARGET_PROJECT is available}"
: "${VITE_APP_BASE_PATH:?Need to set VITE_APP_BASE_PATH (e.g. / or /branches/staging)}"
: "${ASSUME_ROLE:?Need to set ASSUME_ROLE}"

# --- Assume IAM role ---
echo "🔑 Assuming role: ${ASSUME_ROLE}..."
CREDS=$(aws sts assume-role \
  --role-arn "${ASSUME_ROLE}" \
  --role-session-name "deployment-script-session" \
  --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
  --output text)
export AWS_ACCESS_KEY_ID=$(echo "$CREDS" | awk '{print $1}')
export AWS_SECRET_ACCESS_KEY=$(echo "$CREDS" | awk '{print $2}')
export AWS_SESSION_TOKEN=$(echo "$CREDS" | awk '{print $3}')

# --- Resolve paths ---
S3_PATH="${VITE_APP_BASE_PATH#/}"   # strip leading slash: "branches/staging" or ""
S3_PATH="${S3_PATH%/}"              # strip trailing slash
CF_PATH="${VITE_APP_BASE_PATH%/}"   # strip trailing slash only: "/branches/staging" or ""
S3_DEST="s3://$S3_BUCKET/$S3_PATH"

APP_ROOT=$(yarn nx show project "$NX_TASK_TARGET_PROJECT" --json | jq -r '.root')
DIST_PATH="dist/$APP_ROOT"

echo "📦 $NX_TASK_TARGET_PROJECT | 🗂 $DIST_PATH → $S3_DEST | 🚀 invalidate: $CF_PATH/*"

# --- Deploy ---
# 1) Upload new files (keep old hashed bundles so stale edge caches still resolve)
aws s3 sync "$DIST_PATH" "$S3_DEST"
echo "✅ Uploaded new files."

# 2) Invalidate CloudFront and wait for full propagation
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths "$CF_PATH/*" \
  --query 'Invalidation.Id' --output text)
echo "⏳ Waiting for invalidation $INVALIDATION_ID..."
aws cloudfront wait invalidation-completed \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --id "$INVALIDATION_ID"
echo "✅ Invalidation complete."

# 3) Now safe to remove stale files — all edges serve the new index.html
aws s3 sync "$DIST_PATH" "$S3_DEST" --delete
echo "✅ Cleaned up old files."
