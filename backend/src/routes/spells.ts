import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Get all spells with optional filtering
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

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      level,
      school,
      search,
      q,
      className,
      classId,
      ritual,
      concentration,
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100); // Cap at 100
    const offset = (pageNum - 1) * limitNum;

    const andConditions: any[] = [];

    if (level !== undefined) {
      const parsedLevel = parseInt(level as string);
      if (!Number.isNaN(parsedLevel)) {
        andConditions.push({ level: parsedLevel });
      }
    }

    if (school && typeof school === 'string') {
      andConditions.push({ school });
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

    const classSpellFilter: any = {};
    if (classId !== undefined) {
      const parsedClassId = parseInt(classId as string);
      if (!Number.isNaN(parsedClassId)) {
        classSpellFilter.classId = parsedClassId;
      }
    }

    if (className && typeof className === 'string') {
      classSpellFilter.class = {
        name: {
          equals: className,
          mode: 'insensitive'
        }
      };
    }

    if (Object.keys(classSpellFilter).length > 0) {
      andConditions.push({
        classSpells: {
          some: classSpellFilter
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

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

    const [spells, total] = await Promise.all([
      prisma.spell.findMany({
        where: whereClause,
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
        skip: offset,
        take: limitNum,
        include: {
          classSpells: {
            select: {
              class: {
                select: {
                  name: true
                }
              }
            }
          }
        }
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
      where: { id: parseInt(id) },
      include: {
        classSpells: {
          select: {
            class: {
              select: {
                name: true
              }
            }
          }
        }
      }
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
