#!/bin/bash

echo "==================================="
echo "PostgreSQL Recovery Script"
echo "==================================="
echo ""

cd ~/my-apps/theasdm-charactersheet

echo "Current situation: PostgreSQL 15 data exists but docker-compose.yml is set to PostgreSQL 16"
echo ""
echo "Choose recovery option:"
echo "  1) Rollback to PostgreSQL 15 (keep existing data, no downtime)"
echo "  2) Upgrade to PostgreSQL 16 (restore from backup)"
echo ""
read -p "Enter choice (1 or 2): " CHOICE

if [ "$CHOICE" = "1" ]; then
    echo ""
    echo "Rolling back to PostgreSQL 15..."

    # Update docker-compose.yml back to postgres:15
    sed -i 's/postgres:16/postgres:15/' docker-compose.yml

    # Start containers
    docker-compose up -d

    echo ""
    echo "✅ Rolled back to PostgreSQL 15"
    echo "Your data is intact and the app should be running."
    echo ""
    echo "To upgrade to PostgreSQL 16 later, run: ./scripts/upgrade-postgres.sh"

elif [ "$CHOICE" = "2" ]; then
    echo ""
    echo "Checking for backup files..."

    if [ ! -d "backups" ] || [ -z "$(ls -A backups/*.sql.gz 2>/dev/null)" ]; then
        echo "❌ No backup files found in backups/"
        echo ""
        echo "Options:"
        echo "  1) Rollback to PostgreSQL 15 (run this script again and choose option 1)"
        echo "  2) Start fresh with PostgreSQL 16 (you'll lose existing data)"
        echo ""
        read -p "Start fresh with PostgreSQL 16? This will DELETE all data! (yes/no): " CONFIRM

        if [ "$CONFIRM" != "yes" ]; then
            echo "Aborted. Run this script again and choose option 1 to rollback."
            exit 1
        fi

        echo ""
        echo "Starting fresh with PostgreSQL 16..."

        # Stop containers
        docker-compose down

        # Remove the old volume
        docker volume rm theasdm-charactersheet_postgres_data 2>/dev/null || true

        # Start PostgreSQL 16
        docker-compose up -d

        echo ""
        echo "✅ PostgreSQL 16 started fresh"
        echo "⚠️  Database is empty - the app will seed reference data on startup"
        echo ""
        echo "Check logs: docker logs wtforge-app"

    else
        echo "Found backup files:"
        ls -lh backups/*.sql.gz
        echo ""

        # Get the most recent backup
        BACKUP_FILE=$(ls -t backups/*.sql.gz | head -1)
        echo "Using most recent backup: $BACKUP_FILE"
        echo ""

        read -p "Continue with restore? (y/n): " -n 1 -r
        echo

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 1
        fi

        # Stop containers
        docker-compose down

        # Remove old volume
        docker volume rm theasdm-charactersheet_postgres_data

        # Start PostgreSQL 16
        docker-compose up -d postgres

        echo "⏳ Waiting for PostgreSQL 16 to initialize (30 seconds)..."
        sleep 30

        # Restore backup
        echo "Restoring from backup..."
        gunzip -c "$BACKUP_FILE" | docker exec -i wtforge-postgres psql -U wtforge wtforge

        # Restart all containers
        docker-compose down
        docker-compose up -d

        echo ""
        echo "✅ PostgreSQL 16 upgrade complete!"
        echo ""
        echo "Verifying..."
        docker exec wtforge-postgres psql -U wtforge -d wtforge -c "SELECT version();"
        docker exec wtforge-postgres psql -U wtforge -d wtforge -c "SELECT COUNT(*) FROM spells;"
    fi
else
    echo "Invalid choice. Aborted."
    exit 1
fi

echo ""
echo "==================================="
