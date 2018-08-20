#!/usr/bin/env bash

# Exit on error
set -e

echo "Creating deployment package..."
zip --quiet --recurse-paths --test -X deployment-package.zip *

echo "Uploading to AWS Lambda..."
aws lambda update-function-code --function-name ShoppingAssistant-CognitoSyncTrigger --zip-file fileb://deployment-package.zip > /dev/null

echo "Cleaning up..."
rm -f deployment-package.zip

echo "Success!"
