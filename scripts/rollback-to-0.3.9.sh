#!/bin/bash

echo "==================================="
echo "Rollback to Alpha 0.3.9"
echo "==================================="
echo ""

cd ~/my-apps/theasdm-charactersheet

echo "⚠️  This will rollback to the last working version (0.3.9)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Finding 0.3.9 commit..."
git log --oneline --all | grep "0.3.9" || git log --oneline --all | head -20
echo ""
read -p "Enter the commit hash for 0.3.9 (or press Enter to use HEAD~1): " COMMIT_HASH

if [ -z "$COMMIT_HASH" ]; then
    COMMIT_HASH="HEAD~1"
fi

echo ""
echo "Step 2: Resetting to $COMMIT_HASH..."
git reset --hard $COMMIT_HASH

echo ""
echo "Step 3: Rebuilding containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo ""
echo "Step 4: Verifying..."
sleep 10
docker ps
docker logs wtforge-app --tail 30

echo ""
echo "==================================="
echo "✅ Rolled back to 0.3.9"
echo "==================================="
echo ""
