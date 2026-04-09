#!/bin/bash
# Updates imgproxy Lambda functions to use the image tag produced by this CI run.
# Assumes dev and prod roles in turn and updates the Lambda in each account.

set -euo pipefail

: "${DEV_ASSUME_ROLE:?Need to set DEV_ASSUME_ROLE}"
: "${PROD_ASSUME_ROLE:?Need to set PROD_ASSUME_ROLE}"

for var in LAMBDA_FUNCTION_NAME DOCKER_TAG ECR_REGISTRY ECR_REPO_NAME; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set."
    exit 1
  fi
done

IMAGE_URI="${ECR_REGISTRY}/${ECR_REPO_NAME}:${DOCKER_TAG}"

ROLES=("$DEV_ASSUME_ROLE" "$PROD_ASSUME_ROLE")

for assume_role in "${ROLES[@]}"; do
  echo "Assuming role for Lambda update: $assume_role"
  CREDS=$(aws sts assume-role \
    --role-arn "$assume_role" \
    --role-session-name "imgproxy-lambda-deploy" \
    --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
    --output text)
  read -r AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN <<< "$CREDS"
  export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
  echo "✅ Assumed role and set temporary credentials."

  echo "Updating Lambda function: $LAMBDA_FUNCTION_NAME"
  echo "Updating Lambda to image: $IMAGE_URI"
  aws lambda update-function-code \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --image-uri "$IMAGE_URI"
done

