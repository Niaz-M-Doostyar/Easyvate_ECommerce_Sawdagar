#!/usr/bin/env bash

set -euo pipefail

APP_ROOT="$(pwd)"

if [[ ! -f "$APP_ROOT/package.json" || ! -d "$APP_ROOT/website" || ! -d "$APP_ROOT/backend" ]]; then
  echo "Deployment must run from the Sawdagar repository root." >&2
  exit 1
fi

if [[ ! -f "$APP_ROOT/backend/.env" || ! -f "$APP_ROOT/website/.env.local" || ! -f "$APP_ROOT/admin/.env.local" ]]; then
  echo "VPS environment files are missing. See docs/DEPLOYMENT.md." >&2
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 is required on the VPS. Install it once with: npm install --global pm2" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "The VPS checkout contains tracked changes; refusing to overwrite them." >&2
  exit 1
fi

git pull --ff-only origin main

npm ci --prefix backend
(cd backend && npx prisma generate && npx prisma migrate deploy)

npm ci --prefix website
npm run build --prefix website
mkdir -p "$APP_ROOT/website/.next/standalone/public" "$APP_ROOT/website/.next/standalone/.next/static"
cp -R "$APP_ROOT/website/public/." "$APP_ROOT/website/.next/standalone/public/"
cp -R "$APP_ROOT/website/.next/static/." "$APP_ROOT/website/.next/standalone/.next/static/"

npm ci --prefix admin
npm run build --prefix admin
mkdir -p "$APP_ROOT/admin/.next/standalone/public" "$APP_ROOT/admin/.next/standalone/.next/static"
cp -R "$APP_ROOT/admin/public/." "$APP_ROOT/admin/.next/standalone/public/"
cp -R "$APP_ROOT/admin/.next/static/." "$APP_ROOT/admin/.next/standalone/.next/static/"

pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

curl --fail --silent --show-error --retry 8 --retry-delay 2 http://127.0.0.1:4000/api/ready >/dev/null
curl --fail --silent --show-error --retry 8 --retry-delay 2 http://127.0.0.1:4000/api/categories >/dev/null
curl --fail --silent --show-error --retry 8 --retry-delay 2 'http://127.0.0.1:4000/api/products?limit=1' >/dev/null
curl --fail --silent --show-error --retry 8 --retry-delay 2 http://127.0.0.1:3000/ >/dev/null
curl --fail --silent --show-error --retry 8 --retry-delay 2 http://127.0.0.1:3001/sawdagar-admin/ >/dev/null

echo "Sawdagar deployment completed and all local health checks passed."
