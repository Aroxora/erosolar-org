#!/bin/bash
# Quick sketch — adapt to your AWS account / zip or container image
set -e
echo "AWS Lambda + EventBridge tracker for erosolar-org jobs/PhD (agentic)"
echo "1. npm i -g @aws-sdk/client-lambda (or use SAM / CDK)"
echo "2. zip -r tracker.zip job-phd-tracker-lambda.mjs node_modules package.json 2>/dev/null || true"
echo "3. aws lambda create-function --function-name erosolar-tracker --runtime nodejs22.x --handler job-phd-tracker-lambda.handler --zip-file fileb://tracker.zip --role arn:... --environment Variables={DEEPSEEK_API_KEY=...,TAVILY_API_KEY=...}"
echo "4. aws events put-rule --name daily-tracker --schedule-expression 'rate(6 hours)' ; aws events put-targets ..."
echo "See also the Cloud Functions scheduled version (cheaper if already on Blaze)."
