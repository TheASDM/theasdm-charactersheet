import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Transformation helpers to convert 5etools format to wizard-expected format

// Group features by level into classFeatures structure
const groupFeaturesByLevel = (features: any[]): Record<string, any[]> => {
  if (!Array.isArray(features)) return {};

  return features.reduce((acc, feature) => {
    const level = feature.level || 1;
    const levelKey = level.toString();
    if (!acc[levelKey]) acc[levelKey] = [];
    acc[levelKey].push(feature);
    return acc;
  }, {} as Record<string, any[]>);
};

// Transform ability score objects to readable ability names
const transformAbilities = (abilities: any[]): string[] => {
  if (!Array.isArray(abilities)) return [];

  const abilityMap: Record<string, string> = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma'
  };

  return abilities.flatMap(ability => {
    if (typeof ability === 'string') {
      return abilityMap[ability.toLowerCase()] || ability;
    }
    if (typeof ability === 'object') {
      // Handle format like { str: true, dex: true }
      return Object.keys(ability)
        .filter(key => ability[key])
        .map(key => abilityMap[key.toLowerCase()] || key);
    }
    return [];
  });
};

// Transform saving throw abbreviations to capitalized full names
const transformSaves = (saves: any[]): string[] => {
  if (!Array.isArray(saves)) return [];

  const abilityMap: Record<string, string> = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma'
  };

  return saves.map(save => {
    if (typeof save === 'string') {
      return abilityMap[save.toLowerCase()] || save;
    }
    return save;
  });
};

