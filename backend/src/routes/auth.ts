import { Router } from 'express';

const router = Router();

// TODO: Implement authentication routes
router.post('/register', (req, res) => {
  res
    .status(501)
    .json({ message: 'Authentication routes not implemented yet' });
});

router.post('/login', (req, res) => {
  res
    .status(501)
    .json({ message: 'Authentication routes not implemented yet' });
});

router.post('/logout', (req, res) => {
  res
    .status(501)
    .json({ message: 'Authentication routes not implemented yet' });
});

export default router;
