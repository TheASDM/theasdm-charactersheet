import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Get all backgrounds
router.get('/', async (req: Request, res: Response) => {
  try {
    const backgrounds = await prisma.background.findMany({
      orderBy: { name: 'asc' }
    });

    return res.json(backgrounds);
  } catch (error) {
    console.error('Error fetching backgrounds:', error);
    return res.status(500).json({ error: 'Failed to fetch backgrounds' });
  }
});

// Get a single background by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Background ID is required' });
    }
    
    const background = await prisma.background.findUnique({
      where: { id: parseInt(id) }
    });

    if (!background) {
      return res.status(404).json({ error: 'Background not found' });
    }

    return res.json(background);
  } catch (error) {
    console.error('Error fetching background:', error);
    return res.status(500).json({ error: 'Failed to fetch background' });
  }
});

// Get background by name (useful for lookups)
router.get('/name/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: 'Background name is required' });
    }
    
    const background = await prisma.background.findUnique({
      where: { name: decodeURIComponent(name) }
    });

    if (!background) {
      return res.status(404).json({ error: 'Background not found' });
    }

    return res.json(background);
  } catch (error) {
    console.error('Error fetching background by name:', error);
    return res.status(500).json({ error: 'Failed to fetch background by name' });
  }
});

export default router;
