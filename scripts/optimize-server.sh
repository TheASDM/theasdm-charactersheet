#!/bin/bash

# WTForge Server Optimization Script
# Run with: sudo ./scripts/optimize-server.sh

set -e

echo "==================================="
echo "WTForge Server Optimization"
echo "==================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (sudo ./scripts/optimize-server.sh)"
    exit 1
fi

echo "✅ Running as root"
echo ""

# 1. Update system
echo "📦 Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
echo "✅ System updated"
echo ""

# 2. Install/Update Node.js
echo "📦 Installing/Updating Node.js v20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo "Upgrading Node.js from v$NODE_VERSION to v20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    else
        echo "Node.js already up to date: $(node --version)"
    fi
fi
echo "✅ Node.js: $(node --version)"
echo ""

# 3. Update Docker
echo "🐳 Updating Docker..."
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -qq
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
echo "✅ Docker: $(docker --version)"
echo ""

# 4. Configure Docker daemon
echo "🐳 Configuring Docker daemon..."
cat > /etc/docker/daemon.json <<'EOF'
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
EOF
systemctl restart docker
echo "✅ Docker daemon configured"
echo ""

# 5. Increase file limits
echo "📁 Increasing file limits..."
if ! grep -q "nofile 65536" /etc/security/limits.conf; then
    echo "* soft nofile 65536" >> /etc/security/limits.conf
    echo "* hard nofile 65536" >> /etc/security/limits.conf
    echo "✅ File limits increased"
else
    echo "✅ File limits already configured"
fi
echo ""

# 6. Enable TCP BBR
echo "🌐 Enabling TCP BBR congestion control..."
if ! grep -q "net.core.default_qdisc=fq" /etc/sysctl.conf; then
    echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
    echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf
    sysctl -p
    echo "✅ TCP BBR enabled"
else
    echo "✅ TCP BBR already enabled"
fi
echo ""

# 7. Enable unattended security updates
echo "🔒 Enabling unattended security updates..."
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
echo "✅ Unattended upgrades enabled"
echo ""

# 8. Set up log rotation
echo "📋 Setting up log rotation..."
mkdir -p /var/log/wtforge
cat > /etc/logrotate.d/wtforge <<'EOF'
/var/log/wtforge/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
EOF
echo "✅ Log rotation configured"
echo ""

# 9. Create backup script
echo "💾 Creating backup script..."
mkdir -p /backup/wtforge
cat > /root/backup-wtforge.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/wtforge"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec wtforge-postgres pg_dump -U wtforge wtforge | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF
chmod +x /root/backup-wtforge.sh

# Add to crontab
(crontab -l 2>/dev/null | grep -v backup-wtforge.sh; echo "0 2 * * * /root/backup-wtforge.sh") | crontab -
echo "✅ Backup script created and scheduled (daily at 2 AM)"
echo ""

# 10. Add Docker cleanup cron
echo "🧹 Setting up Docker cleanup..."
(crontab -l 2>/dev/null | grep -v "docker system prune"; echo "0 3 * * 0 docker system prune -af --volumes") | crontab -
echo "✅ Docker cleanup scheduled (weekly on Sunday at 3 AM)"
echo ""

# 11. Check swap
echo "💾 Checking swap space..."
SWAP=$(free -h | grep Swap | awk '{print $2}')
if [[ "$SWAP" == "0B" ]] || [[ "$SWAP" == "0" ]]; then
    echo "Creating 4GB swap file..."
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo "✅ Swap created: 4GB"
else
    echo "✅ Swap already configured: $SWAP"
fi
echo ""

# 12. Summary
echo "==================================="
echo "✅ Optimization Complete!"
echo "==================================="
echo ""
echo "Applied optimizations:"
echo "  ✅ System packages updated"
echo "  ✅ Node.js v20 installed"
echo "  ✅ Docker updated with BuildKit"
echo "  ✅ File limits increased (65536)"
echo "  ✅ TCP BBR enabled"
echo "  ✅ Unattended security updates enabled"
echo "  ✅ Log rotation configured"
echo "  ✅ Daily backups scheduled"
echo "  ✅ Weekly Docker cleanup scheduled"
echo "  ✅ Swap configured"
echo ""
echo "⚠️  You may need to log out and back in for file limit changes to take effect"
echo ""
echo "Next steps:"
echo "  1. Review docs/SERVER_OPTIMIZATION.md for additional optimizations"
echo "  2. Update your docker-compose.yml with PostgreSQL tuning"
echo "  3. Configure your reverse proxy (Nginx/Caddy) headers"
echo "  4. Re-enable CSP and tighten CORS in backend/src/server.ts"
echo ""
