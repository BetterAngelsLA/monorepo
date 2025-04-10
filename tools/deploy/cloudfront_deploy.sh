#!/usr/bin/env bash
set -euxo pipefail

# Fail fast if required environment variables are not set
: "${S3_BUCKET:?Need to set S3_BUCKET}"
: "${CF_DISTRIBUTION_ID:?Need to set CF_DISTRIBUTION_ID}"
: "${NX_TASK_TARGET_PROJECT:?Must be run via Nx so NX_TASK_TARGET_PROJECT is available}"
: "${VITE_APP_BASE_PATH:?Need to set VITE_APP_BASE_PATH (e.g. / or /branches/staging)}"

# Normalize base path (remove leading slash for S3 path, but keep slash for CloudFront)
S3_PATH=$(echo "$VITE_APP_BASE_PATH" | sed 's|^/||' | sed 's|/$||')  # e.g. "branches/staging" or ""
CF_PATH="$VITE_APP_BASE_PATH"                                       # e.g. "/branches/staging" or "/"

# Get the app's root folder using Nx metadata
APP_ROOT=$(yarn nx show projects --json | jq -r --arg name "$NX_TASK_TARGET_PROJECT" '.[$name].root')
DIST_PATH="dist/$APP_ROOT"

echo "📦 Project: $NX_TASK_TARGET_PROJECT"
echo "📁 App root: $APP_ROOT"
echo "🗂  Local dist path: $DIST_PATH"
echo "🌐 Uploading to: s3://$S3_BUCKET/$S3_PATH"
echo "🚀 CloudFront path to invalidate: $CF_PATH/*"

# Sync static files to S3
aws s3 sync "$DIST_PATH" "s3://$S3_BUCKET/$S3_PATH" --delete

echo "✅ S3 sync complete."

# Invalidate CloudFront cache for the deployed path
aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths "$CF_PATH/*"

echo "✅ CloudFront invalidation sent."
