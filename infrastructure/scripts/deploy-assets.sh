#!/bin/bash
set -euo pipefail

ENV=${1:-stg}  # stg or prd

PREFIX=$(echo "${ENV}" | tr '[:lower:]' '[:upper:]')
BUCKET_VAR="${PREFIX}_ASSETS_S3_BUCKET"
S3_BUCKET=${!BUCKET_VAR}

echo "Deploiement des assets statiques vers ${ENV}..."
echo "Bucket: ${S3_BUCKET}"

aws s3 sync "code/www-assets/" "s3://${S3_BUCKET}" \
  --delete \
  --cache-control "public, max-age=86400"

echo "Deploiement assets vers ${ENV} termine."
