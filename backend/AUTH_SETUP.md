# Authentication Setup Guide

This guide explains how to use the JWT-based authentication system in your D&D Character Sheet Generator.

## Overview

The authentication system includes:
- User registration with password hashing (bcrypt)
- Login with JWT token generation
- Protected routes using middleware
- Password management
- Profile updates

## Environment Setup

Make sure your `.env` file includes:

```bash
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
DATABASE_URL=postgresql://user:password@localhost:5432/dnd_character_sheet
```

**IMPORTANT**: Generate a secure JWT_SECRET. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Migration

Run the migration to add authentication fields:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## API Endpoints

### Authentication Endpoints

#### 1. Register a New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "playerOne",
  "email": "player@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Response** (201 Created):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "playerOne",
    "email": "player@example.com",
    "isDm": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "SecurePass123"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "playerOne",
    "email": "player@example.com",
    "isDm": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "user": {
    "id": 1,
    "username": "playerOne",
    "email": "player@example.com",
    "isDm": false,
    "discordId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "_count": {
      "characters": 5,
      "campaigns": 2
    }
  }
}
```

#### 4. Update Profile
```http
PATCH /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newUsername",
  "email": "newemail@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "username": "newUsername",
    "email": "newemail@example.com",
    "isDm": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Note: A new token is returned with updated user information.

#### 5. Update Password
```http
PATCH /api/auth/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456",
  "confirmNewPassword": "NewSecurePass456"
}
```

**Response** (200 OK):
```json
{
  "message": "Password updated successfully"
}
```

#### 6. Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

Note: With JWT, logout is handled client-side by removing the token. This endpoint is provided for consistency and potential future features.

### Character Endpoints (Protected)

All character endpoints now require authentication:

#### Create Character
```http
POST /api/characters
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Thorin Stormbreaker",
  "level": 1,
  "characterData": { ... },
  "isPublic": false
}
```

#### Update Character
```http
PUT /api/characters/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "level": 2,
  "characterData": { ... }
}
```

#### Delete Character
```http
DELETE /api/characters/:id
Authorization: Bearer <token>
```

#### Get Characters (Optional Auth)
```http
GET /api/characters
Authorization: Bearer <token> (optional)
```

- **Authenticated**: Returns user's characters + public characters
- **Unauthenticated**: Returns only public characters

#### Get Single Character (Optional Auth)
```http
GET /api/characters/:id
Authorization: Bearer <token> (optional)
```

- **Authenticated**: Can view own characters + public characters
- **Unauthenticated**: Can only view public characters

## Using Auth in Your Code

### Backend - Protecting Routes

```typescript
import { authenticate, requireDM } from '../middleware/auth';

// Require authentication
router.post('/characters', authenticate, async (req: AuthRequest, res) => {
  // Access user via req.user
  const userId = req.user.id;
  // ...
});

// Optional authentication
router.get('/characters', optionalAuthenticate, async (req: AuthRequest, res) => {
  if (req.user) {
    // User is authenticated
  } else {
    // User is not authenticated
  }
});

// Require DM privileges
router.post('/campaigns', authenticate, requireDM, async (req: AuthRequest, res) => {
  // Only DMs can access this route
});
```

### Frontend - Using the Token

```typescript
// Store token after login
localStorage.setItem('authToken', response.token);

// Include token in API requests
const token = localStorage.getItem('authToken');

fetch('/api/characters', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

// Remove token on logout
localStorage.removeItem('authToken');
```

### Frontend - Example Auth Context

```typescript
interface AuthContext {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Usage in React
const { user, login, logout, isAuthenticated } = useAuth();
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": ["Password must be at least 8 characters long"]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```

```json
{
  "error": "Token expired"
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to access this resource"
}
```

### 409 Conflict
```json
{
  "error": "Email already registered"
}
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Tokens**: Tokens expire after 7 days
3. **Validation**: Input validation using Joi schemas
4. **CORS Protection**: Configured in server.ts
5. **Helmet**: Security headers via helmet middleware
6. **Unique Constraints**: Username and email must be unique

## Development/Demo Endpoints

These endpoints exist for backward compatibility and testing:

```http
# Get default demo user
GET /api/auth/default-user

# Create guest user
POST /api/auth/create-guest
{
  "username": "Guest Player"
}

# List all users (REMOVE IN PRODUCTION!)
GET /api/auth/users
```

**WARNING**: Remove the `/api/auth/users` endpoint before deploying to production!

## Testing

### Using curl

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "confirmPassword": "TestPass123"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# Get profile (replace <TOKEN> with actual token)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

## Migration from Existing Data

If you have existing users in your database:

1. The migration adds temporary email addresses for users without emails
2. Existing users get a default password hash
3. **Important**: Have existing users reset their passwords or manually update them

To manually update a user's password:

```typescript
import bcrypt from 'bcryptjs';

const newPassword = 'UserNewPassword123';
const passwordHash = await bcrypt.hash(newPassword, 10);

await prisma.user.update({
  where: { id: userId },
  data: { passwordHash }
});
```

## Next Steps

1. ✅ Backend authentication implemented
2. ⏳ Create frontend login/register pages
3. ⏳ Create auth context/provider for React
4. ⏳ Add protected routes in frontend router
5. ⏳ Implement token refresh mechanism (optional)
6. ⏳ Add "Remember Me" functionality (optional)
7. ⏳ Implement password reset via email (optional)

## Troubleshooting

### "JWT_SECRET is not defined"
Add `JWT_SECRET` to your `.env` file.

### "Email already registered"
The email is already in use. Use a different email or login with existing credentials.

### "Invalid token"
Token might be malformed or expired. Login again to get a new token.

### "User not found"
The authenticated user no longer exists in the database. Clear the token and login again.

## Additional Resources

- [JWT.io](https://jwt.io/) - Learn about JSON Web Tokens
- [bcrypt](https://www.npmjs.com/package/bcryptjs) - Password hashing
- [Joi](https://joi.dev/) - Input validation
- [Prisma Auth Docs](https://www.prisma.io/docs/guides/security/authentication)
