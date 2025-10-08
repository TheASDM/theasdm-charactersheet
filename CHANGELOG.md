# Changelog

All notable changes to WTForged will be documented in this file.

## [0.4.0] - 2025-10-08

### Fixed
- **CRITICAL**: Fixed styled-components rendering issues in production
  - Added `disableCSSOMInjection` to StyleSheetManager
  - Fixed `process.env` undefined errors in browser
  - Added babel-plugin-styled-components for proper hashing

### Security
- Re-enabled Content Security Policy with proper styled-components support
- Tightened CORS to only allow production domain in production mode
- Added security headers (CSP, X-Frame-Options, etc.)

### Performance
- Added PostgreSQL performance tuning parameters
- Enabled Docker BuildKit support
- Configured proper gzip compression
- Optimized database connection pooling

### Added
- Server optimization scripts (`scripts/optimize-server.sh`)
- PostgreSQL upgrade script (`scripts/upgrade-postgres.sh`)
- Database backup automation
- Comprehensive server optimization documentation

### Changed
- Updated logger to always output to console for Docker visibility
- Improved error handling and logging throughout
- Better environment variable management

### Infrastructure
- Added production-ready Docker configuration
- Configured automated backups
- Added health checks and monitoring setup
- Created server diagnostic tools

---

## [0.3.8] - Previous Release

*(Historical releases - details not tracked)*

---

## Upgrade Notes for 0.4.0

### Breaking Changes
None - this is a bugfix and optimization release

### Migration Steps
1. Pull latest code
2. Run `docker-compose build --no-cache`
3. Run `docker-compose up -d`
4. (Optional) Run `sudo ./scripts/optimize-server.sh` for server optimizations

### Known Issues
- PostgreSQL 15 → 16 upgrade requires manual data migration
- Some CSS warnings in Firefox console (harmless)

