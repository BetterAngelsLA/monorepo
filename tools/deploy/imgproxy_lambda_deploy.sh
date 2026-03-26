#!/bin/bash
# Updates the imgproxy Lambda function to use the image tag produced by this CI run.

set -euo pipefail

: "${ASSUME_ROLE:?Need to set ASSUME_ROLE}"

for var in LAMBDA_FUNCTION_NAME DOCKER_TAG ECR_REGISTRY ECR_REPO_NAME; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set."
    exit 1
  fi
done

echo "Assuming role for Lambda update: $ASSUME_ROLE"
CREDS=$(aws sts assume-role \
  --role-arn "$ASSUME_ROLE" \
  --role-session-name "imgproxy-lambda-deploy" \
  --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
  --output text)
read -r AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN <<< "$CREDS"
export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
echo "✅ Assumed role and set temporary credentials."


IMAGE_URI="${ECR_REGISTRY}/${ECR_REPO_NAME}:${DOCKER_TAG}"
echo "Updating Lambda function: $LAMBDA_FUNCTION_NAME"
echo "Updating Lambda to image: $IMAGE_URI"

aws lambda update-function-code \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --image-uri "$IMAGE_URI"

