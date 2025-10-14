# Changelog

All notable changes to WTForged will be documented in this file.

## [Unreleased]

### Added
- **Discord OAuth Authentication**: Complete OAuth 2.0 integration
  - Removed traditional username/password authentication
  - Discord-only login with OAuth 2.0 flow
  - Secure token-based authentication with JWT
  - User profiles automatically populated from Discord (avatar, username, email)
- **User Profile Page**: New profile management interface
  - View Discord profile information
  - Edit display name
  - Shows character count and campaign participation
  - View account creation and last login timestamps
- **User Role System**: Player/DM role management
  - All users default to "Player" role
  - Role-based access control for future DM features
  - Foundation for campaign management permissions
- **Hit Dice Display**: Added visual hit dice tracker to character sheet
  - Shows hit die type (d6, d8, d10, d12) centered below HP display
  - Shows current/max hit dice count in dedicated bar
  - Click to adjust hit dice in edit mode
  - Automatically detects correct die type based on character class

### Changed
- **Authentication System Overhaul**: Complete replacement of auth system
  - Migrated from password-based to OAuth-only authentication
  - Updated database schema for Discord OAuth (discord_id, display_name, avatar_url, OAuth tokens)
  - Frontend context and services refactored for OAuth flow
  - Backend routes restructured for Discord OAuth callbacks
  - Removed password fields and traditional login components

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

### Security
- OAuth 2.0 state validation prevents CSRF attacks
- Secure token storage with proper expiration handling
- Discord token refresh capability for long-lived sessions

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

