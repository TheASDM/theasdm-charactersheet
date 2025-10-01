# Container Update Guide

## How Updates Work

### The Update Flow

```
┌─────────────┐
│  Your Mac   │  1. Make code changes
│  (Dev)      │  2. Create tarball or git commit
└─────────────┘
       │
       │ SCP/Git Push
       ▼
┌─────────────────────────────────┐
│  Proxmox LXC Container          │
│  ┌──────────────────────────┐   │
│  │ /opt/dnd-charactersheet  │   │  3. Extract new code
│  │  - Source code           │   │
│  │  - docker-compose.yml    │   │
│  │  - Dockerfiles           │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │ Docker Containers        │   │  4. Rebuild containers
│  │  ┌─────────────────┐     │   │
│  │  │ Frontend        │     │   │
│  │  │ (nginx)         │     │   │
│  │  └─────────────────┘     │   │
│  │  ┌─────────────────┐     │   │
│  │  │ Backend         │     │   │
│  │  │ (Node.js)       │     │   │
│  │  └─────────────────┘     │   │
│  │  ┌─────────────────┐     │   │
│  │  │ Database        │     │   │
│  │  │ (PostgreSQL)    │     │   │
│  │  └─────────────────┘     │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │ Docker Volumes           │   │  ⚠️ Data persists here!
│  │  - postgres_data         │   │
│  │  - certbot_data          │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

### What Happens During Update

| Action | What Gets Updated | What Stays |
|--------|-------------------|------------|
| `docker-compose build` | Application code, Dependencies | Database data, Volumes |
| `docker-compose up -d` | Running containers | Volumes, Networks |
| `docker-compose down` | Stops containers | Keeps volumes & data |
| `docker-compose down -v` | **⚠️ DELETES EVERYTHING** | Nothing (DANGER!) |

## Update Methods Comparison

### Method 1: Git-Based (Recommended)

**Pros:**
- ✅ Version control
- ✅ Easy rollback
- ✅ Track changes
- ✅ Team collaboration

**Cons:**
- ❌ Requires Git setup
- ❌ Need to commit/push changes

**Steps:**
```bash
# On Mac - commit and push changes
git add .
git commit -m "Update feature X"
git push origin main

# On LXC - pull and rebuild
cd /opt/dnd-charactersheet
./update.sh  # Choose option 1 (Git pull)
```

### Method 2: Tarball Transfer (Current Method)

**Pros:**
- ✅ No Git required
- ✅ Quick for small changes
- ✅ Full control over what's transferred

**Cons:**
- ❌ Manual process
- ❌ No version history
- ❌ Risk of missing files

**Steps:**
```bash
# On Mac - create tarball
cd /Users/dustinamodeo/Documents/coding/projects/theasdm-charactersheet
tar --exclude='node_modules' --exclude='dist' --exclude='build' --exclude='.git' --exclude='postgres_data' -czf ~/dnd-update.tar.gz .
scp ~/dnd-update.tar.gz root@LXC_IP:/root/

# On LXC - extract and rebuild
cd /opt/dnd-charactersheet
./update.sh  # Choose option 2 (Tarball)
```

### Method 3: Docker Registry

**Pros:**
- ✅ Professional workflow
- ✅ Consistent images
- ✅ Easy multi-deployment
- ✅ CI/CD friendly

**Cons:**
- ❌ More complex setup
- ❌ Need registry account
- ❌ Extra build step

**Setup:**
```bash
# One-time setup on Mac
docker login

# Build on Mac (or CI/CD)
docker build -t yourusername/dnd-frontend:latest ./frontend
docker build -t yourusername/dnd-backend:latest ./backend
docker push yourusername/dnd-frontend:latest
docker push yourusername/dnd-backend:latest

# On LXC - just pull
docker-compose pull
docker-compose up -d
```

## Smart Update Script Usage

The `update.sh` script handles everything safely:

```bash
cd /opt/dnd-charactersheet
./update.sh
```

**What it does:**
1. ✅ **Backs up database** - Create SQL dump
2. ✅ **Backs up code** - Save current version for rollback
3. ✅ **Updates code** - Git pull or tarball extraction
4. ✅ **Rebuilds containers** - Fresh build with new code
5. ✅ **Runs migrations** - Apply database changes
6. ✅ **Health checks** - Verify everything works
7. ✅ **Auto-rollback** - If something fails, revert automatically

## Common Update Scenarios

### Frontend-Only Update

```bash
# On Mac
cd frontend
# Make changes to React code
tar -czf ~/frontend-update.tar.gz src/
scp ~/frontend-update.tar.gz root@LXC_IP:/root/

