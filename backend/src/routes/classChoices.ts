import express from 'express';
// import { prisma } from '../db';

const router = express.Router();

// TODO: Update to use new Canon models
// Old routes used deprecated prisma.fightingStyle, prisma.divineOrder, prisma.eldritchInvocation

router.get('/fighting-styles', async (req, res) => {
  return res.status(501).json({ error: 'Class choices API not yet implemented for new schema' });
});

router.get('/divine-orders', async (req, res) => {
  return res.status(501).json({ error: 'Class choices API not yet implemented for new schema' });
});

router.get('/eldritch-invocations', async (req, res) => {
  return res.status(501).json({ error: 'Class choices API not yet implemented for new schema' });
});

router.get('/class-features/:className', async (req, res) => {
  return res.status(501).json({ error: 'Class choices API not yet implemented for new schema' });
});

export default router;
