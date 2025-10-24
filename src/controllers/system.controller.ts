import { Request, Response } from 'express';
import { githubService } from '../services/github.service';

/**
 * System Controller
 * Handles infrastructure and system-related endpoints
 */
export class SystemController {
  /**
   * Get API health status
   * GET /api/health
   */
  async getHealth(_req: Request, res: Response): Promise<void> {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(health);
  }

  /**
   * Get GitHub API rate limit status
   * GET /api/rate-limit
   */
  async getRateLimit(_req: Request, res: Response): Promise<void> {
    const rateLimitStatus = await githubService.getRateLimitStatus();
    res.status(200).json(rateLimitStatus);
  }
}

// Export singleton instance
export const systemController = new SystemController();
