/**
 * Class Choices API Routes
 *
 * Endpoints for fetching D&D 2024 class choice data:
 * - Fighting Styles
 * - Divine Orders
 * - Eldritch Invocations
 * - Class Feature Choices
 */

import express from 'express';
import { prisma } from '../db';

const router = express.Router();

/**
 * GET /api/class-choices/fighting-styles
 * Get all fighting styles, optionally filtered by class
 */
router.get('/fighting-styles', async (req, res) => {
  try {
    const className = req.query.className as string | undefined;

    const fightingStyles = await prisma.fightingStyle.findMany({
      where: className ? {
        availableToClasses: {
          has: className
        }
      } : {},
      orderBy: { name: 'asc' }
    });

    res.json(fightingStyles);
  } catch (error) {
    console.error('Error fetching fighting styles:', error);
    res.status(500).json({ error: 'Failed to fetch fighting styles' });
  }
});

/**
 * GET /api/class-choices/divine-orders
 * Get all divine orders for Cleric
 */
router.get('/divine-orders', async (req, res) => {
  try {
    const divineOrders = await prisma.divineOrder.findMany({
      orderBy: { name: 'asc' }
    });

    res.json(divineOrders);
  } catch (error) {
    console.error('Error fetching divine orders:', error);
    res.status(500).json({ error: 'Failed to fetch divine orders' });
  }
});

/**
 * GET /api/class-choices/eldritch-invocations
 * Get eldritch invocations, optionally filtered by level
 */
router.get('/eldritch-invocations', async (req, res) => {
  try {
    const level = req.query.level as string | undefined;
    const warlockLevel = level ? parseInt(level) : 1;

    const invocations = await prisma.eldritchInvocation.findMany({
      where: {
        OR: [
          { levelRequirement: null },
          { levelRequirement: { lte: warlockLevel } }
        ]
      },
      orderBy: { name: 'asc' }
    });

    res.json(invocations);
  } catch (error) {
    console.error('Error fetching eldritch invocations:', error);
    res.status(500).json({ error: 'Failed to fetch eldritch invocations' });
  }
});

/**
 * GET /api/class-choices/class-data/:className
 * Get basic class data including features and proficiencies
 */
router.get('/class-data/:className', async (req, res) => {
  try {
    const { className } = req.params;

    // Find the class with full data
    const classData = await prisma.class.findFirst({
      where: { name: className },
      include: {
        subclasses: {
          include: {
            features: true
          }
        },
        featureChoices: {
          include: {
            options: true
          }
        }
      }
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    return res.json(classData);
  } catch (error) {
    console.error('Error fetching class data:', error);
    return res.status(500).json({ error: 'Failed to fetch class data' });
  }
});

/**
 * GET /api/class-choices/:className
 * Get all class feature choices for a specific class
 */
router.get('/:className', async (req, res) => {
  try {
    const { className } = req.params;
    const level = req.query.level as string | undefined;
    const characterLevel = level ? parseInt(level) : 1;

    // Find the class
    const classData = await prisma.class.findFirst({
      where: { name: className },
      include: {
        featureChoices: {
          where: {
            choiceLevel: { lte: characterLevel }
          },
          include: {
            options: true
          }
        }
      }
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get class-specific choices based on the class name
    let additionalChoices: any = {};

    if (className === 'Fighter') {
      additionalChoices.fightingStyles = await prisma.fightingStyle.findMany({
        where: {
          availableToClasses: {
            has: 'Fighter'
          }
        },
        orderBy: { name: 'asc' }
      });
    }

    if (className === 'Cleric') {
      additionalChoices.divineOrders = await prisma.divineOrder.findMany({
        orderBy: { name: 'asc' }
      });
    }

    if (className === 'Warlock') {
      additionalChoices.eldritchInvocations = await prisma.eldritchInvocation.findMany({
        where: {
          OR: [
            { levelRequirement: null },
            { levelRequirement: { lte: characterLevel } }
          ]
        },
        orderBy: { name: 'asc' }
      });
    }

    return res.json({
      class: classData,
      choices: additionalChoices
    });
  } catch (error) {
    console.error('Error fetching class choices:', error);
    return res.status(500).json({ error: 'Failed to fetch class choices' });
  }
});

export default router;
