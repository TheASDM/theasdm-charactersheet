# Changelog

All notable changes to WTForged will be documented in this file.

## [Unreleased]

### Added
- **Hit Dice Display**: Added visual hit dice tracker to character sheet
  - Shows hit die type (d6, d8, d10, d12) centered below HP display
  - Shows current/max hit dice count in dedicated bar
  - Click to adjust hit dice in edit mode
  - Automatically detects correct die type based on character class

### Improved
- **Health Point Calculation**: Enhanced logic for detecting HP increases from feats and features
  - Better parsing of complex feat descriptions with HP bonuses
  - Improved detection of per-level HP increases
  - More accurate handling of HP bonuses from multiple sources
  - Fixed edge cases where HP bonuses weren't being properly calculated during character creation
- **Actions Table**: Dynamic row rendering based on actual content
  - View mode now only shows rows with actions (no empty rows)
  - Edit mode shows existing actions plus one empty row for adding new entries
  - Table automatically resizes based on number of actions instead of showing fixed 8 rows

---

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

