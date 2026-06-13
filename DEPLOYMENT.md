# AIS — Deployment Guide

## Quick Start (Development)

```bash
# Clone and install
git clone https://github.com/supawatth-dot/AIS.git && cd AIS
npm install

# Configure
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET

# Run
npm run dev         # with nodemon auto-reload
# OR
npm start           # plain node
```

Open http://localhost:3000 — login: `admin@ais.local` / `Admin@123`

---

## Docker — Development

```bash
cp .env.example .env   # uses SQLite by default in dev compose
npm run docker:dev
```

---

## Docker — Production (PostgreSQL + Nginx + SSL)

### 1. Prepare environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=production
JWT_SECRET=<run: npm run gen:secret>
POSTGRES_PASSWORD=<strong-password>
DATABASE_URL=postgresql://ais_user:<password>@postgres:5432/ais_db
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=you@gmail.com
SMTP_PASS=<gmail-app-password>
```

### 2. SSL Certificate

**Option A — Self-signed (testing only):**
```bash
bash scripts/generate-self-signed-cert.sh your-domain.com
```

**Option B — Let's Encrypt (production):**
```bash
# Start nginx first with HTTP only to get cert
certbot certonly --webroot -w /var/www/certbot -d your-domain.com
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

### 3. Deploy

```bash
bash scripts/deploy.sh
# OR manually:
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Verify

```bash
curl https://your-domain.com/api/health
```

---

## PM2 (Without Docker)

```bash
# Install PM2 globally
npm install -g pm2

# Start (cluster mode — uses all CPU cores)
npm run pm2:start

# Save to autostart on reboot
pm2 save
pm2 startup

# Monitor
pm2 monit

# View logs
npm run pm2:logs
```

---

## Database

| Mode | Database | Config |
|------|----------|--------|
| Development | SQLite | `DB_DIALECT=sqlite`, `DATABASE_URL=sqlite:./database.sqlite` |
| Production | PostgreSQL | `DB_DIALECT=postgres`, `DATABASE_URL=postgresql://...` |

On first run, the app auto-creates tables and seeds:
```
Email:    admin@ais.local
Password: Admin@123
```
**Change the default password immediately after first login.**

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Default: `3000` |
| `JWT_SECRET` | Yes | Min 32 chars random string |
| `JWT_EXPIRES_IN` | No | Default: `7d` |
| `DB_DIALECT` | Yes | `sqlite` or `postgres` |
| `DATABASE_URL` | Yes | DB connection string |
| `POSTGRES_PASSWORD` | Prod | PostgreSQL password |
| `SMTP_HOST` | No | SMTP server (email disabled if empty) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `FRONTEND_URL` | No | Used in email links |
| `ALLOWED_ORIGINS` | Prod | Comma-separated CORS origins |
| `LOG_LEVEL` | No | `error`/`warn`/`info`/`debug` |
| `LOG_DIR` | No | Default: `./logs` |

---

## Backup & Restore

### PostgreSQL Backup
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U ais_user ais_db > backup_$(date +%Y%m%d).sql
```

### PostgreSQL Restore
```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U ais_user ais_db < backup.sql
```

### SQLite Backup
```bash
cp database.sqlite database_backup_$(date +%Y%m%d).sqlite
```

---

## Useful Commands

```bash
# View live logs
docker compose -f docker-compose.prod.yml logs -f app

# Restart app only
docker compose -f docker-compose.prod.yml restart app

# Generate new JWT secret
npm run gen:secret

# Check container health
docker compose -f docker-compose.prod.yml ps
```
