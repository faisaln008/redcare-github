import { Router } from 'express';
import { repositoryController } from '../controllers/repository.controller';
import { validateSearchQuery } from '../middleware/validator';
import { asyncHandler } from '../middleware/errorHandler';
import { searchRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Repository Routes
 */

/**
 * Search GitHub repositories with filters and popularity scoring
 */
router.get(
  '/search',
  searchRateLimiter, // Stricter rate limit for search endpoint
  validateSearchQuery,
  asyncHandler(repositoryController.searchRepositories.bind(repositoryController))
);

export default router;

