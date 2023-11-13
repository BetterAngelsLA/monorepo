#!/bin/bash

# Script Description:
# This script creates a JSON file with container and image URI details, zips the file,
# and conditionally uploads it to an S3 bucket based on the Docker tag.

# Check for AWS CLI installation
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI could not be found. Please install it to run this script."
    exit 1
fi

# Ensuring all required environment variables are set
for var in CONTAINER_NAME ECR_REGISTRY BUILD_ARTIFACT_BUCKET APP_NAME DOCKER_TAG; do
    if [ -z "${!var}" ]; then
        echo "Error: Environment variable $var is not set."
        exit 1
    fi
done

# Constants
IMAGE_JSON_NAME="imagedefinitions.json"
ZIP_NAME="imagedefinitions.zip"

# Paths
DIST_PATH="./dist/${APP_NAME}"
REPO_URI="${ECR_REGISTRY}/${APP_NAME}:${DOCKER_TAG}"
IMAGE_JSON_PATH="${DIST_PATH}/${IMAGE_JSON_NAME}"
IMAGE_ZIP_PATH="${DIST_PATH}/${ZIP_NAME}"
S3_PATH="${BUILD_ARTIFACT_BUCKET}/${APP_NAME}/${ZIP_NAME}"

# Create the JSON file
echo "Creating ${IMAGE_JSON_NAME} file..."
mkdir -p "${DIST_PATH}" || { echo "Error creating directory ${DIST_PATH}"; exit 1; }
echo "[{\"name\": \"${CONTAINER_NAME}\", \"imageUri\": \"${REPO_URI}\"}]" > "${IMAGE_JSON_PATH}" || { echo "Error writing to ${IMAGE_JSON_PATH}"; exit 1; }

# Zip the file
echo "Zipping ${IMAGE_JSON_NAME}..."
zip -j "${IMAGE_ZIP_PATH}" "${IMAGE_JSON_PATH}" || { echo "Error zipping file ${IMAGE_JSON_PATH}"; exit 1; }

# Push to S3 if DOCKER_TAG is not 'dev'
if [ "${DOCKER_TAG}" != "dev" ]; then
    echo "Pushing ${ZIP_NAME} to S3..."
    aws s3 cp "${IMAGE_ZIP_PATH}" "${S3_PATH}" || { echo "Error uploading ${ZIP_NAME} to S3"; exit 1; }
else
    echo "DOCKER_TAG is 'dev', skipping push to S3."
fi
