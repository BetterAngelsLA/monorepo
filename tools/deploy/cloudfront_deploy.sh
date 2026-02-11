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
read -r AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN <<< "$CREDS"
export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
echo "✅ Assumed role and set temporary credentials."

# --- Resolve paths ---
S3_PATH="${VITE_APP_BASE_PATH#/}"   # strip leading slash: "branches/staging" or ""
S3_PATH="${S3_PATH%/}"              # strip trailing slash
# For root path (/), CF_PATH intentionally becomes "" so invalidation is "/*" not "//*"
CF_PATH="${VITE_APP_BASE_PATH%/}"   # "/branches/staging" or ""
S3_DEST="s3://$S3_BUCKET/$S3_PATH"

APP_ROOT=$(yarn nx show project "$NX_TASK_TARGET_PROJECT" --json | jq -r '.root')
DIST_PATH="dist/$APP_ROOT"

echo "📦 $NX_TASK_TARGET_PROJECT | 🗂 $DIST_PATH → $S3_DEST | 🚀 invalidate: $CF_PATH/*"

# --- Deploy ---
# Sync static files to S3
aws s3 sync "$DIST_PATH" "$S3_DEST" --delete
echo "✅ S3 sync complete."

# Invalidate CloudFront cache for the deployed path
aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths "$CF_PATH/*" > /dev/null
echo "✅ CloudFront invalidation sent."
