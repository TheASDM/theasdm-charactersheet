# D&D 2024 Character Sheet Generator

A comprehensive web-based D&D character sheet generator featuring complete D&D 2024 rules compliance with integrated Nimble TTRPG homebrew mechanics. Designed for homelab deployment supporting up to 15 users with full Discord bot integration.

## 🎯 Features

### Core Functionality

- ✅ **Complete D&D 2024 Dataset**: Full database with **705 items**, **391 spells**, **77 feats**, **16 backgrounds**, **12 classes**, and **10 species** from Player's Handbook and Dungeon Master's Guide
- 🎲 **Random Character Generator**: Both truly random and manual modes for character creation with comprehensive data showcase
- 🗄️ **Robust Database**: PostgreSQL with Prisma ORM, complete import system for D&D 2024 content with 97.4% success rate
- 📊 **Import Scripts**: Automated data import from 5etools JSON format with smart parsing and validation
- 🔐 **Character Protection**: Password-protected characters with DM override capabilities (planned)
- 📱 **Mobile Responsive**: Optimized for tablet gameplay with PWA support (in development)
- ⚡ **Real-time Updates**: Live character synchronization for campaign play (planned)
- 🎮 **Discord Integration**: Bot for character lookup, dice rolling, and spell reference (planned)

### Technical Features

- 🐳 **Docker Deployment**: Complete containerized setup with Nginx reverse proxy (configured)
- 🗄️ **PostgreSQL Database**: Robust data storage with JSONB, complete D&D 2024 schema with 705 items
- 🚀 **Modern Stack**: Node.js/Express backend, React/TypeScript frontend
- 📊 **JSON Data Import**: Smart parsing system for 5etools format with validation and error handling
- 🔒 **Security**: JWT authentication, rate limiting, SSL/TLS support (configured)
- ♿ **Accessibility**: WCAG 2.1 AA compliant (planned)

## 🏗️ Architecture

```mermaid
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Discord Bot   │
│   React/TS      │◄──►│   Node.js/TS    │◄──►│   Discord.js    │
│   Port: 3000    │    │   Port: 3001    │    │   (planned)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   PostgreSQL    │    │   File Storage  │
│   Port: 80/443  │    │   Port: 5432    │    │   Uploads/Logs  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if not using Docker)

### Docker Deployment (Recommended)

1. **Clone and Setup**

   ```bash
   git clone <your-repo-url>
   cd theasdm-charactersheet
   cp .env.example .env
   ```

2. **Configure Environment**
   Edit `.env` file with your settings:

   ```env
   POSTGRES_PASSWORD=your-secure-password
   JWT_SECRET=your-secret-key-min-32-chars
   DISCORD_TOKEN=your-bot-token
   DOMAIN_NAME=yourdomain.com
   ```

3. **Deploy**

   ```bash
   docker-compose up -d
   ```

4. **Initialize Database**

   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npx prisma db seed
   ```

5. **Import D&D 2024 Content** (Optional - database includes sample data)

   ```bash
   # Import all D&D 2024 content
   docker-compose exec backend node scripts/import-spells.js
   docker-compose exec backend node scripts/import-species.js
   docker-compose exec backend node scripts/import-classes.js
   docker-compose exec backend node scripts/import-backgrounds.js
   docker-compose exec backend node scripts/import-feats.js
   docker-compose exec backend node scripts/import-items.js

   # Generate random characters to test dataset
   docker-compose exec backend node scripts/generate-random-character.js
   ```

### Local Development

1. **Backend Setup**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   npx prisma migrate dev
   npm run dev
   ```

2. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm start
   ```

3. **Discord Bot Setup** (Optional - bot features planned)

   ```bash
   cd discord-bot
   npm install
   cp .env.example .env
   npm run dev
   ```

## 📚 Documentation

- [📖 API Documentation](docs/api/README.md)
- [🚀 Deployment Guide](docs/deployment/README.md)
- [🛠️ Development Setup](docs/development/README.md)
- [🎯 Character Creation Guide](docs/character-creation.md)
- [🎲 Discord Bot Commands](docs/discord-bot.md)
- [⚙️ Configuration Guide](docs/configuration.md)

## 📊 Current Status

### ✅ Completed Features

