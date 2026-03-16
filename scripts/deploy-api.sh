#!/bin/bash
set -euo pipefail

ENV=$1  # stg or prd

PREFIX=$(echo "${ENV}" | tr '[:lower:]' '[:upper:]')
LAMBDA_VAR="${PREFIX}_API_LAMBDA_NAME"
LAMBDA_NAME=${!LAMBDA_VAR}

echo "Deploying API to ${ENV} (Lambda: ${LAMBDA_NAME})..."

# Package the Lambda
cd apps/api
zip -r ../../api-lambda.zip dist/ node_modules/ package.json
cd ../..

# Update Lambda function code
aws lambda update-function-code \
  --function-name "${LAMBDA_NAME}" \
  --zip-file fileb://api-lambda.zip

# Clean up
rm api-lambda.zip

echo "API deploy to ${ENV} complete!"
