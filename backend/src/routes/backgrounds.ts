import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Get all backgrounds with optional filters and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      search = '',
      source = ''
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

    // Get backgrounds with raw content (no pagination for small dataset)
    const backgrounds = await prisma.canonBackground.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        raw: true
      }
    });

    // Transform to include mechanics at top level for frontend
    const transformed = backgrounds.map(b => ({
      ...b,
      mechanics: b.raw?.raw || {} // Full 5etools structure
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching backgrounds:', error);
    res.status(500).json({ error: 'Failed to fetch backgrounds' });
  }
});

// Get a single background by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID parameter is required' });
      return;
    }

    const background = await prisma.canonBackground.findUnique({
      where: { id: BigInt(id) },
      include: {
        raw: true
      }
    });

    if (!background) {
      res.status(404).json({ error: 'Background not found' });
      return;
    }

    // Include mechanics at top level
    const result = {
      ...background,
      mechanics: background.raw?.raw || {}
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching background:', error);
    res.status(500).json({ error: 'Failed to fetch background' });
  }
});

// Get background by slug and source
router.get('/slug/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    if (!slug) {
      res.status(400).json({ error: 'Slug parameter is required' });
      return;
    }
    const { source } = req.query;
    const sourceStr = (source as string | undefined) || 'XPHB';

    const background = await prisma.canonBackground.findUnique({
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

    if (!background) {
      res.status(404).json({ error: 'Background not found' });
      return;
    }

    // Include mechanics at top level
    const result = {
      ...background,
      mechanics: background.raw?.raw || {}
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching background by slug:', error);
    res.status(500).json({ error: 'Failed to fetch background' });
  }
});

export default router;
