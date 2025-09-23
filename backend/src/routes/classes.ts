import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Get all classes
router.get('/', async (req: Request, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { name: 'asc' }
    });

    return res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get a single class by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Class ID is required' });
    }
    
    const characterClass = await prisma.class.findUnique({
      where: { id: parseInt(id) }
    });

    if (!characterClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    return res.json(characterClass);
  } catch (error) {
    console.error('Error fetching class:', error);
    return res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// Get class by name (useful for lookups)
router.get('/name/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }
    
    const characterClass = await prisma.class.findUnique({
      where: { name: decodeURIComponent(name) }
    });

    if (!characterClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    return res.json(characterClass);
  } catch (error) {
    console.error('Error fetching class by name:', error);
    return res.status(500).json({ error: 'Failed to fetch class by name' });
  }
});

export default router;