// Get all classes from database
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search = '' } = req.query;

    // Fetch classes directly from raw.content (source of truth)
    const classes = await prisma.rawContent.findMany({
      where: {
        kind: 'class',
        source: 'XPHB',
        ...(search ? {
          title: {
            contains: search as string,
            mode: 'insensitive'
          }
        } : {})
      },
      orderBy: { title: 'asc' }
    });

    // Normalize proficiencies helper
    const normalizeProficiencies = (prof: any) => {
      if (!prof) return {};

      const normalize = (items: any[]): string[] => {
        if (!Array.isArray(items)) return [];
        return items.map((item: any) => {
          if (typeof item === 'string') {
            // Convert "simple" -> "Simple Weapons", "martial" -> "Martial Weapons"
            if (item === 'simple') return 'Simple Weapons';
            if (item === 'martial') return 'Martial Weapons';
            if (item === 'light') return 'Light Armor';
            if (item === 'medium') return 'Medium Armor';
            if (item === 'heavy') return 'Heavy Armor';
            if (item === 'shield') return 'Shields';
            return item;
          }
          return item;
        });
      };

      return {
        armor: normalize(prof.armor || []),
        weapons: normalize(prof.weapons || []),
        tools: normalize(prof.tools || []),
        skills: prof.skills || [],
        savingThrows: prof.savingThrows || []
      };
    };

    // Transform to match frontend expectations
    const transformed = classes.map(c => {
      const rawData = c.raw as any;

      // Find the XPHB class entry (D&D 2024 version)
      // IMPORTANT: Do NOT fall back to rawData.class[0] - that would be PHB (2014)
      const xphbClass = rawData.class?.find((cls: any) => cls.source === 'XPHB');

      if (!xphbClass) {
        console.error(`No XPHB data found for class: ${c.title}`);
        return null; // Will be filtered out below
      }

      // Filter classFeature array to only include XPHB (D&D 2024) features
      const classFeatures = (rawData.classFeature || []).filter((f: any) => f.source === 'XPHB');

      const name = xphbClass.name || rawData.name || c.title;
      return {
        id: c.id.toString(),
        name, // For compatibility
        className: name, // New field
        slug: c.slug,
        source: c.source,
        // Extract basic info from XPHB class entry
        hitDie: xphbClass.hd?.faces,
        primaryAbilities: transformAbilities(xphbClass.primaryAbility || []),
        savingThrows: transformSaves(xphbClass.proficiency || []),
        proficiencies: normalizeProficiencies(xphbClass.startingProficiencies),
        spellcastingAbility: xphbClass.spellcastingAbility,
        subclassTitle: xphbClass.subclassTitle,
        // Include full raw 5etools structure with classFeature array
        mechanics: rawData,
        // Extract features array - ONLY XPHB features, preserving entries structure!
        features: classFeatures,
        // Group features by level for wizard compatibility
        classFeatures: groupFeaturesByLevel(classFeatures)
      };
    }).filter(Boolean); // Remove null entries (classes without XPHB data)

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get a single class by name/ID
router.get('/:nameOrId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nameOrId } = req.params;
    if (!nameOrId) {
      res.status(400).json({ error: 'Class name or ID parameter is required' });
      return;
    }

    // Try to find by ID first (if it's a number)
    const idNum = parseInt(nameOrId);
    let classData;

    if (!isNaN(idNum)) {
      classData = await prisma.rawContent.findUnique({
        where: {
          id: BigInt(idNum)
        }
      });
    } else {
      // Find by slug or title (case-insensitive)
      const classSlug = nameOrId.toLowerCase();
      classData = await prisma.rawContent.findFirst({
        where: {
          kind: 'class',
          source: 'XPHB',
          OR: [
            { slug: classSlug },
            {
              title: {
                equals: nameOrId,
                mode: 'insensitive'
              }
            }
          ]
        }
      });
    }

    if (!classData) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }

    const rawData = classData.raw as any;

    // Find the XPHB class entry (D&D 2024 version)
    // IMPORTANT: Do NOT fall back to rawData.class[0] - that would be PHB (2014)
    const xphbClass = rawData.class?.find((cls: any) => cls.source === 'XPHB');

    if (!xphbClass) {
      res.status(404).json({
        error: 'Class not found',
        message: 'Only 2024 Player\'s Handbook (XPHB) classes are supported'
      });
      return;
    }

    // Filter classFeature array to only include XPHB (D&D 2024) features
    const classFeatures = (rawData.classFeature || []).filter((f: any) => f.source === 'XPHB');

    // Normalize proficiencies to the format expected by the frontend
    const normalizeProficiencies = (prof: any) => {
      if (!prof) return {};

      const normalize = (items: any[]): string[] => {
        if (!Array.isArray(items)) return [];
        return items.map((item: any) => {
          if (typeof item === 'string') {
            // Convert "simple" -> "Simple Weapons", "martial" -> "Martial Weapons"
            if (item === 'simple') return 'Simple Weapons';
            if (item === 'martial') return 'Martial Weapons';
            if (item === 'light') return 'Light Armor';
            if (item === 'medium') return 'Medium Armor';
            if (item === 'heavy') return 'Heavy Armor';
            if (item === 'shield') return 'Shields';
            return item;
          }
          return item;
        });
      };

      return {
        armor: normalize(prof.armor || []),
        weapons: normalize(prof.weapons || []),
        tools: normalize(prof.tools || []),
        skills: prof.skills || [],
        savingThrows: prof.savingThrows || []
      };
    };

    const name = xphbClass.name || rawData.name || classData.title;
    const transformed = {
      id: classData.id.toString(),
      name, // For compatibility
      className: name, // New field
      slug: classData.slug,
      source: classData.source,
      // Extract basic info from XPHB class entry
      hitDie: xphbClass.hd?.faces,
      primaryAbilities: transformAbilities(xphbClass.primaryAbility || []),
      savingThrows: transformSaves(xphbClass.proficiency || []),
      proficiencies: normalizeProficiencies(xphbClass.startingProficiencies),
      spellcastingAbility: xphbClass.spellcastingAbility,
      subclassTitle: xphbClass.subclassTitle,
      // Include full raw 5etools structure
      mechanics: rawData,
      // Extract features array - ONLY XPHB features, preserving entries structure!
      features: classFeatures,
      // Group features by level for wizard compatibility
      classFeatures: groupFeaturesByLevel(classFeatures)
    };

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

export default router;