- **Complete D&D 2024 Database**: 705 items, 391 spells, 77 feats, 16 backgrounds, 12 classes, 10 species
- **Import System**: Automated scripts with 97.4% success rate importing from 5etools JSON format
- **Character Generator**: Both random and manual modes for comprehensive character creation
- **Database Testing**: Full validation scripts ensuring data integrity
- **Docker Configuration**: Complete containerized setup ready for deployment
- **Backend Architecture**: Node.js/TypeScript/Prisma/PostgreSQL fully configured

### 🚧 In Development

- **Frontend Implementation**: React/TypeScript PWA with character sheet interface
- **API Endpoints**: RESTful API for character and content management
- **Authentication System**: JWT-based user authentication with Discord integration

### 📋 Planned Features

- **Discord Bot Integration**: Character lookup, dice rolling, spell reference
- **Real-time Character Updates**: Live synchronization for campaign play
- **Character Protection**: Password-protected characters with DM override
- **Mobile Optimization**: Tablet-optimized interface for gameplay

## 🎮 Discord Bot Commands (Planned)

| Command                    | Description                       |
| -------------------------- | --------------------------------- |
| `/character lookup <name>` | Find and display character info   |
| `/roll <dice>`             | Roll dice (e.g., `/roll 1d20+5`)  |
| `/spell <name>`            | Look up spell details             |
| `/class <name>`            | Display class information         |
| `/dm override <character>` | DM override for locked characters |

## 🗄️ Database Schema

The database contains a complete D&D 2024 dataset with the following content:

### Content Tables

- **spells**: 391 spells from XPHB with full metadata (components, duration, damage, etc.)
- **species**: 10 playable species with traits and abilities
- **items**: 705 items from XPHB & XDMG (weapons, armor, magic items, adventuring gear)
- **classes**: 12 character classes with subclass information
- **backgrounds**: 16 character backgrounds with skill proficiencies
- **feats**: 77 feats including general, epic, and fighting style feats

### User & Character Tables (Planned)

- **users**: User accounts and Discord integration
- **characters**: Character data with JSONB flexibility
- **campaigns**: Campaign management

### Import Scripts

All content imported using automated scripts with smart data parsing:

- `scripts/import-spells.js` - Spell data with filtering and validation
- `scripts/import-species.js` - Species/race data with traits
- `scripts/import-items.js` - Items from both XPHB and XDMG sources
- `scripts/import-classes.js` - Class and subclass data
- `scripts/import-backgrounds.js` - Background and proficiency data
- `scripts/import-feats.js` - Feat data with prerequisites
- `scripts/generate-random-character.js` - Character generation tool

See the Prisma schema at `backend/prisma/schema.prisma` for detailed field definitions.

## 🔧 Technology Stack

### Backend

- **Node.js** with **TypeScript**
- **Express.js** for REST API
- **Prisma** ORM with PostgreSQL
- **Socket.io** for real-time updates
- **JWT** authentication
- **Winston** logging

### Frontend

- **React 18** with **TypeScript**
- **React Router** for navigation
- **Styled Components** for styling
- **React Query** for state management
- **Framer Motion** for animations
- **PWA** support

### Infrastructure

- **Docker** containerization
- **Nginx** reverse proxy
- **PostgreSQL 15** database
- **Let's Encrypt** SSL certificates
- **Discord.js v14** bot framework

## 🛡️ Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers
- SQL injection protection via Prisma
- Input validation with Joi

## 📱 Mobile Support

- Responsive design optimized for tablets
- Progressive Web App (PWA) capabilities
- Touch-friendly interface
- Offline support for character sheets
- App-like experience on mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Nimble TTRPG](https://shortreststudios.com/nimble-rpg/) for homebrew mechanics inspiration
- [D&D Beyond](https://www.dndbeyond.com/) for rule reference
- [5e.tools](https://5e.tools/) for comprehensive D&D data
- Open source community for the amazing tools and libraries

## 📞 Support

- 📧 Email: [your-email@example.com]
- 💬 Discord: [Your Discord Server]
- 🐛 Issues: [GitHub Issues](link-to-issues)
- 📖 Wiki: [Project Wiki](link-to-wiki)

---

Made with ❤️ for the D&D community
