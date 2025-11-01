import { Router } from 'express';
import { Request, Response } from 'express';
// import { prisma } from '../db';

const router = Router();

// TODO: Update to use new Canon models
// Old generator used deprecated models for character generation

router.post('/random', async (req: Request, res: Response) => {
  return res.status(501).json({ error: 'Character generator not yet implemented for new schema' });
});

router.get('/progress', async (req: Request, res: Response) => {
  return res.status(501).json({ error: 'Character generator not yet implemented for new schema' });
});

export default router;
