import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Get all species (races)
router.get('/', async (req: Request, res: Response) => {
  try {
    const species = await prisma.species.findMany({
      orderBy: { name: 'asc' }
    });

    return res.json(species);
  } catch (error) {
    console.error('Error fetching species:', error);
    return res.status(500).json({ error: 'Failed to fetch species' });
  }
});

// Get a single species by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Species ID is required' });
    }
    
    const species = await prisma.species.findUnique({
      where: { id: parseInt(id) }
    });

    if (!species) {
      return res.status(404).json({ error: 'Species not found' });
    }

    return res.json(species);
  } catch (error) {
    console.error('Error fetching species:', error);
    return res.status(500).json({ error: 'Failed to fetch species' });
  }
});

// Get species by name (useful for lookups)
router.get('/name/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: 'Species name is required' });
    }
    
    const species = await prisma.species.findUnique({
      where: { name: decodeURIComponent(name) }
    });

    if (!species) {
      return res.status(404).json({ error: 'Species not found' });
    }

    return res.json(species);
  } catch (error) {
    console.error('Error fetching species by name:', error);
    return res.status(500).json({ error: 'Failed to fetch species by name' });
  }
});

export default router;
