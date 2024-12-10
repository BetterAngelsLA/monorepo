#!/bin/bash

# Define variables
BUCKET_NAME=${BUND_S3_BUCKET}
DISTRIBUTION_ID=${CLOUDFRONT_DISTRIBUTION_ID}
DIST_PATH="./dist/${APP_NAME}"

# Sync build output to S3 bucket
aws s3 sync $BUILD_DIR s3://$BUCKET_NAME --delete

# Create CloudFront invalidation
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
