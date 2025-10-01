# Quick Deployment Guide - Mac to Proxmox LXC

## TL;DR - Fastest Way to Deploy

### 1. On Your Mac - Prepare the Code

```bash
cd /Users/dustinamodeo/Documents/coding/projects/theasdm-charactersheet

# Create tarball (excludes node_modules, git, etc)
tar --exclude='node_modules' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.git' \
    --exclude='frontend/dist' \
    --exclude='backend/dist' \
    --exclude='postgres_data' \
    -czf dnd-deploy.tar.gz .

# Copy .env.example to create your production .env
cp .env.example .env

# Edit .env with production values
# IMPORTANT: Change POSTGRES_PASSWORD and JWT_SECRET!
nano .env
```

### 2. On Proxmox - Create Ubuntu LXC

```bash
# SSH to Proxmox host
ssh root@your-proxmox-host

# Create Ubuntu 22.04 LXC (adjust ID 100 if needed)
pct create 100 local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
  --hostname dnd-app \
  --memory 2048 \
  --cores 2 \
  --rootfs local-lvm:20 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --password your-password \
  --unprivileged 0

# Start container
pct start 100

# Get container IP
pct exec 100 -- ip addr show eth0 | grep "inet "

# Note the IP address (e.g., 192.168.1.100)
```

### 3. Transfer Files from Mac to LXC

```bash
# On your Mac - SCP the tarball
scp dnd-deploy.tar.gz root@YOUR_LXC_IP:/root/

# Also send your .env file
scp .env root@YOUR_LXC_IP:/root/
```

### 4. On LXC - Install Docker & Deploy

```bash
# SSH into LXC
ssh root@YOUR_LXC_IP

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt update && apt install docker-compose -y

# Extract application
mkdir -p /opt/dnd-charactersheet
cd /opt/dnd-charactersheet
tar -xzf /root/dnd-deploy.tar.gz
mv /root/.env .

# Make deploy script executable
chmod +x deploy.sh

# Deploy!
./deploy.sh
# Choose option 1 (Fresh deployment)

# After deployment completes, import D&D data
./deploy.sh
# Choose option 3 (Initialize database)
```

### 5. Access Your Application

```
Frontend: http://YOUR_LXC_IP:3000
Backend:  http://YOUR_LXC_IP:3001/api
```

## Environment Variables Quick Reference

Edit `.env` before deploying:

```bash
# REQUIRED - Change these!
POSTGRES_PASSWORD=your-strong-password-here
JWT_SECRET=at-least-32-characters-long-secret-key-here

# If using domain (optional)
DOMAIN_NAME=dnd.yourdomain.com
CERTBOT_EMAIL=you@example.com

# If using IP address (default)
FRONTEND_URL=http://YOUR_LXC_IP
BACKEND_URL=http://YOUR_LXC_IP:3001
```

## Common Commands

```bash
cd /opt/dnd-charactersheet

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Update (if you change code)
./deploy.sh  # Choose option 2

# Backup database
./deploy.sh  # Choose option 4
```

## Firewall Setup (Optional but Recommended)

```bash
# On LXC container
apt install ufw -y

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Or just allow specific ports
ufw allow 3000/tcp  # Frontend
ufw allow 3001/tcp  # Backend

# Enable firewall
ufw enable
```

## Troubleshooting

### Can't connect to frontend

```bash
# Check if container is running
docker-compose ps

# Check frontend logs
docker-compose logs frontend

# Restart frontend
docker-compose restart frontend
```

### Backend API errors

```bash
# Check backend logs
docker-compose logs backend

# Check environment variables
docker-compose exec backend env | grep DATABASE_URL

# Restart backend
docker-compose restart backend
```

### Database issues

```bash
# Check database is running
docker-compose ps database

# Test database connection
docker-compose exec database psql -U dnd_user -d dnd_character_sheet -c "SELECT 1;"

# View database logs
docker-compose logs database
```

### Port already in use

```bash
# Check what's using the port
netstat -tulpn | grep 3000

# Kill the process or change port in docker-compose.yml
# Edit ports section, e.g., '8080:80' instead of '3000:80'
```

## Performance Tips for Low-Resource LXC

If your LXC has limited RAM (< 2GB):

1. **Edit docker-compose.yml** to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

2. **Reduce database connections** in backend:

```yaml
backend:
  environment:
    DATABASE_POOL_SIZE: 5
```

3. **Enable swap** in LXC (on Proxmox host):

```bash
pct set 100 --swap 2048
```

## Auto-Start on Boot

Already configured! All services have `restart: unless-stopped` in docker-compose.yml.

Just make sure Docker starts on boot:

```bash
systemctl enable docker
```

## Next Steps

1. Test character creation
2. Set up automated database backups (cron job)
3. Configure domain name and SSL (see DEPLOYMENT.md)
4. Set up monitoring
5. Create admin user in application

## Full Documentation

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete documentation including:
- SSL/HTTPS setup
- Domain configuration
- Advanced troubleshooting
- Performance tuning
- Security hardening
