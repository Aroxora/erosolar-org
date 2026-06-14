#!/usr/bin/env bash
# One-shot recovery + deploy. Run this yourself (the safety system reserves these
# AWS deploys for a human):
#
#   ! bash /Users/bo/GitHub/erosolar-org/lambda/fix-all.sh
#
# Step 1 restores the vigil-by-trenchwork Lambda that an earlier deploy overwrote.
# Step 2 deploys the erosolar.org backend under its own unique, guarded name.
# Step 3 verifies both. Safe to re-run (every step is idempotent).
set -uo pipefail
REGION="${AWS_REGION:-us-east-1}"

echo "================================================================"
echo " [1/3] Restoring vigil-by-trenchwork (rebuild from its source)"
echo "================================================================"
if bash /Users/bo/GitHub/vigil-by-trenchwork/aws/scripts/deploy.sh; then
  echo "   vigil restore: OK"
else
  echo "   vigil restore: FAILED (continuing) — re-run this script or vigil's deploy.sh"
fi

echo ""
echo "================================================================"
echo " [2/3] Deploying erosolar.org backend (erosolar-org-api)"
echo "================================================================"
if bash /Users/bo/GitHub/erosolar-org/lambda/deploy.sh; then
  echo "   erosolar-org-api deploy: OK"
else
  echo "   erosolar-org-api deploy: FAILED — see output above"
fi

echo ""
echo "================================================================"
echo " [3/3] Verification"
echo "================================================================"
echo -n "vigil 'erosolar-api' handler (expect src/index.handler): "
aws lambda get-function-configuration --function-name erosolar-api --region "$REGION" --query Handler --output text 2>&1 || true
echo -n "vigil 'erosolar-api' role (expect .../erosolar-lambda-role): "
aws lambda get-function-configuration --function-name erosolar-api --region "$REGION" --query Role --output text 2>&1 || true

URL="$(aws lambda get-function-url-config --function-name erosolar-org-api --region "$REGION" --query FunctionUrl --output text 2>/dev/null)"
URL="${URL%/}"
echo "erosolar-org-api Function URL: ${URL:-<none>}"
if [ -n "${URL:-}" ]; then
  echo -n "  unauthenticated /scan-jobs (expect 401 from our code): "
  curl -s -o /dev/null -w "%{http_code}\n" -m 20 -X POST "$URL/scan-jobs" -H "Content-Type: application/json" -d '{}' 2>&1 || true
  echo -n "  public /translate test (expect a Chinese translation): "
  curl -s -m 40 -X POST "$URL/translate" -H "Content-Type: application/json" -d '{"texts":["Hello, world"],"target":"zh"}' 2>&1 | head -c 200; echo
fi
echo ""
echo "Done. Tell Claude 'done' (or paste this output) and it will verify the site end-to-end."
