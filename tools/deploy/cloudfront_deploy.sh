#!/usr/bin/env bash
set -euo pipefail

# Fail fast if required environment variables are not set
: "${S3_BUCKET:?Need to set S3_BUCKET}"
: "${CF_DISTRIBUTION_ID:?Need to set CF_DISTRIBUTION_ID}"
: "${NX_TASK_TARGET_PROJECT:?Must be run via Nx so NX_TASK_TARGET_PROJECT is available}"
: "${VITE_APP_BASE_PATH:?Need to set VITE_APP_BASE_PATH (e.g. / or /branches/staging)}"
: "${ASSUME_ROLE:?Need to set ASSUME_ROLE}"

echo "🔑 Assuming role: ${ASSUME_ROLE}..."
# Assume the role using AWS CLI, capturing the temporary credentials
CREDS=$(aws sts assume-role \
  --role-arn "${ASSUME_ROLE}" \
  --role-session-name "deployment-script-session" \
  --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
  --output text)

# Parse the credentials from the output
AWS_ACCESS_KEY_ID=$(echo "$CREDS" | awk '{print $1}')
AWS_SECRET_ACCESS_KEY=$(echo "$CREDS" | awk '{print $2}')
AWS_SESSION_TOKEN=$(echo "$CREDS" | awk '{print $3}')

export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_SESSION_TOKEN

echo "✅ Assumed role and set temporary credentials."

# Normalize base path: remove leading/trailing slash for S3 path, keep for CloudFront
S3_PATH=$(echo "$VITE_APP_BASE_PATH" | sed 's|^/||' | sed 's|/$||')  # e.g. "branches/staging" or ""
CF_PATH="$VITE_APP_BASE_PATH"                                       # e.g. "/branches/staging" or "/"

# Get the app's root folder using Nx metadata
APP_ROOT=$(yarn nx show project "$NX_TASK_TARGET_PROJECT" --json | jq -r '.root')
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
  --paths "$CF_PATH/*" > /dev/null

echo "✅ CloudFront invalidation sent."
