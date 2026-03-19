#!/bin/bash
set -euo pipefail

ENV=${1:-stg}  # stg or prd

PREFIX=$(echo "${ENV}" | tr '[:lower:]' '[:upper:]')
LAMBDA_VAR="${PREFIX}_CRON_LAMBDA_NAME"
LAMBDA_NAME=${!LAMBDA_VAR}

echo "Deploiement cron vers ${ENV} (Lambda: ${LAMBDA_NAME})..."

cd code/crons
bun run build

cd dist
zip -r ../../../cron-lambda.zip .
cd ..
zip -r ../../cron-lambda.zip node_modules/ package.json
cd ../..

aws lambda update-function-code \
  --function-name "${LAMBDA_NAME}" \
  --zip-file fileb://cron-lambda.zip

rm cron-lambda.zip

echo "Deploiement cron vers ${ENV} termine."
