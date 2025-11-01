import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Get all species/races with optional filters and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      search = '',
      source = '',
      creatureType = ''
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Add search filter
    if (search) {
      where.name = {
        contains: search as string,
        mode: 'insensitive'
      };
    }

    // Add source filter
    if (source) {
      where.source = source as string;
    }

    // Add creature type filter
    if (creatureType) {
      where.creatureType = creatureType as string;
    }

    // Get species with traits and raw content (no pagination for small dataset)
    const species = await prisma.canonSpecies.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        raw: true,
        traits: true,
        creatureTypeRef: true
      }
    });

    // Transform to include mechanics at top level for frontend
    const transformed = species.map(s => ({
      ...s,
      mechanics: s.raw?.raw || {} // Full 5etools structure
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching species:', error);
    res.status(500).json({ error: 'Failed to fetch species' });
  }
});

// Get a single species by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID parameter is required' });
      return;
    }

    const species = await prisma.canonSpecies.findUnique({
      where: { id: BigInt(id) },
      include: {
        raw: true,
        traits: true,
        creatureTypeRef: true
      }
    });

    if (!species) {
      res.status(404).json({ error: 'Species not found' });
      return;
    }

    // Include mechanics at top level
    const result = {
      ...species,
      mechanics: species.raw?.raw || {}
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching species:', error);
    res.status(500).json({ error: 'Failed to fetch species' });
  }
});

// Get species by slug and source
router.get('/slug/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    if (!slug) {
      res.status(400).json({ error: 'Slug parameter is required' });
      return;
    }
    const { source } = req.query;
    const sourceStr = (source as string | undefined) || 'XPHB';

    const species = await prisma.canonSpecies.findUnique({
      where: {
        slug_source: {
          slug: slug,
          source: sourceStr
        }
      },
      include: {
        raw: true,
        traits: true,
        creatureTypeRef: true
      }
    });

    if (!species) {
      res.status(404).json({ error: 'Species not found' });
      return;
    }

    // Include mechanics at top level
    const result = {
      ...species,
      mechanics: species.raw?.raw || {}
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching species by slug:', error);
    res.status(500).json({ error: 'Failed to fetch species' });
  }
});

export default router;