# On LXC
cd /opt/dnd-charactersheet/frontend
tar -xzf /root/frontend-update.tar.gz
cd ..
docker-compose build frontend
docker-compose up -d frontend
```

### Backend-Only Update

```bash
# Similar but for backend
docker-compose build backend
docker-compose up -d backend
docker-compose exec backend npx prisma migrate deploy  # If DB changes
```

### Database Schema Update

```bash
# This happens automatically with update.sh
# But manually:
docker-compose exec backend npx prisma migrate deploy

# Or if you need to create a new migration on Mac:
cd backend
npx prisma migrate dev --name description_of_change
# Commit the new migration files
# Then deploy on LXC
```

### Environment Variable Update

```bash
# On LXC
cd /opt/dnd-charactersheet
nano .env  # Update variables

# Rebuild containers (frontend needs rebuild for VITE_ vars)
docker-compose build frontend
docker-compose up -d
```

## Zero-Downtime Updates (Advanced)

For production with no downtime:

1. **Use Docker Swarm or Blue-Green deployment:**
```bash
# Start new version alongside old
docker-compose -p dnd-new up -d

# Test new version
curl http://localhost:3000

# Switch traffic (update nginx config)
# Then remove old version
docker-compose -p dnd-old down
```

2. **Or use rolling updates with scale:**
```bash
# Scale up with new version
docker-compose up -d --scale backend=2

# Remove old instances
docker-compose up -d --scale backend=1
```

## Rollback Process

### If Update Fails

The `update.sh` script auto-rollbacks, but manually:

```bash
# Find your backup
ls -la backups/

# Restore code
cd /opt/dnd-charactersheet
tar -xzf backups/20250930-123456/code-backup.tar.gz

# Rebuild
docker-compose build
docker-compose up -d

# Restore database (if needed)
cat backups/20250930-123456/database.sql | \
  docker-compose exec -T database psql -U dnd_user dnd_character_sheet
```

### Git Rollback

```bash
# View history
git log --oneline

# Rollback to specific commit
git checkout abc123
docker-compose build
docker-compose up -d

# Or create revert commit
git revert HEAD
docker-compose build
docker-compose up -d
```

## Best Practices

1. **Always backup before updates**
   ```bash
   ./update.sh  # Handles this automatically
   ```

2. **Test updates locally first**
   ```bash
   # On Mac with Docker Desktop
   docker-compose build
   docker-compose up
   # Test thoroughly, then deploy to LXC
   ```

3. **Use semantic versioning for images**
   ```bash
   docker build -t yourname/dnd-frontend:v1.2.3 ./frontend
   docker build -t yourname/dnd-frontend:latest ./frontend
   ```

4. **Keep backups for 7-30 days**
   ```bash
   # Add to crontab
   0 2 * * * find /opt/dnd-charactersheet/backups -mtime +7 -delete
   ```

5. **Monitor logs during update**
   ```bash
   docker-compose logs -f
   ```

## Automation Ideas

### Automatic Updates via Webhook

```bash
# Create webhook endpoint that triggers update
# When you push to Git, GitHub/GitLab calls webhook
# Webhook script runs update.sh automatically

# Example webhook script
#!/bin/bash
cd /opt/dnd-charactersheet
git pull
./update.sh << EOF
1
EOF
```

### Scheduled Updates

```bash
# Add to crontab (daily at 3 AM)
0 3 * * * cd /opt/dnd-charactersheet && git pull && docker-compose build && docker-compose up -d
```

### Health Check Notifications

```bash
# Add to crontab (every 5 minutes)
*/5 * * * * curl -f http://localhost:3001/health || mail -s "Backend Down" you@email.com
```

## Troubleshooting Updates

### Container Won't Start After Update

```bash
# Check logs
docker-compose logs backend --tail=100

# Common issues:
# - Port conflict: netstat -tulpn | grep 3001
# - Env vars: docker-compose config
# - Dependencies: docker-compose exec backend npm install
```

### Database Migration Failed

```bash
# Check migration status
docker-compose exec backend npx prisma migrate status

# Force migration
docker-compose exec backend npx prisma migrate resolve --applied migration_name
docker-compose exec backend npx prisma migrate deploy
```

### Frontend Not Updating

```bash
# Frontend caches aggressively - force rebuild
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Clear browser cache
# Or add cache-busting to index.html
```

## Quick Reference Commands

```bash
# Update with Git
cd /opt/dnd-charactersheet && ./update.sh  # Choose 1

# Update with tarball
cd /opt/dnd-charactersheet && ./update.sh  # Choose 2

# Just rebuild (no code changes)
docker-compose build && docker-compose up -d

# Rollback to backup
tar -xzf backups/TIMESTAMP/code-backup.tar.gz && docker-compose build && docker-compose up -d

# Check what changed
git diff HEAD~1
git log --oneline -n 5
```
