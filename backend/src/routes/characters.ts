import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Get all characters (optionally filtered by user)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    const whereClause = userId ? { userId: parseInt(userId as string) } : {};
    
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

// Get a single character by ID
router.get('/:id', async (req: Request, res: Response) => {
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

    return res.json(character);
  } catch (error) {
    console.error('Error fetching character:', error);
    return res.status(500).json({ error: 'Failed to fetch character' });
  }
});

// Create a new character
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, name, level = 1, characterData, isPublic = false, campaignId } = req.body;

    if (!userId || !name || !characterData) {
      return res.status(400).json({ error: 'Missing required fields: userId, name, characterData' });
    }

    const character = await prisma.character.create({
      data: {
        userId: parseInt(userId),
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
});

// Update a character
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, level, characterData, isPublic, campaignId } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Character ID is required' });
    }

    const character = await prisma.character.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(level && { level: parseInt(level) }),
        ...(characterData && { characterData }),
        ...(typeof isPublic === 'boolean' && { isPublic }),
        ...(campaignId !== undefined && { campaignId: campaignId ? parseInt(campaignId) : null })
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

    return res.json(character);
  } catch (error) {
    console.error('Error updating character:', error);
    return res.status(500).json({ error: 'Failed to update character' });
  }
});

// Delete a character
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Character ID is required' });
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
