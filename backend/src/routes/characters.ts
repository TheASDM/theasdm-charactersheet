import { Router, Response } from 'express';
import { authenticate, optionalAuthenticate, AuthRequest } from '../middleware/auth';
import { createCharacterLimiter } from '../middleware/rateLimiter';
import { checkForSQLInjection, sanitizeCharacterInput } from '../middleware/sanitize';
import { prisma } from '../db';

const router = Router();

/**
 * Get all characters
 * - If authenticated: returns user's characters and public characters
 * - If not authenticated: returns only public characters
 * GET /api/characters
 */
router.get('/', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.query;

    let whereClause: any = {};

    if (userId) {
      // Filter by specific user ID (if provided in query)
      whereClause = { userId: parseInt(userId as string) };
    } else if (req.user) {
      // If authenticated, show user's own characters and public characters
      whereClause = {
        OR: [
          { userId: req.user.id },
          { isPublic: true }
        ]
      };
    } else {
      // If not authenticated, show only public characters
      whereClause = { isPublic: true };
    }

    const characters = await prisma.character.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, username: true }
        },
        campaign: {
          select: { id: true, name: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(characters);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

/**
 * Get a single character by ID
 * - Must be owned by user OR be public
 * GET /api/characters/:id
 */
router.get('/:id', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Character ID is required' });
    }

    const character = await prisma.character.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { id: true, username: true }
        },
        campaign: {
          select: { id: true, name: true }
        }
      }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Check if user has permission to view this character
    if (!character.isPublic && (!req.user || character.userId !== req.user.id)) {
      return res.status(403).json({ error: 'You do not have permission to view this character' });
    }

    return res.json(character);
  } catch (error) {
    console.error('Error fetching character:', error);
    return res.status(500).json({ error: 'Failed to fetch character' });
  }
});

/**
 * Create a new character
 * Requires authentication
 * POST /api/characters
 */
router.post(
  '/',
  authenticate,
  createCharacterLimiter,
  checkForSQLInjection,
  sanitizeCharacterInput,
  async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, level = 1, characterData, isPublic = false, campaignId } = req.body;

    if (!name || !characterData) {
      return res.status(400).json({ error: 'Missing required fields: name, characterData' });
    }

    const character = await prisma.character.create({
      data: {
        userId: req.user.id,
        name,
        level: parseInt(level),
        characterData,
        isPublic,
        campaignId: campaignId ? parseInt(campaignId) : null
      },
      include: {
        user: {
          select: { id: true, username: true }
        },
        campaign: {
          select: { id: true, name: true }
        }
      }
    });

    return res.status(201).json(character);
  } catch (error) {
    console.error('Error creating character:', error);
    return res.status(500).json({ error: 'Failed to create character' });
  }
  }
);

/**
 * Update a character
 * Must be owned by authenticated user
 * PUT /api/characters/:id
 */
