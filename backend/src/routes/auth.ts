import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator';
import { prisma } from '../db';

const router = Router();

/**
 * Generate JWT token for user
 */
const generateToken = (user: {
  id: number;
  username: string;
  email: string;
  isDm: boolean;
}): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      isDm: user.isDm,
    },
    jwtSecret,
    {
      expiresIn: '7d', // Token expires in 7 days
    }
  );
};

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((d) => d.message),
      });
    }

    const { username, email, password } = value;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (existingUser.username === username) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        isDm: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        isDm: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken(user);

    return res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((d) => d.message),
      });
    }

    const { email, password } = value;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data without password
    const { passwordHash, ...userWithoutPassword } = user;

    return res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Fetch full user data
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        isDm: true,
        discordId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            characters: true,
            campaigns: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * Update user profile
 * PATCH /api/auth/profile
 */
router.patch(
  '/profile',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Validate request body
      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map((d) => d.message),
        });
      }

      const { username, email } = value;

      // Check if username or email is already taken by another user
      if (username || email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: req.user.id } },
              {
                OR: [
                  ...(username ? [{ username }] : []),
                  ...(email ? [{ email }] : []),
                ],
              },
            ],
          },
        });

        if (existingUser) {
          if (existingUser.username === username) {
            return res.status(409).json({ error: 'Username already taken' });
          }
          if (existingUser.email === email) {
            return res.status(409).json({ error: 'Email already registered' });
          }
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(username && { username }),
          ...(email && { email }),
        },
        select: {
          id: true,
          username: true,
          email: true,
          isDm: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Generate new token with updated info
      const token = generateToken(updatedUser);

      return res.json({
        message: 'Profile updated successfully',
        user: updatedUser,
        token,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

/**
 * Update user password
 * PATCH /api/auth/password
 */
router.patch(
  '/password',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Validate request body
      const { error, value } = updatePasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map((d) => d.message),
        });
      }

      const { currentPassword, newPassword } = value;

      // Fetch user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash: newPasswordHash },
      });

      return res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({ error: 'Failed to update password' });
    }
  }
);

/**
 * Logout (client-side token removal)
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, (req: AuthRequest, res: Response) => {
  // JWT logout is handled client-side by removing the token
  // This endpoint exists for consistency and potential future features
  // (e.g., token blacklist, audit logging)
  return res.json({ message: 'Logged out successfully' });
});

// ============================================================================
// Development/Demo Endpoints (keep these for backward compatibility)
// ============================================================================

if (process.env.NODE_ENV !== 'production') {
  /**
   * Create a guest user for demo purposes
   * POST /api/auth/create-guest
   */
  router.post('/create-guest', async (req: AuthRequest, res: Response) => {
    try {
      const { username = 'Guest Player' } = req.body;

      // Check if guest user already exists
      const existingUser = await prisma.user.findFirst({
        where: { username: username },
      });

      if (existingUser) {
        return res.json({
          user: existingUser,
          message: 'Guest user already exists',
        });
      }

      // Create new guest user with a random password
      const randomPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const user = await prisma.user.create({
        data: {
          username: username,
          email: `${username.toLowerCase().replace(/\s+/g, '')}@guest.local`,
          passwordHash,
          isDm: false,
        },
      });

      return res.json({
        user: user,
        message: 'Guest user created successfully',
      });
    } catch (error) {
      console.error('Error creating guest user:', error);
      return res.status(500).json({ error: 'Failed to create guest user' });
    }
  });

  /**
   * Get or create a default user for development
   * GET /api/auth/default-user
   */
  router.get('/default-user', async (req: AuthRequest, res: Response) => {
    try {
      let user = await prisma.user.findFirst({
        where: { username: 'Demo Player' },
      });

      if (!user) {
        const passwordHash = await bcrypt.hash('demo1234', 10);
        user = await prisma.user.create({
          data: {
            username: 'Demo Player',
            email: 'demo@example.com',
            passwordHash,
            isDm: false,
          },
        });
      }

      // Generate token for demo user
      const token = generateToken(user);

      return res.json({ user, token });
    } catch (error) {
      console.error('Error getting default user:', error);
      return res.status(500).json({ error: 'Failed to get default user' });
    }
  });

  /**
   * List all users (for development only)
   * GET /api/auth/users
   */
  router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          isDm: true,
          createdAt: true,
        },
      });

      return res.json({ users });
    } catch (error) {
      console.error('Error listing users:', error);
      return res.status(500).json({ error: 'Failed to list users' });
    }
  });
} else {
  // Hardened production behaviour: hide development-only routes
  router.all(['/create-guest', '/default-user', '/users'], (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}

export default router;
