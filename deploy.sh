#!/bin/bash
# deploy.sh — запускать на сервере для обновления приложения
set -e

echo "🚀 Deploying API Docs..."

# Pull latest code
git pull origin main

# Rebuild and restart containers
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

echo "✅ Deploy complete! App running at http://$(curl -s ifconfig.me)"