router.put(
  '/:id',
  authenticate,
  checkForSQLInjection,
  sanitizeCharacterInput,
  async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { name, level, characterData, isPublic, campaignId, spellbook, resources } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Character ID is required' });
    }

    // Check if character exists and belongs to user
    const existingCharacter = await prisma.character.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCharacter) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (existingCharacter.userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this character' });
    }

    if (spellbook !== undefined) {
      if (!spellbook || typeof spellbook !== 'object' || Array.isArray(spellbook)) {
        return res.status(400).json({ error: 'Invalid spellbook payload' });
      }

      const { known, prepared } = spellbook as { known?: unknown; prepared?: unknown };
      if (known !== undefined && (!Array.isArray(known) || !known.every((item) => typeof item === 'string'))) {
        return res.status(400).json({ error: 'spellbook.known must be an array of strings' });
      }
      if (prepared !== undefined && (!Array.isArray(prepared) || !prepared.every((item) => typeof item === 'string'))) {
        return res.status(400).json({ error: 'spellbook.prepared must be an array of strings' });
      }
    }

    if (resources !== undefined) {
      if (!resources || typeof resources !== 'object' || Array.isArray(resources)) {
        return res.status(400).json({ error: 'Invalid resources payload' });
      }

      const { manaCurrent, manaMax } = resources as { manaCurrent?: unknown; manaMax?: unknown };
      if (manaCurrent !== undefined && typeof manaCurrent !== 'number') {
        return res.status(400).json({ error: 'resources.manaCurrent must be a number' });
      }
      if (manaMax !== undefined && typeof manaMax !== 'number') {
        return res.status(400).json({ error: 'resources.manaMax must be a number' });
      }
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (name) {
      dataToUpdate.name = name;
    }

    if (level) {
      dataToUpdate.level = parseInt(level);
    }

    if (typeof isPublic === 'boolean') {
      dataToUpdate.isPublic = isPublic;
    }

    if (campaignId !== undefined) {
      dataToUpdate.campaignId = campaignId ? parseInt(campaignId) : null;
    }

    let updatedCharacterData: unknown = characterData !== undefined
      ? characterData
      : existingCharacter.characterData;

    if (spellbook !== undefined || resources !== undefined) {
      const baseFromRequest = (
        updatedCharacterData &&
        typeof updatedCharacterData === 'object' &&
        !Array.isArray(updatedCharacterData)
      )
        ? { ...(updatedCharacterData as Record<string, unknown>) }
        : {};

      const baseFromExisting = (
        typeof existingCharacter.characterData === 'object' &&
        existingCharacter.characterData !== null &&
        !Array.isArray(existingCharacter.characterData)
      )
        ? existingCharacter.characterData as Record<string, unknown>
        : {};

      const combinedBase = {
        ...baseFromExisting,
        ...baseFromRequest,
      };

      if (spellbook !== undefined) {
        const incomingSpellbook = spellbook as Record<string, unknown>;
        combinedBase.spellbook = {
          ...(typeof combinedBase.spellbook === 'object' && !Array.isArray(combinedBase.spellbook)
            ? combinedBase.spellbook as Record<string, unknown>
            : {}),
          ...incomingSpellbook,
        };
      }

      if (resources !== undefined) {
        const incomingResources = resources as Record<string, unknown>;
        combinedBase.resources = {
          ...(typeof combinedBase.resources === 'object' && !Array.isArray(combinedBase.resources)
            ? combinedBase.resources as Record<string, unknown>
            : {}),
          ...incomingResources,
        };
      }

      updatedCharacterData = combinedBase;
    }

    if (
      characterData !== undefined ||
      spellbook !== undefined ||
      resources !== undefined
    ) {
      dataToUpdate.characterData = updatedCharacterData;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.json(existingCharacter);
    }

    const character = await prisma.character.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      include: {
        user: {
          select: { id: true, username: true }
        },
        campaign: {
          select: { id: true, name: true }
        }
      }
    });

    return res.json(character);
  } catch (error) {
    console.error('Error updating character:', error);
    return res.status(500).json({ error: 'Failed to update character' });
  }
  }
);

/**
 * Update character class choices
 * Allows storing a single choice selection without overwriting the entire character
 * PATCH /api/characters/:id/choices
 */
router.patch('/:id/choices', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { choiceGroupId, selectedFeatureIds } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Character ID is required' });
    }

    if (!choiceGroupId || !Array.isArray(selectedFeatureIds)) {
      return res.status(400).json({
        error: 'Missing required fields: choiceGroupId (string), selectedFeatureIds (array)'
      });
    }

    // Check if character exists and belongs to user
    const existingCharacter = await prisma.character.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCharacter) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (existingCharacter.userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this character' });
    }

    // Get current character data
    const characterData = existingCharacter.characterData as any;

    // Update selectedClassChoices
    const updatedCharacterData = {
      ...characterData,
      selectedClassChoices: {
        ...(characterData.selectedClassChoices || {}),
        [choiceGroupId]: selectedFeatureIds
      }
    };

    // Save updated character
    const character = await prisma.character.update({
      where: { id: parseInt(id) },
      data: { characterData: updatedCharacterData },
      include: {
        user: {
          select: { id: true, username: true }
        },
        campaign: {
          select: { id: true, name: true }
        }
      }
    });

    return res.json({
      success: true,
      character,
      choiceApplied: {
        choiceGroupId,
        selectedFeatureIds
      }
    });
  } catch (error) {
    console.error('Error updating character choices:', error);
    return res.status(500).json({ error: 'Failed to update character choices' });
  }
});

/**
 * Delete a character
 * Must be owned by authenticated user
 * DELETE /api/characters/:id
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Character ID is required' });
    }

    // Check if character exists and belongs to user
    const existingCharacter = await prisma.character.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCharacter) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (existingCharacter.userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this character' });
    }

    await prisma.character.delete({
      where: { id: parseInt(id) }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting character:', error);
    return res.status(500).json({ error: 'Failed to delete character' });
  }
});

export default router;
