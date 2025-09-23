import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import logger from './utils/logger';

// Routes
import authRoutes from './routes/auth';
import characterRoutes from './routes/characters';
import spellRoutes from './routes/spells';
import classRoutes from './routes/classes';
import raceRoutes from './routes/races';
import backgroundRoutes from './routes/backgrounds';
import itemRoutes from './routes/items';
import campaignRoutes from './routes/campaigns';

// Load environment variables
dotenv.config();

// Initialize Prisma
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Create Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO for real-time updates
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/spells', spellRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/races', raceRoutes);
app.use('/api/backgrounds', backgroundRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/campaigns', campaignRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join character room for real-time updates
  socket.on('join-character', (characterId: string) => {
    socket.join(`character-${characterId}`);
    logger.info(`Socket ${socket.id} joined character-${characterId}`);
  });

  // Handle character updates
  socket.on('character-update', (data) => {
    socket.to(`character-${data.characterId}`).emit('character-updated', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔌 Socket.IO server initialized`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('👋 SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  logger.info('👋 SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('✅ Server closed successfully');
    process.exit(0);
  });
});

export { io };
export default app;
