import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Get all feats with optional filters and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '100',
      search = '',
      source = '',
      levelRequirement = '',
      repeatable = '',
      category = ''
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Add search filter
    if (search) {
      where.OR = [
        {
          name: {
            contains: search as string,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search as string,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Add source filter
    if (source) {
      where.source = source as string;
    }

    // Add level requirement filter
    if (levelRequirement) {
      const level = parseInt(levelRequirement as string);
      where.levelRequirement = level;
    }

    // Add repeatable filter
    if (repeatable) {
      where.repeatable = repeatable === 'true';
    }

    // Add category filter
    if (category) {
      where.category = category as string;
    }

    // Get feats with raw content (no pagination needed)
    const feats = await prisma.canonFeat.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        raw: true
      }
    });

    // Transform to include mechanics at top level for frontend
    const transformed = feats.map(f => ({
      ...f,
      mechanics: f.raw?.raw || {} // Full 5etools structure
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching feats:', error);
    res.status(500).json({ error: 'Failed to fetch feats' });
  }
});

// Get a single feat by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID parameter is required' });
      return;
    }

    const feat = await prisma.canonFeat.findUnique({
      where: { id: BigInt(id) },
      include: {
        raw: true
      }
    });

    if (!feat) {
      res.status(404).json({ error: 'Feat not found' });
      return;
    }

    // Include mechanics at top level
    const result = {
      ...feat,
      mechanics: feat.raw?.raw || {}
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching feat:', error);
    res.status(500).json({ error: 'Failed to fetch feat' });
  }
});

// Get feat by slug and source
router.get('/slug/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    if (!slug) {
      res.status(400).json({ error: 'Slug parameter is required' });
      return;
    }
    const { source } = req.query;
    const sourceStr = (source as string | undefined) || 'XPHB';

    const feat = await prisma.canonFeat.findUnique({
      where: {
        slug_source: {
          slug: slug,
          source: sourceStr
        }
      },
      include: {
        raw: true
      }
    });

    if (!feat) {
      res.status(404).json({ error: 'Feat not found' });
      return;
    }

    // Include mechanics at top level
    const result = {
      ...feat,
      mechanics: feat.raw?.raw || {}
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching feat by slug:', error);
    res.status(500).json({ error: 'Failed to fetch feat' });
  }
});

export default router;
