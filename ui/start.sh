#!/bin/sh
set -eu

cd /app

echo "Frontend entrypoint starting..."
node --version || true
npm --version || true

if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
  echo "No production build detected in .next. Running 'npm run build'..."
  npm run build
else
  echo "Production build detected."
fi

echo "Starting Next.js with 'npm start'..."
exec npm start