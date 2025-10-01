# Docker Deployment Guide for Proxmox LXC

This guide walks you through deploying the D&D Character Sheet application to a Proxmox LXC container using Docker.

## Prerequisites

### On Your Mac (Development Machine)
- Git installed
- Docker Desktop (for testing builds locally - optional)

### On Proxmox LXC Container
- Docker and Docker Compose installed
- At least 2GB RAM allocated
- 10GB storage (20GB+ recommended for database growth)
- Open ports: 80, 443, 3000, 3001, 5432 (or configure as needed)

## Quick Start - From Mac to Proxmox

### 1. Prepare Your Code on Mac

```bash
# Navigate to project directory
cd /Users/dustinamodeo/Documents/coding/projects/theasdm-charactersheet

# Create production environment file
cp .env.example .env

# Edit .env with your production values
nano .env
```

### 2. Set Up Proxmox LXC Container

SSH into your Proxmox host and create an LXC container:

```bash
# Example: Create Ubuntu 22.04 LXC
pct create 100 local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
  --hostname dnd-charactersheet \
  --memory 2048 \
  --cores 2 \
  --storage local-lvm \
  --rootfs local-lvm:20 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --password your-password

# Start the container
pct start 100

# Enter the container
pct enter 100
```

### 3. Install Docker in LXC Container

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version

# Install git
apt install git -y
```

### 4. Transfer Code to LXC Container

**Option A: Using Git (Recommended)**
```bash
# On LXC container
cd /opt
git clone https://github.com/yourusername/theasdm-charactersheet.git
cd theasdm-charactersheet
```

**Option B: Using SCP from Mac**
```bash
# On your Mac
cd /Users/dustinamodeo/Documents/coding/projects/theasdm-charactersheet

# Create a tarball excluding node_modules and other large files
tar --exclude='node_modules' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.git' \
    --exclude='postgres_data' \
    -czf dnd-app.tar.gz .

# Copy to LXC container (replace with your LXC IP)
scp dnd-app.tar.gz root@YOUR_LXC_IP:/opt/

# On LXC container
cd /opt
tar -xzf dnd-app.tar.gz
rm dnd-app.tar.gz
```

### 5. Configure Environment Variables

```bash
# On LXC container
cd /opt/theasdm-charactersheet

# Copy and edit environment file
cp .env.example .env
nano .env
```

**Important .env values to set:**
```bash
# Database
POSTGRES_PASSWORD=your-strong-password-here

# Backend
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars

# URLs (use your domain or IP)
FRONTEND_URL=http://your-lxc-ip
BACKEND_URL=http://your-lxc-ip:3001

# Optional: For SSL with domain
DOMAIN_NAME=dnd.yourdomain.com
CERTBOT_EMAIL=you@example.com
```

### 6. Build and Start Services

```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 7. Initialize Database

```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database with D&D content
docker-compose exec backend node scripts/import-spells.js
docker-compose exec backend node scripts/import-species.js
docker-compose exec backend node scripts/import-classes.js
docker-compose exec backend node scripts/import-backgrounds.js
docker-compose exec backend node scripts/import-feats.js
docker-compose exec backend node scripts/import-items.js

# Verify database
docker-compose exec backend node scripts/test-database.js
```

## Production Configuration

### Using a Domain Name with SSL

1. **Update .env with your domain:**
```bash
DOMAIN_NAME=dnd.yourdomain.com
CERTBOT_EMAIL=your-email@example.com
FRONTEND_URL=https://dnd.yourdomain.com
BACKEND_URL=https://dnd.yourdomain.com
```

2. **Point your domain to LXC IP** (in your DNS provider)

3. **Get SSL certificate:**
```bash
docker-compose run --rm certbot
```

4. **Configure nginx** - Edit `docker/nginx/conf.d/default.conf`

### Reverse Proxy Setup (Optional)

If you already have nginx/traefik on your Proxmox host:

1. **Disable nginx service in docker-compose.yml**
2. **Configure your existing reverse proxy** to forward to:
   - Frontend: `http://lxc-ip:3000`
   - Backend API: `http://lxc-ip:3001`

## Simplified docker-compose.yml (No SSL)

For internal use without SSL/nginx, use this simplified version:

```bash
# Create docker-compose.override.yml
cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  frontend:
    ports:
      - '80:80'

  # Disable nginx and certbot
  nginx:
    profiles: ["disabled"]

  certbot:
    profiles: ["disabled"]
EOF

# Restart services
docker-compose down
docker-compose up -d
```

## Useful Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove all data (DANGER!)
docker-compose down -v

# Update application
git pull
docker-compose build
docker-compose up -d

# Backup database
docker-compose exec database pg_dump -U dnd_user dnd_character_sheet > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T database psql -U dnd_user dnd_character_sheet

# Shell into containers
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec database psql -U dnd_user dnd_character_sheet
```

## Monitoring and Maintenance

### Check Health Status
```bash
docker-compose ps
curl http://localhost:3001/health
```

### View Resource Usage
```bash
docker stats
```

### Database Maintenance
```bash
# Vacuum database
docker-compose exec database psql -U dnd_user dnd_character_sheet -c "VACUUM ANALYZE;"

# Check database size
docker-compose exec database psql -U dnd_user -c "SELECT pg_size_pretty(pg_database_size('dnd_character_sheet'));"
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend

# Check if port is in use
netstat -tulpn | grep 3001
```

### Database connection errors
```bash
# Verify database is healthy
docker-compose ps database

# Check database logs
docker-compose logs database

# Test connection
docker-compose exec database psql -U dnd_user -d dnd_character_sheet -c "SELECT 1;"
```

### Frontend can't connect to backend
```bash
# Check REACT_APP_API_URL in frontend container
docker-compose exec frontend env | grep REACT_APP

# Rebuild frontend with correct env
docker-compose up -d --build frontend
```

### Reset everything (fresh start)
```bash
docker-compose down -v
docker system prune -a
docker volume prune
docker-compose up -d --build
```

## Security Recommendations

1. **Change default passwords** in `.env`
2. **Use strong JWT_SECRET** (32+ characters)
3. **Configure firewall** to only expose needed ports
4. **Enable SSL** for production with real domain
5. **Regular backups** of database volume
6. **Keep Docker updated**: `apt update && apt upgrade`
7. **Monitor logs** for suspicious activity

## Performance Tuning

### For LXC with Limited Resources

Edit `docker-compose.yml` to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          memory: 256M
```

### Database Optimization

```bash
# Edit postgresql.conf in container
docker-compose exec database sh
# Then edit /var/lib/postgresql/data/postgresql.conf
# Increase shared_buffers, work_mem, etc.
```

## Accessing Your Application

- **Frontend**: `http://your-lxc-ip:3000`
- **Backend API**: `http://your-lxc-ip:3001/api`
- **API Health**: `http://your-lxc-ip:3001/health`

Or if using domain with SSL:
- **Application**: `https://dnd.yourdomain.com`

## Next Steps

1. Test the application thoroughly
2. Set up automated backups
3. Configure monitoring (Prometheus/Grafana)
4. Set up log aggregation
5. Create systemd service for auto-start on reboot

## Auto-Start on Boot

```bash
# Enable Docker to start on boot
systemctl enable docker

# Docker Compose will auto-restart containers with restart: unless-stopped
```
