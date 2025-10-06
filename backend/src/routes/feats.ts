import { Router } from 'express';
import { Request, Response } from 'express';
import logger from '../utils/logger';
import { prisma } from '../db';

const router = Router();

// Get all feats
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, level, source, search } = req.query;

    // Build where clause for filtering
    const whereClause: any = {};

    if (category) {
      whereClause.category = category as string;
    }

    if (level) {
      // Filter by minimum level requirement in prerequisites
      // This is a simplified filter - in practice, prerequisites are complex
      const levelNum = parseInt(level as string);
      if (!isNaN(levelNum)) {
        whereClause.prerequisites = {
          path: ['level'],
          lte: levelNum,
        };
      }
    }

    if (source) {
      whereClause.source = source as string;
    }

    if (search) {
      whereClause.name = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const feats = await prisma.feat.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    return res.json(feats);
  } catch (error) {
    logger.error('Error fetching feats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      statusCode: 500,
      code: 'server_error',
      error: 'Failed to fetch feats',
      details: errorMessage
    });
  }
});

// Get a single feat by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Feat ID is required' });
    }

    const feat = await prisma.feat.findUnique({
      where: { id: parseInt(id) },
    });

    if (!feat) {
      return res.status(404).json({ error: 'Feat not found' });
    }

    return res.json(feat);
  } catch (error) {
    logger.error('Error fetching feat:', error);
    return res.status(500).json({ error: 'Failed to fetch feat' });
  }
});

// Get a feat by name
router.get('/name/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({ error: 'Feat name is required' });
    }

    const feat = await prisma.feat.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (!feat) {
      return res.status(404).json({ error: 'Feat not found' });
    }

    return res.json(feat);
  } catch (error) {
    logger.error('Error fetching feat by name:', error);
    return res.status(500).json({ error: 'Failed to fetch feat' });
  }
});

// Get feats by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const feats = await prisma.feat.findMany({
      where: {
        category: {
          equals: category,
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json(feats);
  } catch (error) {
    logger.error('Error fetching feats by category:', error);
    return res.status(500).json({ error: 'Failed to fetch feats by category' });
  }
});

export default router;
