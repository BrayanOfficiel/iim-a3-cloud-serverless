#!/bin/bash
set -euo pipefail

ENV=${1:-stg}   # stg or prd
APP=${2:-user}  # user or admin

PREFIX=$(echo "${ENV}" | tr '[:lower:]' '[:upper:]')
APP_UPPER=$(echo "${APP}" | tr '[:lower:]' '[:upper:]')

BUCKET_VAR="${PREFIX}_${APP_UPPER}_S3_BUCKET"
CF_VAR="${PREFIX}_${APP_UPPER}_CF_DISTRIBUTION_ID"

S3_BUCKET=${!BUCKET_VAR}
CF_DISTRIBUTION_ID=${!CF_VAR}

# Determiner le dossier source
if [ "$APP" = "user" ]; then
  SRC_DIR="code/www-user/dist"
elif [ "$APP" = "admin" ]; then
  SRC_DIR="code/www-admin/dist"
else
  echo "Erreur: APP doit etre 'user' ou 'admin'"
  exit 1
fi

echo "Deploiement ${APP} vers ${ENV}..."
echo "Bucket: ${S3_BUCKET}"

# Synchroniser les fichiers (sauf index.html)
aws s3 sync "${SRC_DIR}/" "s3://${S3_BUCKET}" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Uploader index.html sans cache
aws s3 cp "${SRC_DIR}/index.html" "s3://${S3_BUCKET}/index.html" \
  --cache-control "no-cache, no-store, must-revalidate"

# Invalider le cache CloudFront
aws cloudfront create-invalidation \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --paths "/*"

echo "Deploiement ${APP} vers ${ENV} termine."
