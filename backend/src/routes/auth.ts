import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Create a simple guest user for demo purposes
router.post('/create-guest', async (req: Request, res: Response) => {
  try {
    const { username = 'Guest Player' } = req.body;

    // Check if guest user already exists
    const existingUser = await prisma.user.findFirst({
      where: { username: username }
    });

    if (existingUser) {
      return res.json({
        user: existingUser,
        message: 'Guest user already exists'
      });
    }

    // Create new guest user
    const user = await prisma.user.create({
      data: {
        username: username,
        email: null,
        isDm: false
      }
    });

    return res.json({
      user: user,
      message: 'Guest user created successfully'
    });

  } catch (error) {
    console.error('Error creating guest user:', error);
    return res.status(500).json({ error: 'Failed to create guest user' });
  }
});

// Get or create a default user for development
router.get('/default-user', async (req: Request, res: Response) => {
  try {
    let user = await prisma.user.findFirst({
      where: { username: 'Demo Player' }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: 'Demo Player',
          email: 'demo@example.com',
          isDm: false
        }
      });
    }

    return res.json({ user });

  } catch (error) {
    console.error('Error getting default user:', error);
    return res.status(500).json({ error: 'Failed to get default user' });
  }
});

// List all users (for development)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, isDm: true, createdAt: true }
    });

    return res.json({ users });

  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({ error: 'Failed to list users' });
  }
});

// TODO: Implement proper authentication routes (JWT, sessions, etc.)
router.post('/register', (req, res) => {
  res
    .status(501)
    .json({ message: 'Full authentication not implemented yet - use /auth/default-user for demo' });
});

router.post('/login', (req, res) => {
  res
    .status(501)
    .json({ message: 'Full authentication not implemented yet - use /auth/default-user for demo' });
});

router.post('/logout', (req, res) => {
  res
    .status(501)
    .json({ message: 'Full authentication not implemented yet' });
});

export default router;
