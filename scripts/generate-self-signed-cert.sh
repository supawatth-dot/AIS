#!/bin/bash
# Generate self-signed SSL certificate for development/testing
# For production, use Let's Encrypt (Certbot) instead
#
# Usage: bash scripts/generate-self-signed-cert.sh [domain]
# Example: bash scripts/generate-self-signed-cert.sh ais.yourdomain.com

DOMAIN=${1:-localhost}
OUTDIR="nginx/ssl"

mkdir -p "$OUTDIR"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$OUTDIR/key.pem" \
  -out "$OUTDIR/cert.pem" \
  -subj "/C=TH/ST=Bangkok/L=Bangkok/O=AIS/CN=${DOMAIN}"

echo ""
echo "✅ Self-signed certificate created:"
echo "   Cert: $OUTDIR/cert.pem"
echo "   Key:  $OUTDIR/key.pem"
echo ""
echo "⚠️  For production, replace with a real certificate from Let's Encrypt:"
echo "   certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN}"
