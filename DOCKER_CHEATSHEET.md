# Docker Deployment Cheat Sheet

## 🚀 Absolute Fastest Deployment (Copy-Paste)

### On Mac

```bash
cd ~/Documents/coding/projects/theasdm-charactersheet
tar --exclude='node_modules' --exclude='dist' --exclude='build' --exclude='.git' --exclude='postgres_data' -czf ~/dnd.tar.gz .
cp .env.example ~/dnd.env
# Edit ~/dnd.env with production values!
```

### On Proxmox LXC (Fresh Ubuntu)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh && apt install docker-compose -y

# Get files (from Mac - replace IP)
# Run this on Mac: scp ~/dnd.tar.gz ~/dnd.env root@LXC_IP:/root/

# Extract and deploy
mkdir /opt/dnd && cd /opt/dnd
tar -xzf ~/dnd.tar.gz
mv ~/dnd.env .env
chmod +x deploy.sh

# Deploy
./deploy.sh  # Choose 1
./deploy.sh  # Choose 3
```

**Done!** Access at `http://LXC_IP:3000`

---

## 📋 Command Quick Reference

### Deployment Script

```bash
./deploy.sh  # Interactive menu with options:
  1 - Fresh deployment
  2 - Update existing
  3 - Import D&D data
  4 - Backup database
  5 - Restore database
  6 - View logs
  7 - Stop services
  8 - Full reset (DANGER)
```

### Docker Compose Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View status
docker-compose ps

# View logs (all)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Restart service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build

# Execute command in container
docker-compose exec backend sh
docker-compose exec database psql -U dnd_user dnd_character_sheet

# Remove everything including volumes (DANGER)
docker-compose down -v
```

### Database Commands

```bash
# Backup
docker-compose exec database pg_dump -U dnd_user dnd_character_sheet > backup.sql

# Restore
cat backup.sql | docker-compose exec -T database psql -U dnd_user dnd_character_sheet

# Connect to database
docker-compose exec database psql -U dnd_user dnd_character_sheet

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Import D&D content
docker-compose exec backend node scripts/import-spells.js
docker-compose exec backend node scripts/import-species.js
docker-compose exec backend node scripts/import-classes.js
docker-compose exec backend node scripts/import-backgrounds.js
docker-compose exec backend node scripts/import-feats.js
docker-compose exec backend node scripts/import-items.js
```

### Monitoring

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Network info
docker network ls
docker network inspect dnd-network

# Volume info
docker volume ls
docker volume inspect dnd_postgres_data
```

### Troubleshooting

```bash
# Check container health
docker-compose ps
docker inspect dnd-backend --format='{{.State.Health.Status}}'

# Follow logs for errors
docker-compose logs -f --tail=100 backend

# Restart unhealthy container
docker-compose restart backend

# Force rebuild
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Clear all Docker cache
docker system prune -a
docker volume prune
```

---

## 🔧 Environment Variables

### Required in .env

```bash
POSTGRES_PASSWORD=change-this-strong-password
JWT_SECRET=at-least-32-characters-long-secret
```

### For Production Deployment

```bash
# Using IP address
FRONTEND_URL=http://192.168.1.100
BACKEND_URL=http://192.168.1.100:3001

# Using domain with SSL
DOMAIN_NAME=dnd.yourdomain.com
CERTBOT_EMAIL=you@example.com
FRONTEND_URL=https://dnd.yourdomain.com
BACKEND_URL=https://dnd.yourdomain.com
```

---

## 🐛 Common Issues & Fixes

### "Port already in use"

```bash
# Find what's using the port
netstat -tulpn | grep 3000

# Kill the process
kill -9 PID

# Or change port in docker-compose.yml
ports:
  - '8080:80'  # Instead of 3000:80
```

### "Database connection failed"

```bash
# Check database is running
docker-compose ps database

# Check logs
docker-compose logs database

# Recreate database
docker-compose down
docker-compose up -d database
sleep 10  # Wait for it to start
docker-compose up -d
```

### "Frontend can't connect to backend"

```bash
# Check VITE_API_URL was set during build
docker-compose logs frontend | grep VITE

# Rebuild with correct env
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### "Container keeps restarting"

```bash
# See why it's failing
docker-compose logs backend --tail=50

# Common causes:
# - Database not ready (wait longer)
# - Missing environment variables
# - Port conflict
# - Out of memory

# Check resources
docker stats
```

### "Out of disk space"

```bash
# Check disk usage
df -h
docker system df

# Clean up
docker system prune -a
docker volume prune
```

---

## 📊 Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Frontend health
curl http://localhost:3000/health

# Database health
docker-compose exec database pg_isready -U dnd_user

# All services
docker-compose ps
```

---

## 🔒 Security Checklist

- [ ] Changed POSTGRES_PASSWORD in .env
- [ ] Changed JWT_SECRET in .env (32+ chars)
- [ ] Configured firewall (ufw)
- [ ] Disabled root SSH (if public)
- [ ] Set up SSL for production
- [ ] Regular database backups
- [ ] Update Docker regularly: `apt update && apt upgrade`

---

## 🎯 Performance Tuning

### Low Memory LXC (< 2GB RAM)

Add to docker-compose.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M

  frontend:
    deploy:
      resources:
        limits:
          memory: 256M
```

### Optimize Database

```bash
# Connect to database
docker-compose exec database psql -U dnd_user dnd_character_sheet

# Run VACUUM
VACUUM ANALYZE;

# Check database size
SELECT pg_size_pretty(pg_database_size('dnd_character_sheet'));
```

---

## 📦 Backup Strategy

### Automated Daily Backup

```bash
# Create backup script
cat > /opt/dnd/backup.sh << 'EOF'
#!/bin/bash
cd /opt/dnd
docker-compose exec -T database pg_dump -U dnd_user dnd_character_sheet > /opt/backups/dnd-$(date +\%Y\%m\%d).sql
find /opt/backups -name "dnd-*.sql" -mtime +7 -delete
EOF

chmod +x /opt/dnd/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/dnd/backup.sh
```

---

## 🔄 Update Process

```bash
# On Mac - make changes, then:
cd ~/Documents/coding/projects/theasdm-charactersheet
tar --exclude='node_modules' --exclude='dist' --exclude='build' --exclude='.git' -czf ~/dnd-update.tar.gz .
scp ~/dnd-update.tar.gz root@LXC_IP:/root/

# On LXC:
cd /opt/dnd
docker-compose down
tar -xzf ~/dnd-update.tar.gz
docker-compose build
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

Or use the deploy script:

```bash
./deploy.sh  # Choose option 2 (Update)
```

---

## 📱 Access URLs

- Frontend: `http://LXC_IP:3000`
- Backend API: `http://LXC_IP:3001/api`
- Backend Health: `http://LXC_IP:3001/health`
- Database: `postgresql://dnd_user:password@LXC_IP:5432/dnd_character_sheet`

---

## 🆘 Emergency Recovery

### Complete Reset

```bash
cd /opt/dnd
docker-compose down -v
docker system prune -a -f
./deploy.sh  # Choose 1 (Fresh deployment)
./deploy.sh  # Choose 3 (Import data)
```

### Restore from Backup

```bash
# Stop services
docker-compose down

# Start only database
docker-compose up -d database
sleep 10

# Restore
cat backup-20250930.sql | docker-compose exec -T database psql -U dnd_user dnd_character_sheet

# Start everything
docker-compose up -d
```
