import { Request, Response } from 'express';
import { githubService } from '../services/github.service';
import { SearchQuery } from '../types/github.types';
import logger from '../utils/logger';

/**
 * Repository Controller
 * Handles HTTP requests for repository search
 */
export class RepositoryController {
  /**
   * Search repositories
   * GET /api/repositories/search
   */
  async searchRepositories(req: Request, res: Response): Promise<void> {
    logger.info('Repository search request received', {
      query: req.query,
      ip: req.ip,
    });

    // Extract and type query parameters (already validated by middleware)
    const searchQuery: SearchQuery = {
      language: req.query.language as string | undefined,
      createdAfter: req.query.createdAfter as string | undefined,
      sort: req.query.sort as 'score' | 'stars' | 'forks' | 'updated' | undefined,
      order: req.query.order as 'asc' | 'desc' | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      perPage: req.query.perPage ? Number(req.query.perPage) : undefined,
    };

    // Call GitHub service
    const result = await githubService.searchRepositories(searchQuery);

    logger.info('Repository search completed successfully', {
      total_count: result.total_count,
      items_returned: result.items.length,
      page: result.page,
    });

    // Return results
    res.status(200).json(result);
  }
}

// Export singleton instance
export const repositoryController = new RepositoryController();