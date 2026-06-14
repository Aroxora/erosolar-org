#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy a private, JSON-enabled SearXNG to Google Cloud Run — the proprietary,
# scale-to-zero (~$0 idle) replacement for Tavily. Then point the agentic Lambda
# at it (SEARCH_PROVIDER=searxng + SEARXNG_URL) or flip "Search → SearXNG" in the
# top-bar picker.
#
# Prereqs: gcloud CLI authed, and a BILLING-ENABLED GCP project (Cloud Run needs
# billing; twitch-womens-history on Spark won't qualify — use any project with
# billing via GCP_PROJECT=...). AWS alternative: run searxng/searxng on App
# Runner or a t4g.small EC2 and set SEARXNG_URL to that host.
#
# Usage:  GCP_PROJECT=my-billing-project bash infra/searxng-cloudrun.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${GCP_REGION:-us-central1}"
SERVICE="${SERVICE:-erosolar-searxng}"
: "${PROJECT:?Set GCP_PROJECT to a billing-enabled GCP project}"

SECRET="$(openssl rand -hex 32)"
TMP="$(mktemp -d)"
cat > "$TMP/Dockerfile" <<'DOCKER'
FROM searxng/searxng:latest
COPY settings.yml /etc/searxng/settings.yml
DOCKER
cat > "$TMP/settings.yml" <<YAML
use_default_settings: true
server:
  secret_key: "${SECRET}"
  limiter: false
  image_proxy: false
search:
  formats:
    - html
    - json
YAML

echo "==> Enabling APIs + deploying ${SERVICE} to Cloud Run (${PROJECT}/${REGION})…"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project "$PROJECT" >/dev/null
gcloud run deploy "$SERVICE" --source "$TMP" --project "$PROJECT" --region "$REGION" \
  --allow-unauthenticated --port 8080 --memory 512Mi --cpu 1 --min-instances 0 --max-instances 3 --timeout 30

URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)')"
echo ""
echo "✅ SearXNG: $URL"
echo "   Test:    curl '$URL/search?q=hello&format=json' | head -c 300"
echo ""
echo "   Point the agentic backend at it (re-run the Lambda deploy):"
echo "     SEARCH_PROVIDER=searxng SEARXNG_URL=$URL bash $(cd "$(dirname "$0")/.." && pwd)/lambda/deploy.sh"
echo "   …or just flip Search → SearXNG in the top-bar picker (writes settings/runtime;"
echo "   the Lambda still needs SEARXNG_URL in its env, set via the line above)."
echo ""
echo "   (Experimental: it's public + rate-limiter off. For production, restrict ingress"
echo "    or add an auth proxy and set SEARXNG_TOKEN.)"
