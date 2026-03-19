#!/bin/bash
set -euo pipefail

ENV=${1:-stg}  # stg or prd

PREFIX=$(echo "${ENV}" | tr '[:lower:]' '[:upper:]')
LAMBDA_VAR="${PREFIX}_API_LAMBDA_NAME"
LAMBDA_NAME=${!LAMBDA_VAR}

echo "Deploiement API vers ${ENV} (Lambda: ${LAMBDA_NAME})..."

cd code/api
bun run build

# Packager la Lambda
cd dist
zip -r ../../../api-lambda.zip .
cd ..
zip -r ../../api-lambda.zip node_modules/ package.json
cd ../..

# Inclure le code domain et les emails
zip -r api-lambda.zip code/domain/ code/emails/

# Mettre a jour le code de la Lambda
aws lambda update-function-code \
  --function-name "${LAMBDA_NAME}" \
  --zip-file fileb://api-lambda.zip

rm api-lambda.zip

echo "Deploiement API vers ${ENV} termine."
