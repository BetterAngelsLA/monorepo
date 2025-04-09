#!/usr/bin/env bash
set -euxo pipefail

# Env vars assumed:
#  - S3_BUCKET: The name of your S3 bucket (no s3:// prefix)
#  - CF_DISTRIBUTION_ID: The CloudFront distribution ID to invalidate
#  - DIST_PATH: The local path to your compiled static files (e.g. dist/apps/my-app)

: "${S3_BUCKET:?Need to set S3_BUCKET}"
: "${CF_DISTRIBUTION_ID:?Need to set CF_DISTRIBUTION_ID}"
: "${DIST_PATH:?Need to set DIST_PATH}"

echo "🚀 Deploying $DIST_PATH to s3://$S3_BUCKET"

# Sync the static assets to S3
aws s3 sync "$DIST_PATH" "s3://$S3_BUCKET" \
  --delete \
  --exclude \"*.DS_Store\"

echo "✅ S3 sync complete."

echo "🚀 Creating CloudFront invalidation"
aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths \"/*\"

echo "✅ CloudFront invalidation request sent."
