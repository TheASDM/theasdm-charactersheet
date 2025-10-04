import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

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

// Get spells for a specific class
const TRUE_QUERY_VALUES = new Set(['true', '1', 'yes', 'y', 'on', 'ritual', 'concentration']);
const FALSE_QUERY_VALUES = new Set(['false', '0', 'no', 'n', 'off', 'non']);

const parseBooleanQuery = (value: unknown): boolean | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const raw = Array.isArray(value) ? value[value.length - 1] : value;
  if (typeof raw !== 'string') {
    return null;
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === 'any' || normalized === 'all') {
    return null;
  }

  if (TRUE_QUERY_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_QUERY_VALUES.has(normalized)) {
    return false;
  }

  return null;
};

router.get('/:id/spells', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { level, search, q, ritual, concentration, page = '1', limit = '50' } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 200); // Higher cap for spell lists
    const offset = (pageNum - 1) * limitNum;

    // Build where clause for spells
    const classIdNum = parseInt(id);
    const andConditions: any[] = [
      {
        classSpells: {
          some: {
            classId: classIdNum
          }
        }
      }
    ];

    if (level !== undefined) {
      const parsedLevel = parseInt(level as string);
      if (!Number.isNaN(parsedLevel)) {
        andConditions.push({ level: parsedLevel });
      }
    }

    const searchTerm = (typeof q === 'string' && q.trim().length > 0)
      ? q
      : (typeof search === 'string' ? search : undefined);

    if (searchTerm) {
      andConditions.push({
        name: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      });
    }

    const ritualFilter = parseBooleanQuery(ritual);
    if (ritualFilter !== null) {
      andConditions.push({ isRitual: ritualFilter });
    }

    const concentrationFilter = parseBooleanQuery(concentration);
    if (concentrationFilter !== null) {
      if (concentrationFilter) {
        andConditions.push({
          duration: {
            path: ['0', 'concentration'],
            equals: true
          }
        });
      } else {
        andConditions.push({
          NOT: {
            duration: {
              path: ['0', 'concentration'],
              equals: true
            }
          }
        });
      }
    }

    const whereClause = andConditions.length > 1 ? { AND: andConditions } : andConditions[0];

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
    console.error('Error fetching class spells:', error);
    return res.status(500).json({ error: 'Failed to fetch class spells' });
  }
});

// Get spell count by level for a class
router.get('/:id/spell-stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    // Get count of spells by level
    const spellsByLevel = await prisma.classSpell.groupBy({
      by: ['spellId'],
      where: {
        classId: parseInt(id)
      }
    });

    // Get all spell details for this class
    const spells = await prisma.spell.findMany({
      where: {
        classSpells: {
          some: {
            classId: parseInt(id)
          }
        }
      },
      select: {
        level: true
      }
    });

    // Count by level
    const levelCounts = spells.reduce((acc: Record<number, number>, spell) => {
      acc[spell.level] = (acc[spell.level] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      total: spells.length,
      byLevel: levelCounts
    });
  } catch (error) {
    console.error('Error fetching class spell stats:', error);
    return res.status(500).json({ error: 'Failed to fetch class spell stats' });
  }
});

export default router;
