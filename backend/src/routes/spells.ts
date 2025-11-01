import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Get all spells with optional filters and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '100',
      search = '',
      source = '',
      level = '',
      schoolCode = '',
      ritual = '',
      concentration = '',
      classSlug = '',
      className = ''
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

    // Add spell level filter (0-9)
    if (level) {
      where.level = parseInt(level as string);
    }

    // Add school filter (e.g., "A" for Abjuration)
    if (schoolCode) {
      where.schoolCode = schoolCode as string;
    }

    // Add ritual filter
    if (ritual) {
      where.ritual = ritual === 'true';
    }

    // Add concentration filter
    if (concentration) {
      where.concentration = concentration === 'true';
    }

    // Filter by class using the classes array
    const classFilter = (className as string) || (classSlug as string);
    if (classFilter) {
      // Normalize class name (handle case variations)
      const normalizedClassName = classFilter.trim().toLowerCase();
      // Use array_contains operator (PostgreSQL)
      where.classes = {
        has: normalizedClassName
      };
    }

    // Get spells with all related data (excluding classLinks which doesn't exist yet)
    const spells = await prisma.canonSpell.findMany({
      where,
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ],
      include: {
        raw: true,
        school: true,
        damage: {
          include: {
            damageType: true
          }
        },
        conditions: {
          include: {
            condition: true
          }
        }
      }
    });

    // Get total count for pagination
    const total = await prisma.canonSpell.count({ where });

    // Transform to include mechanics from raw.content
    const transformed = spells.map(spell => ({
      ...spell,
      mechanics: spell.raw?.raw // Full 5etools structure for frontend parsing
    }));

    // Return paginated response
    res.json({
      items: transformed,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching spells:', error);
    res.status(500).json({ error: 'Failed to fetch spells' });
  }
});

// Get a single spell by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID parameter is required' });
      return;
    }

    const spell = await prisma.canonSpell.findUnique({
      where: { id: BigInt(id) },
      include: {
        raw: true,
        school: true,
        damage: {
          include: {
            damageType: true
          }
        },
        conditions: {
          include: {
            condition: true
          }
        }
      }
    });

    if (!spell) {
      res.status(404).json({ error: 'Spell not found' });
      return;
    }

    // Transform to include mechanics from raw.content
    const transformed = {
      ...spell,
      mechanics: spell.raw?.raw // Full 5etools structure for frontend parsing
    };

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching spell:', error);
    res.status(500).json({ error: 'Failed to fetch spell' });
  }
});

// Get spell by slug and source
router.get('/slug/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    if (!slug) {
      res.status(400).json({ error: 'Slug parameter is required' });
      return;
    }
    const { source } = req.query;
    const sourceStr = (source as string | undefined) || 'XPHB';

    const spell = await prisma.canonSpell.findUnique({
      where: {
        slug_source: {
          slug: slug,
          source: sourceStr
        }
      },
      include: {
        raw: true,
        school: true,
        damage: {
          include: {
            damageType: true
          }
        },
        conditions: {
          include: {
            condition: true
          }
        }
      }
    });

    if (!spell) {
      res.status(404).json({ error: 'Spell not found' });
      return;
    }

    // Transform to include mechanics from raw.content
    const transformed = {
      ...spell,
      mechanics: spell.raw?.raw // Full 5etools structure for frontend parsing
    };

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching spell by slug:', error);
    res.status(500).json({ error: 'Failed to fetch spell' });
  }
});

export default router;
