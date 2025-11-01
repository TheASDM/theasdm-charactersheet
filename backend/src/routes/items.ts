import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Get all items with optional filters and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '100',
      search = '',
      source = '',
      itemType = '',
      category = '',
      rarity = '',
      requiresAttunement = ''
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

    // Add item type filter (e.g., "Weapon", "Armor", "Potion")
    if (itemType) {
      where.itemType = itemType as string;
    }

    // Add category filter
    if (category) {
      where.category = category as string;
    }

    // Add rarity filter (e.g., "Common", "Uncommon", "Rare")
    if (rarity) {
      where.rarity = rarity as string;
    }

    // Add attunement filter
    if (requiresAttunement) {
      where.requiresAttunement = requiresAttunement === 'true';
    }

    // Get total count
    const total = await prisma.canonItem.count({ where });

    // Get items with raw content and damage type
    const items = await prisma.canonItem.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { name: 'asc' },
      include: {
        raw: true,
        damageType: true
      }
    });

    // Return paginated format
    res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get a single item by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID parameter is required' });
      return;
    }

    const item = await prisma.canonItem.findUnique({
      where: { id: BigInt(id) },
      include: {
        raw: true,
        damageType: true
      }
    });

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Get item by slug and source
router.get('/slug/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    if (!slug) {
      res.status(400).json({ error: 'Slug parameter is required' });
      return;
    }
    const { source } = req.query;
    const sourceStr = (source as string | undefined) || 'XPHB';

    const item = await prisma.canonItem.findUnique({
      where: {
        slug_source: {
          slug: slug,
          source: sourceStr
        }
      },
      include: {
        raw: true,
        damageType: true
      }
    });

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item by slug:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

export default router;
