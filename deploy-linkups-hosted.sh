#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/admin/apps/linkups-source"
APP_DIR="/home/admin/domains/linkupsadventures.co.ke/linkups-app"
BUNDLE="$REPO_DIR/artifacts/api-server/hosted-release"
APP_PORT="5002"

if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "LinkUps source checkout not found; stopping."
  exit 1
fi

if [[ "$(id -un)" != "admin" ]]; then
  echo "Run this deployment as the admin user."
  exit 1
fi

if [[ "${1:-}" != "--after-pull" ]]; then
  GIT_TERMINAL_PROMPT=0 git -C "$REPO_DIR" pull --ff-only origin main
  exec bash "$REPO_DIR/deploy-linkups-hosted.sh" --after-pull
fi

if [[ "$(git -C "$REPO_DIR" branch --show-current)" != "main" ]]; then
  echo "The LinkUps source checkout is not on main; stopping."
  exit 1
fi

for file in \
  dist/index.mjs \
  public/index.html \
  package.json \
  database/schema.mysql \
  database/seed.mysql \
  database/migrations/001_adventure_trip_details.mysql \
  database/migrations/002_scheduled_events.mysql \
  database/migrations/003_site_content_pages_and_hero.mysql
do
  if [[ ! -s "$BUNDLE/$file" ]]; then
    echo "Missing deployment file: $BUNDLE/$file"
    exit 1
  fi
done

if [[ ! -d "$APP_DIR" || ! -w "$APP_DIR" ]]; then
  echo "LinkUps app folder is missing or not writable by admin."
  exit 1
fi

commit="$(git -C "$REPO_DIR" rev-parse --short HEAD)"
echo "GitHub main commit ready to deploy: $commit"
read -r -p "Type DEPLOY LINKUPS to replace release files and restart its app: " answer
if [[ "$answer" != "DEPLOY LINKUPS" ]]; then
  echo "Cancelled; live files were not changed."
  exit 0
fi

cp -a "$BUNDLE/." "$APP_DIR/"
npm --prefix "$APP_DIR" install --omit=dev
pm2 restart linkups

healthy=0
for attempt in {1..20}; do
  if curl -fsS --max-time 3 "http://127.0.0.1:${APP_PORT}/api/healthz" 2>/dev/null; then
    echo
    healthy=1
    break
  fi
  sleep 2
done

if [[ "$healthy" -ne 1 ]]; then
  echo "Health check failed. Check LinkUps logs with: pm2 logs linkups --lines 50"
  exit 1
fi

echo "LinkUps deployment and health check completed."
