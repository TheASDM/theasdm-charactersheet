#!/bin/bash
set -e

# D&D Character Sheet - Deployment Script
# This script automates the deployment process

echo "🎲 D&D Character Sheet Deployment Script"
echo "=========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Please install Docker first:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sh get-docker.sh"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose first:"
    echo "  apt install docker-compose"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose is installed${NC}"

echo ""
echo "Select deployment mode:"
echo "  1) Fresh deployment (first time)"
echo "  2) Update existing deployment"
echo "  3) Initialize database with D&D content"
echo "  4) Backup database"
echo "  5) Restore database"
echo "  6) View logs"
echo "  7) Stop services"
echo "  8) Full reset (DANGER - deletes all data)"
read -p "Enter choice [1-8]: " choice

case $choice in
    1)
        echo -e "${YELLOW}🚀 Starting fresh deployment...${NC}"

        # Build containers
        echo "Building Docker containers..."
        docker-compose build

        # Start services
        echo "Starting services..."
        docker-compose up -d

        # Wait for database to be ready
        echo "Waiting for database to be ready..."
        sleep 10

        # Run migrations
        echo "Running database migrations..."
        docker-compose exec -T backend npx prisma migrate deploy

        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Import D&D content: ./deploy.sh (choose option 3)"
        echo "  2. Access frontend: http://localhost:3000"
        echo "  3. Access backend API: http://localhost:3001/api"
        ;;

    2)
        echo -e "${YELLOW}🔄 Updating deployment...${NC}"

        # Pull latest code (if using git)
        if [ -d .git ]; then
            echo "Pulling latest code..."
            git pull
        fi

        # Rebuild containers
        echo "Rebuilding containers..."
        docker-compose build

        # Restart services
        echo "Restarting services..."
        docker-compose up -d

        # Run migrations
        echo "Running database migrations..."
        docker-compose exec -T backend npx prisma migrate deploy

        echo -e "${GREEN}✅ Update complete!${NC}"
        ;;

    3)
        echo -e "${YELLOW}📚 Importing D&D content...${NC}"

        echo "Importing spells..."
        docker-compose exec backend node scripts/import-spells.js

        echo "Importing species..."
        docker-compose exec backend node scripts/import-species.js

        echo "Importing classes..."
        docker-compose exec backend node scripts/import-classes.js

        echo "Importing backgrounds..."
        docker-compose exec backend node scripts/import-backgrounds.js

        echo "Importing feats..."
        docker-compose exec backend node scripts/import-feats.js

        echo "Importing items..."
        docker-compose exec backend node scripts/import-items.js

        echo "Testing database..."
        docker-compose exec backend node scripts/test-database.js

        echo -e "${GREEN}✅ D&D content imported successfully!${NC}"
        ;;

    4)
        echo -e "${YELLOW}💾 Backing up database...${NC}"
        BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
        docker-compose exec -T database pg_dump -U dnd_user dnd_character_sheet > "$BACKUP_FILE"
        echo -e "${GREEN}✅ Database backed up to: $BACKUP_FILE${NC}"
        ;;

    5)
        echo -e "${YELLOW}📥 Restoring database...${NC}"
        read -p "Enter backup file name: " BACKUP_FILE
        if [ -f "$BACKUP_FILE" ]; then
            cat "$BACKUP_FILE" | docker-compose exec -T database psql -U dnd_user dnd_character_sheet
            echo -e "${GREEN}✅ Database restored from: $BACKUP_FILE${NC}"
        else
            echo -e "${RED}❌ Backup file not found: $BACKUP_FILE${NC}"
        fi
        ;;

    6)
        echo -e "${YELLOW}📋 Viewing logs...${NC}"
        echo "Select service:"
        echo "  1) All services"
        echo "  2) Backend"
        echo "  3) Frontend"
        echo "  4) Database"
        read -p "Enter choice [1-4]: " log_choice

        case $log_choice in
            1) docker-compose logs -f ;;
            2) docker-compose logs -f backend ;;
            3) docker-compose logs -f frontend ;;
            4) docker-compose logs -f database ;;
            *) echo -e "${RED}Invalid choice${NC}" ;;
        esac
        ;;

    7)
        echo -e "${YELLOW}⏸️  Stopping services...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;

    8)
        echo -e "${RED}⚠️  WARNING: This will delete ALL data including the database!${NC}"
        read -p "Are you sure? Type 'YES' to confirm: " confirm
        if [ "$confirm" == "YES" ]; then
            echo "Stopping and removing all containers and volumes..."
            docker-compose down -v
            echo "Cleaning up Docker system..."
            docker system prune -a -f
            echo -e "${GREEN}✅ Full reset complete${NC}"
        else
            echo "Reset cancelled"
        fi
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "Deployment script finished!"
