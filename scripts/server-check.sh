#!/bin/bash

echo "==================================="
echo "Server Environment Check"
echo "==================================="
echo ""

echo "📦 System Info:"
echo "OS: $(uname -s)"
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo ""

echo "🐧 Distribution:"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "$NAME $VERSION"
else
    echo "Unknown"
fi
echo ""

echo "🐳 Docker:"
docker --version 2>/dev/null || echo "Docker not found"
docker compose version 2>/dev/null || echo "Docker Compose not found"
echo ""

echo "📦 Node.js (system):"
node --version 2>/dev/null || echo "Node.js not found"
npm --version 2>/dev/null || echo "npm not found"
echo ""

echo "📦 Node.js (in container):"
docker exec wtforge-app node --version 2>/dev/null || echo "Container not running"
echo ""

echo "💾 Disk Space:"
df -h / | tail -1
echo ""

echo "💾 Memory:"
free -h | grep Mem
echo ""

echo "🔧 PostgreSQL:"
docker exec wtforge-postgres psql -U wtforge -d wtforge -c "SELECT version();" 2>/dev/null | head -3 || echo "PostgreSQL not accessible"
echo ""

echo "🌐 Nginx/Reverse Proxy:"
nginx -v 2>&1 || echo "Nginx not found"
echo ""

echo "🔐 TLS/SSL:"
openssl version
echo ""

echo "📊 Running Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "==================================="
echo "Recommendations will follow..."
echo "==================================="
