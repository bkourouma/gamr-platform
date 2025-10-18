#!/bin/sh
set -e

echo "Applying database migrations and seeding..."
npm run db:deploy

echo "Starting server..."
exec node dist-server/server/simple-index.js


