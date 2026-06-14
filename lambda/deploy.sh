#!/usr/bin/env bash
# One-command deploy of the erosolar.org agentic backend to AWS Lambda
# (the Firebase project stays on Spark — no Cloud Functions).
#
# Prereqs:
#   - aws CLI authenticated:  aws sso login   (or static creds)
#   - DEEPSEEK_API_KEY + TAVILY_API_KEY in the environment, or in ../functions/.env
#   - (optional) FIREBASE_SERVICE_ACCOUNT (raw JSON or base64) to also deploy the
#     daily scheduled scanner that writes Firestore itself.
#
# What it does (idempotent):
#   1. Packages lambda/ (+ firebase-admin) into a zip.
#   2. Ensures an IAM execution role.
#   3. Creates/updates the API Lambda + a CORS-enabled Function URL (auth NONE;
#      we verify the Firebase ID token inside the function).
#   4. (Optional) Creates/updates the scheduled scanner + a daily EventBridge rule.
#   5. Writes the Function URL into site/src/app/api.config.ts, rebuilds the
#      Angular site, and redeploys Firebase Hosting + Firestore rules.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGION="${AWS_REGION:-us-east-1}"
# NOTE: must be a UNIQUE name — `erosolar-api` is the vigil-by-trenchwork backend.
FN="${FN_NAME:-erosolar-org-api}"
SCHED_FN="${SCHED_FN_NAME:-erosolar-org-scheduler}"
ROLE_NAME="${FN}-role"
RUNTIME="nodejs20.x"
ZIP="/tmp/${FN}.zip"
ALLOW_ORIGIN="${ALLOW_ORIGIN:-https://erosolar.org}"
FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID:-twitch-womens-history}"

# Load keys from functions/.env if not already in the environment.
if [[ -z "${DEEPSEEK_API_KEY:-}" || -z "${TAVILY_API_KEY:-}" ]] && [[ -f "$ROOT/functions/.env" ]]; then
  set -a; . "$ROOT/functions/.env"; set +a
fi
: "${DEEPSEEK_API_KEY:?set DEEPSEEK_API_KEY (or put it in functions/.env)}"
: "${TAVILY_API_KEY:?set TAVILY_API_KEY (or put it in functions/.env)}"

echo "==> Packaging Lambda ..."
( cd "$ROOT/lambda" && npm install --omit=dev --no-audit --no-fund >/dev/null 2>&1 )
rm -f "$ZIP"
( cd "$ROOT/lambda" && zip -qr "$ZIP" api.mjs core.mjs scheduler.mjs package.json node_modules )
echo "    -> $ZIP"

echo "==> Ensuring IAM role ${ROLE_NAME} ..."
if ! aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  aws iam create-role --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
  aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole >/dev/null
  echo "    created; waiting for propagation..."; sleep 12
fi
ROLE_ARN="$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)"

ENV_API="Variables={DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY,TAVILY_API_KEY=$TAVILY_API_KEY,DEEPSEEK_MODEL=${DEEPSEEK_MODEL:-deepseek-v4-pro},XAI_API_KEY=${XAI_API_KEY:-},XAI_MODEL=${XAI_MODEL:-grok-4.3},FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,ALLOW_ORIGIN=$ALLOW_ORIGIN}"

deploy_fn () {  # name handler env
  local name="$1" handler="$2" env="$3"
  if aws lambda get-function --function-name "$name" --region "$REGION" >/dev/null 2>&1; then
    # SAFETY GUARD (see docs/incident-erosolar-api): never overwrite a function this
    # project did not create. We adopt a function only if it carries project=erosolar-org.
    local arn owner
    arn="$(aws lambda get-function --function-name "$name" --region "$REGION" --query Configuration.FunctionArn --output text)"
    owner="$(aws lambda list-tags --resource "$arn" --region "$REGION" --query 'Tags.project' --output text 2>/dev/null || echo None)"
    if [ "$owner" != "erosolar-org" ]; then
      echo "✗ Refusing to overwrite existing Lambda '$name' (project tag='$owner', not 'erosolar-org')."
      echo "  That function belongs to another project. Pick a different name, e.g.:"
      echo "    FN_NAME=erosolar-org-api2 bash lambda/deploy.sh"
      exit 1
    fi
    echo "==> Updating $name ..."
    aws lambda update-function-code --function-name "$name" --zip-file "fileb://$ZIP" --region "$REGION" >/dev/null
    aws lambda wait function-updated --function-name "$name" --region "$REGION"
    aws lambda update-function-configuration --function-name "$name" --region "$REGION" \
      --timeout 120 --memory-size 512 --runtime "$RUNTIME" --handler "$handler" --environment "$env" >/dev/null
  else
    echo "==> Creating $name ..."
    aws lambda create-function --function-name "$name" --region "$REGION" \
      --runtime "$RUNTIME" --handler "$handler" --role "$ROLE_ARN" \
      --timeout 120 --memory-size 512 --zip-file "fileb://$ZIP" --environment "$env" \
      --tags project=erosolar-org >/dev/null
    aws lambda wait function-active --function-name "$name" --region "$REGION"
  fi
}

