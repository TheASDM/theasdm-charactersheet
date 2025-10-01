#!/bin/bash
# Smart Update Script for Containerized D&D Character Sheet
# This script handles updates safely with rollback capability

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔄 D&D Character Sheet Update Script${NC}"
echo "========================================"

# Check if we're in the right directory
if [ ! -f docker-compose.yml ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

# Backup current state
echo -e "${YELLOW}📦 Creating backup of current state...${NC}"
BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database
echo "Backing up database..."
docker-compose exec -T database pg_dump -U dnd_user dnd_character_sheet > "$BACKUP_DIR/database.sql"

# Backup current code (in case we need to rollback)
echo "Backing up current code..."
tar -czf "$BACKUP_DIR/code-backup.tar.gz" \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.git' \
    --exclude='postgres_data' \
    --exclude='backups' \
    .

echo -e "${GREEN}✅ Backup created at: $BACKUP_DIR${NC}"

# Ask for confirmation
echo ""
echo "Update methods:"
echo "  1) Git pull (if using Git)"
echo "  2) Use uploaded tarball"
echo "  3) Skip code update (just rebuild containers)"
read -p "Choose update method [1-3]: " method

case $method in
    1)
        echo -e "${YELLOW}📥 Pulling latest code from Git...${NC}"
        if [ -d .git ]; then
            git pull
        else
            echo -e "${RED}❌ Not a git repository${NC}"
            exit 1
        fi
        ;;
    2)
        echo -e "${YELLOW}📥 Extracting uploaded tarball...${NC}"
        if [ -f /root/dnd-update.tar.gz ]; then
            tar -xzf /root/dnd-update.tar.gz
            echo -e "${GREEN}✅ Tarball extracted${NC}"
        else
            echo -e "${RED}❌ Tarball not found at /root/dnd-update.tar.gz${NC}"
            exit 1
        fi
        ;;
    3)
        echo -e "${YELLOW}⏭️  Skipping code update${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Stop services gracefully
echo -e "${YELLOW}⏸️  Stopping services...${NC}"
docker-compose down

# Rebuild containers
echo -e "${YELLOW}🔨 Rebuilding containers...${NC}"
docker-compose build

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check health
echo -e "${YELLOW}🏥 Checking service health...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running${NC}"
else
    echo -e "${RED}❌ Some services failed to start${NC}"
    echo "Showing logs:"
    docker-compose logs --tail=50

    read -p "Rollback to previous version? (y/n): " rollback
    if [ "$rollback" == "y" ]; then
        echo -e "${YELLOW}🔙 Rolling back...${NC}"
        docker-compose down
        tar -xzf "$BACKUP_DIR/code-backup.tar.gz"
        docker-compose build
        docker-compose up -d
        echo -e "${GREEN}✅ Rolled back to previous version${NC}"
    fi
    exit 1
fi

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
docker-compose exec backend npx prisma migrate deploy || {
    echo -e "${RED}❌ Migration failed${NC}"
    read -p "Continue anyway? (y/n): " continue
    if [ "$continue" != "y" ]; then
        exit 1
    fi
}

# Health check endpoints
echo -e "${YELLOW}🔍 Testing endpoints...${NC}"
sleep 5

if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

# Show status
echo ""
echo -e "${GREEN}📊 Current Status:${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}✅ Update complete!${NC}"
echo ""
echo "Backup location: $BACKUP_DIR"
echo "View logs: docker-compose logs -f"
echo "Rollback command: tar -xzf $BACKUP_DIR/code-backup.tar.gz && docker-compose build && docker-compose up -d"
