import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Get all items with optional filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, rarity, search, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100); // Cap at 100
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: any = {};

    if (type) {
      whereClause.type = type as string;
    }

    if (rarity) {
      whereClause.rarity = rarity as string;
    }

    if (search) {
      whereClause.name = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        skip: offset,
        take: limitNum,
      }),
      prisma.item.count({ where: whereClause }),
    ]);

    return res.json({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    return res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get a single item by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    const item = await prisma.item.findUnique({
      where: { id: parseInt(id) },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Get items by type
router.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (!type) {
      return res.status(400).json({ error: 'Item type is required' });
    }

    const items = await prisma.item.findMany({
      where: { type: decodeURIComponent(type) },
      orderBy: { name: 'asc' },
    });

    return res.json(items);
  } catch (error) {
    console.error('Error fetching items by type:', error);
    return res.status(500).json({ error: 'Failed to fetch items by type' });
  }
});

// Get weapons specifically
router.get('/category/weapons', async (req: Request, res: Response) => {
  try {
    const weapons = await prisma.item.findMany({
      where: {
        OR: [
          { type: 'weapon' },
          { type: 'M' }, // Melee weapon
          { type: 'R' }, // Ranged weapon
        ],
      },
      orderBy: { name: 'asc' },
    });

    return res.json(weapons);
  } catch (error) {
    console.error('Error fetching weapons:', error);
    return res.status(500).json({ error: 'Failed to fetch weapons' });
  }
});

// Get armor specifically
router.get('/category/armor', async (req: Request, res: Response) => {
  try {
    const armor = await prisma.item.findMany({
      where: {
        OR: [
          { type: 'armor' },
          { type: 'LA' }, // Light armor
          { type: 'MA' }, // Medium armor
          { type: 'HA' }, // Heavy armor
          { type: 'S' }, // Shield
        ],
      },
      orderBy: { name: 'asc' },
    });

    return res.json(armor);
  } catch (error) {
    console.error('Error fetching armor:', error);
    return res.status(500).json({ error: 'Failed to fetch armor' });
  }
});

export default router;
