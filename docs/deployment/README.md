# Deployment Guide

This guide covers deploying the D&D Character Sheet Generator to various environments.

## 🐳 Docker Deployment (Recommended)

### Production Deployment

1. **Server Prerequisites**

   - Docker 20.10+ and Docker Compose 2.0+
   - 2GB+ RAM, 20GB+ disk space
   - Domain name pointing to your server
   - Ports 80 and 443 open

2. **Initial Setup**

   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd theasdm-charactersheet

   # Configure environment
   cp .env.example .env
   nano .env
   ```

3. **Environment Configuration**

   ```env
   # Database
   POSTGRES_PASSWORD=your-ultra-secure-password-here

   # Security
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

   # Domain and SSL
   DOMAIN_NAME=your-domain.com
   CERTBOT_EMAIL=admin@your-domain.com

   # Discord
   DISCORD_TOKEN=your-discord-bot-token
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_GUILD_ID=your-discord-server-id

   # URLs
   FRONTEND_URL=https://your-domain.com
   BACKEND_URL=https://your-domain.com
   ```

4. **Deploy Services**

   ```bash
   # Start all services
   docker-compose up -d

   # Check service status
   docker-compose ps

   # View logs
   docker-compose logs -f
   ```

5. **Initialize Database**

   ```bash
   # Run migrations
   docker-compose exec backend npx prisma migrate deploy

   # Seed initial data
   docker-compose exec backend npm run seed
   ```

6. **SSL Certificate Setup**

   ```bash
   # Generate SSL certificate
   docker-compose run --rm certbot

   # Update nginx config for HTTPS
   # Uncomment HTTPS server block in docker/nginx/conf.d/default.conf

   # Restart nginx
   docker-compose restart nginx
   ```

### Development Deployment

For development or testing environments:

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up -d
```

## 🏠 Homelab Deployment

### Hardware Requirements

**Minimum:**

- CPU: 2 cores
- RAM: 2GB
- Storage: 20GB SSD
- Network: 100Mbps

**Recommended:**

- CPU: 4 cores
- RAM: 4GB
- Storage: 50GB SSD
- Network: 1Gbps

### Popular Homelab Platforms

#### Proxmox

```bash
# Create LXC container
pct create 100 ubuntu-22.04-standard_22.04-1_amd64.tar.xz \
  --hostname dnd-character-sheet \
  --memory 2048 \
  --cores 2 \
  --storage local-lvm:20

# Install Docker in container
pct exec 100 -- bash -c "curl -fsSL https://get.docker.com | sh"
```

#### Portainer

1. Add stack in Portainer
2. Copy `docker-compose.yml` content
3. Set environment variables
4. Deploy stack

#### TrueNAS Scale

1. Install from TrueNAS Apps
2. Configure using web UI
3. Mount datasets for persistent storage

### Reverse Proxy Setup

If using external reverse proxy (Traefik, Nginx Proxy Manager):

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  nginx:
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.dnd-app.rule=Host(`dnd.yourdomain.com`)'
      - 'traefik.http.routers.dnd-app.tls.certresolver=letsencrypt'
```

## ☁️ Cloud Deployment

### DigitalOcean Droplet

1. **Create Droplet**

   - Ubuntu 22.04
   - 2GB RAM, 1 CPU
   - Add your SSH key

2. **Setup Docker**

   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Deploy Application**
   ```bash
   git clone <repo-url>
   cd theasdm-charactersheet
   cp .env.example .env
   # Edit .env with your values
   docker-compose up -d
   ```

### AWS EC2

Use similar steps as DigitalOcean, but ensure:

- Security groups allow ports 80, 443, 22
- Use Elastic IP for consistent domain pointing
- Consider RDS for managed PostgreSQL

### Google Cloud Platform

1. **Create VM Instance**

   ```bash
   gcloud compute instances create dnd-character-sheet \
     --image-family=ubuntu-2204-lts \
     --image-project=ubuntu-os-cloud \
     --machine-type=e2-medium \
     --tags=http-server,https-server
   ```

2. **Configure Firewall**

   ```bash
   gcloud compute firewall-rules create allow-http \
     --allow tcp:80 --target-tags http-server

   gcloud compute firewall-rules create allow-https \
     --allow tcp:443 --target-tags https-server
   ```

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose build --no-cache
docker-compose up -d

# Run any new migrations
docker-compose exec backend npx prisma migrate deploy
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

# Database backup
docker-compose exec -T database pg_dump -U dnd_user dnd_character_sheet | gzip > "backup-$(date +%Y%m%d-%H%M%S).sql.gz"

# File backup
tar -czf "files-backup-$(date +%Y%m%d-%H%M%S).tar.gz" backend/uploads
```

### Monitoring

#### Health Checks

```bash
# Check service health
docker-compose ps
curl -f http://localhost/health
curl -f http://localhost:3001/health
```

#### Log Management

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f discord-bot

# Log rotation
echo "daily
missingok
rotate 52
compress
delaycompress
copytruncate" | sudo tee /etc/logrotate.d/dnd-character-sheet
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting services
sudo systemctl stop apache2
sudo systemctl stop nginx
```

#### Database Connection Issues

```bash
# Check database container
docker-compose logs database

# Reset database
docker-compose down
docker volume rm theasdm-charactersheet_postgres_data
docker-compose up -d database
```

#### SSL Certificate Issues

```bash
# Check certificate status
docker-compose exec nginx nginx -t

# Renew certificate
docker-compose run --rm certbot renew

# Restart nginx
docker-compose restart nginx
```

#### Memory Issues

```bash
# Check memory usage
docker stats

# Increase swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Performance Optimization

#### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_characters_updated_at ON characters(updated_at);
CREATE INDEX CONCURRENTLY idx_spells_level_school ON spells(level, school);

-- Analyze table statistics
ANALYZE characters;
ANALYZE spells;
```

#### Nginx Optimization

```nginx
# In nginx.conf
worker_processes auto;
worker_connections 4096;

# Enable gzip compression
gzip_comp_level 6;
gzip_types text/css application/javascript application/json;

# Browser caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔒 Security Hardening

### System Security

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### Application Security

```bash
# Run security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image theasdm-charactersheet_backend

# Update dependencies
docker-compose exec backend npm audit fix
docker-compose exec frontend npm audit fix
```

### Monitoring and Alerting

Consider integrating:

- **Prometheus + Grafana** for metrics
- **Loki** for log aggregation
- **Uptime Kuma** for service monitoring
- **Fail2ban** for intrusion prevention

---

For additional deployment questions, check our [FAQ](../faq.md) or open an issue on GitHub.
