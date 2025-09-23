import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Get all spells with optional filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { level, school, search, page = '1', limit = '50' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100); // Cap at 100
    const offset = (pageNum - 1) * limitNum;
    
    // Build where clause
    const whereClause: any = {};
    
    if (level !== undefined) {
      whereClause.level = parseInt(level as string);
    }
    
    if (school) {
      whereClause.school = school as string;
    }
    
    if (search) {
      whereClause.name = {
        contains: search as string,
        mode: 'insensitive'
      };
    }
    
    const [spells, total] = await Promise.all([
      prisma.spell.findMany({
        where: whereClause,
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
        skip: offset,
        take: limitNum
      }),
      prisma.spell.count({ where: whereClause })
    ]);

    return res.json({
      spells,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching spells:', error);
    return res.status(500).json({ error: 'Failed to fetch spells' });
  }
});

// Get a single spell by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Spell ID is required' });
    }
    
    const spell = await prisma.spell.findUnique({
      where: { id: parseInt(id) }
    });

    if (!spell) {
      return res.status(404).json({ error: 'Spell not found' });
    }

    return res.json(spell);
  } catch (error) {
    console.error('Error fetching spell:', error);
    return res.status(500).json({ error: 'Failed to fetch spell' });
  }
});

// Get spells by level
router.get('/level/:level', async (req: Request, res: Response) => {
  try {
    const { level } = req.params;
    
    if (!level) {
      return res.status(400).json({ error: 'Spell level is required' });
    }
    
    const spells = await prisma.spell.findMany({
      where: { level: parseInt(level) },
      orderBy: { name: 'asc' }
    });

    return res.json(spells);
  } catch (error) {
    console.error('Error fetching spells by level:', error);
    return res.status(500).json({ error: 'Failed to fetch spells by level' });
  }
});

// Get spells by school
router.get('/school/:school', async (req: Request, res: Response) => {
  try {
    const { school } = req.params;
    
    if (!school) {
      return res.status(400).json({ error: 'Spell school is required' });
    }
    
    const spells = await prisma.spell.findMany({
      where: { school: school as string },
      orderBy: [{ level: 'asc' }, { name: 'asc' }]
    });

    return res.json(spells);
  } catch (error) {
    console.error('Error fetching spells by school:', error);
    return res.status(500).json({ error: 'Failed to fetch spells by school' });
  }
});

export default router;
