#!/bin/bash
# Production deployment script
# Usage: bash scripts/deploy.sh

set -e

echo "🚀 AIS Production Deployment"
echo "=============================="

# 1. Validate .env
if [ ! -f .env ]; then
  echo "❌ .env file not found. Copy .env.example and fill in your values."
  exit 1
fi

if grep -q "REPLACE_WITH" .env; then
  echo "❌ .env still has placeholder values. Update JWT_SECRET and POSTGRES_PASSWORD."
  exit 1
fi

# 2. Create required directories
mkdir -p logs uploads nginx/ssl

# 3. Generate SSL cert if not present
if [ ! -f nginx/ssl/cert.pem ]; then
  echo "⚠️  No SSL certificate found. Generating self-signed cert for now..."
  bash scripts/generate-self-signed-cert.sh
fi

# 4. Pull latest, build, restart
echo "📦 Building and starting containers..."
docker compose -f docker-compose.prod.yml pull postgres nginx
docker compose -f docker-compose.prod.yml up -d --build

# 5. Wait for health
echo "⏳ Waiting for app to become healthy..."
for i in $(seq 1 12); do
  sleep 5
  STATUS=$(docker compose -f docker-compose.prod.yml exec -T app wget -qO- http://localhost:3000/api/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "")
  if [ "$STATUS" = "ok" ]; then
    echo "✅ App is healthy!"
    break
  fi
  echo "   Attempt $i/12..."
done

echo ""
echo "📊 Container status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deployment complete!"
echo "   App: http://localhost (or your domain)"
echo "   Logs: docker compose -f docker-compose.prod.yml logs -f app"
