import { Router } from 'express';
import repositoryRoutes from './repository.routes';
import { systemController } from '../controllers/system.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Health check endpoint
 * @route GET /api/health
 */
router.get('/health', asyncHandler(systemController.getHealth.bind(systemController)));

/**
 * Rate limit status endpoint
 * @route GET /api/rate-limit
 */
router.get('/rate-limit', asyncHandler(systemController.getRateLimit.bind(systemController)));

/**
 * Repository routes
 * @route /api/repositories/*
 */
router.use('/repositories', repositoryRoutes);

export default router;

