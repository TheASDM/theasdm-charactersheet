# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Update Secrets (CRITICAL!)

Edit `.env.image` on your production server:

```bash
# Generate strong random secrets
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for SESSION_SECRET

# Update .env.image
nano .env.image
```

Replace:
```env
JWT_SECRET=change_me_to_random_32_char_string
SESSION_SECRET=change_me_to_another_random_string
```

### 2. Verify Environment Variables

Ensure `.env.image` has correct values:
- [x] `NODE_ENV=production`
- [x] `FRONTEND_URL=https://dnd.raptornet.dev`
- [x] `JWT_SECRET` (changed from default)
- [x] `SESSION_SECRET` (changed from default)

### 3. Database Backup

Before deploying:
```bash
docker exec wtforge-postgres pg_dump -U wtforge wtforge | gzip > backup_pre_deployment_$(date +%Y%m%d).sql.gz
```

## Deployment Steps

### Standard Deployment

```bash
cd ~/my-apps/theasdm-charactersheet

# Pull latest code
git pull origin main

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verify
docker ps
docker logs wtforge-app --tail 50
```

### First-Time Deployment

```bash
# Clone repository
git clone <your-repo-url> ~/my-apps/theasdm-charactersheet
cd ~/my-apps/theasdm-charactersheet

# Update secrets in .env.image (see above)
nano .env.image

# Build and start
docker-compose build
docker-compose up -d

# Wait for seeding to complete (check logs)
docker logs -f wtforge-app
```

## Post-Deployment Verification

### 1. Check Container Health

```bash
docker ps
# All containers should show "Up" status
```

### 2. Test Application

```bash
# Test health endpoint
curl https://dnd.raptornet.dev/api/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":...}
```

### 3. Check Database

```bash
docker exec wtforge-postgres psql -U wtforge -d wtforge -c "SELECT COUNT(*) FROM spells;"
# Should return 391

docker exec wtforge-postgres psql -U wtforge -d wtforge -c "SELECT COUNT(*) FROM classes;"
# Should return 12
```

### 4. Monitor Logs

```bash
# Watch for errors
docker logs -f wtforge-app

# Should see:
# ✅ Server running on port 8080
# No error messages
```

## Rollback Procedure

If deployment fails:

```bash
# Stop new containers
docker-compose down

# Restore database from backup
gunzip -c backup_pre_deployment_XXXXXX.sql.gz | docker exec -i wtforge-postgres psql -U wtforge wtforge

# Roll back code
git checkout <previous-commit-hash>

# Rebuild
docker-compose build
docker-compose up -d
```

## Performance Optimization (Optional)

After successful deployment, run:

```bash
sudo ./scripts/optimize-server.sh
```

This will:
- Update Node.js to v20 LTS
- Enable Docker BuildKit
- Configure TCP BBR
- Set up automated backups
- And more...

See [SERVER_OPTIMIZATION.md](SERVER_OPTIMIZATION.md) for details.

## Monitoring

### Health Checks

Set up a cron job to monitor health:

```bash
# Add to crontab
*/5 * * * * curl -s https://dnd.raptornet.dev/api/health || echo "Health check failed" | mail -s "WTForge Down" your@email.com
```

### Log Rotation

Logs are automatically rotated if you ran the optimization script.

Manual setup:
```bash
sudo nano /etc/logrotate.d/wtforge
# Add configuration from SERVER_OPTIMIZATION.md
```

## Troubleshooting

### Container won't start

```bash
docker logs wtforge-app
docker logs wtforge-postgres
```

### Database connection issues

```bash
docker exec wtforge-postgres pg_isready -U wtforge
```

### Styles not loading

Check browser console for CSP errors. Verify:
- `disableCSSOMInjection` is enabled in frontend/src/main.tsx
- CSP allows `'unsafe-inline'` for styleSrc

### Performance issues

Run diagnostics:
```bash
./scripts/server-check.sh
```

## Security Reminders

- ✅ Change default JWT_SECRET and SESSION_SECRET
- ✅ Keep Docker and system packages updated
- ✅ Regular database backups
- ✅ Monitor logs for suspicious activity
- ✅ Use HTTPS (handled by reverse proxy)
- ✅ CSP is enabled and configured

## Support

For issues, check:
1. [CHANGELOG.md](../CHANGELOG.md) for known issues
2. [SERVER_OPTIMIZATION.md](SERVER_OPTIMIZATION.md) for performance tips
3. Docker logs: `docker logs wtforge-app`
4. Database logs: `docker logs wtforge-postgres`
