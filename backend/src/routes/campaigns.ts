import { Router } from 'express';

const router = Router();

// TODO: Implement campaign routes
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Campaign routes not implemented yet' });
});

export default router;