deploy_fn "$FN" "api.handler" "$ENV_API"

echo "==> Ensuring CORS-enabled Function URL ..."
# Note: do NOT list OPTIONS in AllowMethods — Function URL CORS handles preflight
# automatically, and each method value must be <= 6 chars (so "OPTIONS" is rejected).
CORS_JSON='{"AllowOrigins":["'"$ALLOW_ORIGIN"'","http://localhost:4200"],"AllowMethods":["POST"],"AllowHeaders":["authorization","content-type"],"MaxAge":3600}'
if ! aws lambda get-function-url-config --function-name "$FN" --region "$REGION" >/dev/null 2>&1; then
  aws lambda create-function-url-config --function-name "$FN" --auth-type NONE --cors "$CORS_JSON" --region "$REGION" >/dev/null
  aws lambda add-permission --function-name "$FN" --statement-id fnurl --action lambda:InvokeFunctionUrl \
    --principal '*' --function-url-auth-type NONE --region "$REGION" >/dev/null 2>&1 || true
else
  aws lambda update-function-url-config --function-name "$FN" --cors "$CORS_JSON" --region "$REGION" >/dev/null
fi
URL="$(aws lambda get-function-url-config --function-name "$FN" --region "$REGION" --query 'FunctionUrl' --output text)"
URL="${URL%/}"
echo "    Function URL: $URL"

# Optional scheduled scanner (only if a service-account key is provided).
if [[ -n "${FIREBASE_SERVICE_ACCOUNT:-}" ]]; then
  deploy_fn "$SCHED_FN" "scheduler.handler" "Variables={DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY,TAVILY_API_KEY=$TAVILY_API_KEY,DEEPSEEK_MODEL=${DEEPSEEK_MODEL:-deepseek-v4-pro},FIREBASE_SERVICE_ACCOUNT=$FIREBASE_SERVICE_ACCOUNT}"
  aws events put-rule --name "${SCHED_FN}-daily" --schedule-expression 'rate(1 day)' --region "$REGION" >/dev/null
  SCHED_ARN="$(aws lambda get-function --function-name "$SCHED_FN" --region "$REGION" --query 'Configuration.FunctionArn' --output text)"
  aws lambda add-permission --function-name "$SCHED_FN" --statement-id evt --action lambda:InvokeFunction \
    --principal events.amazonaws.com --source-arn "$(aws events describe-rule --name "${SCHED_FN}-daily" --region "$REGION" --query 'Arn' --output text)" --region "$REGION" >/dev/null 2>&1 || true
  aws events put-targets --rule "${SCHED_FN}-daily" --region "$REGION" --targets "Id=1,Arn=${SCHED_ARN}" >/dev/null
  echo "    scheduled scanner: ${SCHED_FN} (daily)"
fi

echo "==> Wiring the Function URL into the frontend + redeploying ..."
CFG="$ROOT/site/src/app/api.config.ts"
if [[ -f "$CFG" ]]; then
  perl -0pi -e "s#export const LAMBDA_API_BASE = '[^']*';#export const LAMBDA_API_BASE = '$URL';#" "$CFG"
  ( cd "$ROOT/site" && npm run build >/dev/null )
  ( cd "$ROOT" && firebase deploy --only hosting,firestore:rules --project "$FIREBASE_PROJECT_ID" >/dev/null )
  echo "    frontend rebuilt + hosting/rules redeployed with API base $URL"
fi

echo ""
echo "✅ Done."
echo "   API:  $URL"
echo "   Test (as admin, in the site): open the chatbot or click 'Force agent scan'."
