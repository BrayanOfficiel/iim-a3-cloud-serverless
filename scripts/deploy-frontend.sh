#!/bin/bash
set -euo pipefail

ENV=$1   # stg or prd
APP=$2   # user or admin

# Variables are set in GitLab CI/CD Settings > Variables
# Example: STG_USER_S3_BUCKET, STG_USER_CF_DISTRIBUTION_ID
PREFIX=$(echo "${ENV}" | tr '[:lower:]' '[:upper:]')
APP_UPPER=$(echo "${APP}" | tr '[:lower:]' '[:upper:]')

BUCKET_VAR="${PREFIX}_${APP_UPPER}_S3_BUCKET"
CF_VAR="${PREFIX}_${APP_UPPER}_CF_DISTRIBUTION_ID"

S3_BUCKET=${!BUCKET_VAR}
CF_DISTRIBUTION_ID=${!CF_VAR}

echo "Deploying ${APP} frontend to ${ENV}..."
echo "Bucket: ${S3_BUCKET}"

# Clear existing files
aws s3 rm "s3://${S3_BUCKET}" --recursive

# Upload new build
aws s3 sync "apps/${APP}/dist/" "s3://${S3_BUCKET}" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp "apps/${APP}/dist/index.html" "s3://${S3_BUCKET}/index.html" \
  --cache-control "no-cache, no-store, must-revalidate"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --paths "/*"

echo "Deploy ${APP} to ${ENV} complete!"
