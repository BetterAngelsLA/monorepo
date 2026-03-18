#!/bin/bash

# Updates the imgproxy Lambda function to use the image tag produced by this CI run.
# Expects DOCKER_TAG, ECR_REGISTRY, ECR_REPO_NAME, LAMBDA_FUNCTION_NAME from the job env.

set -e

for var in LAMBDA_FUNCTION_NAME DOCKER_TAG ECR_REGISTRY ECR_REPO_NAME; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set."
    exit 1
  fi
done

IMAGE_URI="${ECR_REGISTRY}/${ECR_REPO_NAME}:${DOCKER_TAG}"
echo "Updating Lambda function: $LAMBDA_FUNCTION_NAME"
echo "Updating Lambda to image: $IMAGE_URI"

aws lambda update-function-code \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --image-uri "$IMAGE_URI"

