#!/bin/bash

echo "==================================="
echo "PostgreSQL 15 → 16 Upgrade Script"
echo "==================================="
echo ""

# Navigate to project directory
cd ~/my-apps/theasdm-charactersheet

echo "⚠️  This will upgrade PostgreSQL from 15 to 16"
echo "⚠️  Your data will be backed up first"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Creating backup..."
mkdir -p backups
BACKUP_FILE="backups/wtforge_backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec wtforge-postgres pg_dump -U wtforge wtforge > $BACKUP_FILE
gzip $BACKUP_FILE
echo "✅ Backup created: ${BACKUP_FILE}.gz"
echo ""

echo "Step 2: Stopping containers..."
docker-compose down
echo "✅ Containers stopped"
echo ""

echo "Step 3: Backing up and removing old PostgreSQL 15 data volume..."
docker volume ls | grep postgres_data
docker run --rm -v theasdm-charactersheet_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres_data_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
docker volume rm theasdm-charactersheet_postgres_data
echo "✅ Old data volume removed and backed up"
echo ""

echo "Step 4: Updating docker-compose.yml to PostgreSQL 16..."
sed -i 's/postgres:15/postgres:16/' docker-compose.yml
echo "✅ docker-compose.yml updated"
echo ""

echo "Step 5: Starting PostgreSQL 16 with fresh volume..."
docker-compose up -d postgres
echo "⏳ Waiting for PostgreSQL 16 to initialize (20 seconds)..."
sleep 20
echo "✅ PostgreSQL 16 started"
echo ""

echo "Step 6: Restoring data from backup..."
gunzip -c ${BACKUP_FILE}.gz | docker exec -i wtforge-postgres psql -U wtforge wtforge
echo "✅ Data restored"
echo ""

echo "Step 7: Restarting all containers..."
docker-compose down
docker-compose up -d
echo "✅ All containers restarted"
echo ""

echo "Step 8: Verifying..."
docker exec wtforge-postgres psql -U wtforge -d wtforge -c "SELECT version();"
docker exec wtforge-postgres psql -U wtforge -d wtforge -c "SELECT COUNT(*) as spell_count FROM spells;"
echo ""

echo "==================================="
echo "✅ Upgrade Complete!"
echo "==================================="
echo ""
echo "Backups created:"
echo "  - ${BACKUP_FILE}.gz (SQL dump)"
echo "  - backups/postgres_data_backup_*.tar.gz (volume backup)"
echo ""
echo "PostgreSQL is now running version 16 with performance tuning enabled!"
echo ""
