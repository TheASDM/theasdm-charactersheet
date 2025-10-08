# Linux Server Optimization Guide

## Prerequisites Check

Run the diagnostic script first:
```bash
chmod +x scripts/server-check.sh
./scripts/server-check.sh
```

## 1. Update Node.js to Latest LTS (v20)

Your Dockerfile uses Node 20, but make sure your system Node (if you use it) is also updated:

```bash
# Install/Update Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
```

## 2. Update Docker & Docker Compose

```bash
# Update Docker to latest
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify
docker --version
docker compose version
```

## 3. Optimize Docker Configuration

### Enable BuildKit (faster builds)

Add to `/etc/docker/daemon.json`:
```json
{
  "features": {
    "buildkit": true
  },
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```

Then restart Docker:
```bash
sudo systemctl restart docker
```

### Prune old images/containers regularly

```bash
# Add to crontab (runs weekly)
0 3 * * 0 docker system prune -af --volumes
```

## 4. PostgreSQL Optimization

Update your `docker-compose.yml` PostgreSQL service with these settings:

```yaml
postgres:
  image: postgres:16  # Latest stable
  environment:
    POSTGRES_DB: wtforge
    POSTGRES_USER: wtforge
    POSTGRES_PASSWORD: wtforge
    # Performance tuning
    POSTGRES_INITDB_ARGS: "-E UTF8 --locale=en_US.UTF-8"
  command: >
    postgres
    -c shared_buffers=256MB
    -c max_connections=200
    -c effective_cache_size=1GB
    -c maintenance_work_mem=64MB
    -c checkpoint_completion_target=0.9
    -c wal_buffers=16MB
    -c default_statistics_target=100
    -c random_page_cost=1.1
    -c effective_io_concurrency=200
    -c work_mem=1310kB
    -c min_wal_size=1GB
    -c max_wal_size=4GB
```

## 5. Nginx/Reverse Proxy Headers

Make sure your reverse proxy (Nginx Proxy Manager or Caddy) has these headers:

```nginx
# Compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

# Caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

## 6. Enable HTTP/2 and HTTP/3

If using Nginx:
```nginx
listen 443 ssl http2;
listen [::]:443 ssl http2;

# Optional HTTP/3 (QUIC)
listen 443 quic reuseport;
listen [::]:443 quic reuseport;
add_header Alt-Svc 'h3=":443"; ma=86400';
```

## 7. System-Level Optimizations

### Increase file limits for Node.js

Add to `/etc/security/limits.conf`:
```
* soft nofile 65536
* hard nofile 65536
```

### Enable TCP BBR congestion control (faster networking)

```bash
echo "net.core.default_qdisc=fq" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Increase swap if low RAM

```bash
# Check current swap
free -h

# If less than 2GB swap, add more
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 8. Enable Unattended Security Updates

```bash
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## 9. Set Up Log Rotation

Create `/etc/logrotate.d/wtforge`:
```
/var/log/wtforge/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
```

## 10. Monitoring Setup (Optional but Recommended)

### Simple monitoring with Docker stats

```bash
# Add to crontab
*/5 * * * * docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" > /var/log/docker-stats.log
```

### Or install Portainer for GUI monitoring

```bash
docker volume create portainer_data
docker run -d -p 9443:9443 --name portainer --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v portainer_data:/data \
    portainer/portainer-ce:latest
```

Access at: `https://your-server:9443`

## 11. Application-Specific Optimizations

### Re-enable CSP (after styled-components is stable)

In `backend/src/server.ts`, update to:
```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  })
);
```

### Tighten CORS

In `backend/src/server.ts`, update to:
```typescript
app.use(
  cors({
    origin: [
      'https://dnd.raptornet.dev',
      'http://localhost:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);
```

## 12. Backup Strategy

Create automated backups:

```bash
#!/bin/bash
# /root/backup-wtforge.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/wtforge"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec wtforge-postgres pg_dump -U wtforge wtforge | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Add to crontab:
```bash
0 2 * * * /root/backup-wtforge.sh
```

## 13. Performance Testing

After applying optimizations, test:

```bash
# Test frontend load time
curl -w "@curl-format.txt" -o /dev/null -s https://dnd.raptornet.dev

# Create curl-format.txt:
echo "
    time_namelookup:  %{time_namelookup}
       time_connect:  %{time_connect}
    time_appconnect:  %{time_appconnect}
   time_pretransfer:  %{time_pretransfer}
      time_redirect:  %{time_redirect}
 time_starttransfer:  %{time_starttransfer}
                    ----------
         time_total:  %{time_total}
" > curl-format.txt
```

## Quick Start Checklist

- [ ] Update Node.js to v20 LTS
- [ ] Update Docker & Docker Compose
- [ ] Enable Docker BuildKit
- [ ] Upgrade PostgreSQL to v16
- [ ] Configure Nginx headers (compression, caching, security)
- [ ] Enable HTTP/2
- [ ] Increase file limits
- [ ] Enable TCP BBR
- [ ] Set up unattended security updates
- [ ] Configure log rotation
- [ ] Set up automated backups
- [ ] Re-enable CSP and tighten CORS
- [ ] Test performance

## Estimated Performance Gains

- **40-60% faster Docker builds** (BuildKit + caching)
- **30-50% faster page loads** (HTTP/2 + compression + caching)
- **20-30% better database performance** (PostgreSQL tuning)
- **10-20% faster network** (TCP BBR)

Total expected improvement: **2-3x faster** overall experience.
