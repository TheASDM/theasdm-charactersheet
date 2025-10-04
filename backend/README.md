# Backend API Server

Node.js/Express backend for the D&D Character Sheet Generator with TypeScript, Prisma ORM, PostgreSQL, and complete D&D 2024 dataset.

## 🎯 Current Status

### ✅ Implemented Features

- **Complete D&D 2024 Database**: 705 items, 391 spells, 77 feats, 16 backgrounds, 12 classes, 10 species
- **Import System**: Automated scripts with smart parsing and 97.4% success rate
- **Database Schema**: Enhanced Prisma models with JSONB flexibility
- **Character Generator**: Random and manual character creation tools
- **Data Validation**: Comprehensive testing and integrity checks

### 🚧 In Development

- **API Endpoints**: RESTful routes for character and content management
- **Authentication**: JWT-based user authentication system
- **Real-time Features**: Socket.io for live character updates

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Quick Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your database and configuration details
   ```

3. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev

   # Import D&D 2024 content (optional - included in seed)
   node scripts/import-spells.js
   node scripts/import-species.js
   node scripts/import-classes.js
   node scripts/import-backgrounds.js
   node scripts/import-feats.js
   node scripts/import-items.js

   # Test the complete dataset
   node scripts/test-database.js
   node scripts/generate-random-character.js
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

The API server will be available at `http://localhost:3001`

## 📁 Project Structure

```
src/
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/         # API route definitions
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── server.ts       # Express app setup

prisma/
├── schema.prisma   # Database schema
├── migrations/     # Database migrations
└── seed.ts        # Database seeding
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run seed` - Seed database with initial data

## 📊 Database Schema & Content

### Current D&D 2024 Content

#### Complete Dataset Statistics

- **Items**: 705 total (140 XPHB + 565 XDMG) - weapons, armor, magic items, adventuring gear
- **Spells**: 391 spells with components, duration, damage, and descriptions
- **Feats**: 77 feats including general, epic, and fighting style variants
- **Backgrounds**: 16 character backgrounds with skill proficiencies
- **Classes**: 12 character classes with subclass information
- **Species**: 10 playable species with racial traits and abilities

#### Enhanced Data Models

- **Item Model**: 30+ fields supporting weapons, armor, magic items, costs, properties
- **Spell Model**: Complete metadata including components, school, level, damage types
- **Character Models**: JSONB flexibility for complex character data (planned)
- **User Models**: Authentication and Discord integration (planned)

### Import Scripts & Tools

- `scripts/import-spells.js` - XPHB spell data with filtering and validation
- `scripts/import-species.js` - Species data with traits and abilities
- `scripts/import-classes.js` - Class and subclass information
- `scripts/import-backgrounds.js` - Background data with proficiencies
- `scripts/import-feats.js` - Feat data with prerequisites and benefits
- `scripts/import-items.js` - Items from both XPHB and XDMG with smart parsing
- `scripts/generate-random-character.js` - Character generation tool (random/manual)
- `scripts/test-database.js` - Comprehensive database validation

### Key Features

- **Smart Data Parsing**: Handles 5etools JSON format with type conversion
- **Upsert Operations**: Prevents duplicates during import processes
- **Source Filtering**: XPHB filtering for official D&D 2024 content
- **Error Handling**: Comprehensive validation with detailed error reporting
- **JSONB Storage**: Flexible storage for complex D&D data structures

## 🔐 Authentication & Security

- JWT token-based authentication
- bcrypt password hashing
- Rate limiting on API endpoints
- Input validation with Joi
- CORS configuration
- Helmet.js security headers

## 🌐 API Endpoints (Planned)

### Authentication Routes

- `POST /api/auth/register` - User registration with Discord integration
- `POST /api/auth/login` - User login with JWT tokens
- `POST /api/auth/logout` - User logout and token invalidation

### Character Management

- `GET /api/characters` - List user characters with filtering
- `POST /api/characters` - Create new character from D&D 2024 data
- `GET /api/characters/:id` - Get character details and equipment
- `PUT /api/characters/:id` - Update character with validation
- `DELETE /api/characters/:id` - Delete character (with password protection)

### D&D 2024 Content API

- `GET /api/spells` - Search 391 spells with filtering by level, school, class
- `GET /api/items` - Search 705 items with filtering by type, rarity, source
- `GET /api/classes` - List 12 classes with subclass details
- `GET /api/species` - List 10 species with racial traits
- `GET /api/backgrounds` - List 16 backgrounds with proficiencies
- `GET /api/feats` - Search 77 feats with prerequisites

### Character Generation

- `GET /api/generate/random` - Generate random character using database
- `POST /api/generate/manual` - Generate character with specific options

See the route definitions in `src/routes/` for implementation details.

## 🔌 Real-time Features

WebSocket support via Socket.io for:

- Live character updates during gameplay
- Campaign synchronization
- Real-time notifications

## 📝 Logging

Winston logger with:

- Console output in development
- File logging in production
- Structured JSON logging
- Error tracking and reporting

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- characters.test.ts
```


## 🔄 Migrations and Seeding

### Creating Migrations

```bash
# Create and run migration
npx prisma migrate dev --name add_new_table

# Reset database (development only)
npx prisma migrate reset
```

### Custom Seeding

```bash
# Run specific seed file
npx ts-node prisma/seeds/spells.ts

# Seed with custom data
npm run seed -- --type=spells --source=custom-spells.csv
```

## ⚙️ Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dnd_db"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"

# Server
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW=15    # minutes
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="info"
LOG_FILE="./logs/app.log"
```

### Database Configuration

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

## 🚨 Error Handling

Centralized error handling with:

- Custom error classes
- Async error wrapper
- Structured error responses
- Development vs production error details

```typescript
// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Usage
throw new AppError('Character not found', 404);
```

## 📈 Performance Optimization

- Database connection pooling
- Query optimization with indexes
- Response compression
- Caching for frequently accessed data
- Rate limiting to prevent abuse

## 🔍 Monitoring

Health check endpoint: `GET /health`

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "database": "connected"
}
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Use conventional commit messages
4. Update documentation
5. Ensure all tests pass

### Code Style

- ESLint configuration for consistent code style
- Prettier for code formatting
- TypeScript strict mode enabled
- Comprehensive type definitions

```bash
# Format code
npm run format

# Lint and fix
npm run lint:fix
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
