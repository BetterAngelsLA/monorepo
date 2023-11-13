#!/bin/bash

# Script Description:
# This script creates a JSON file with container and image URI details, zips the file,
# and uploads it to an S3 bucket.

# Check for AWS CLI installation
if ! command -v aws &> /dev/null
then
    echo "AWS CLI could not be found. Please install it to run this script."
    exit 1
fi

# Ensuring all required environment variables are set
MISSING_VARS=false

for var in CONTAINER_NAME IMAGE_JSON_NAME DIST_PATH ECR_REGISTRY ZIP_NAME BUILD_ARTIFACT_BUCKET; do
    if [ -z "${!var}" ]; then
        echo "Error: Environment variable $var is not set."
        MISSING_VARS=true
    fi
done

if [ "$MISSING_VARS" = true ]; then
    exit 1
fi

DIST_PATH=./dist/${APP_NAME}
IMAGE_JSON_NAME=imagedefinitions.json
ZIP_NAME=imagedefinitions.zip
REPO_URI="${ECR_REGISTRY}:${DOCKER_TAG:-dev}"
IMAGE_JSON_PATH="${DIST_PATH}/${IMAGE_JSON_NAME}"
IMAGE_ZIP_PATH="${DIST_PATH}/${ZIP_NAME}"
S3_PATH=${BUILD_ARTIFACT_BUCKET}/${APP_NAME}/${ZIP_NAME}"

echo "Creating ${IMAGE_JSON_NAME} file..."
mkdir -p "${DIST_PATH}"
echo "[{\"name\": \"${CONTAINER_NAME}\", \"imageUri\": \"${REPO_URI}\"}]" > "${IMAGE_JSON_PATH}"

echo "Zipping ${IMAGE_JSON_NAME}..."
zip -j "${IMAGE_ZIP_PATH}" "${IMAGE_JSON_PATH}"

echo "Pushing ${ZIP_NAME} to S3..."
aws s3 cp "${IMAGE_ZIP_PATH}" "${S3_PATH}"
