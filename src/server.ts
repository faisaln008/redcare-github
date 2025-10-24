import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import config from './config';
import logger from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

// Express Application Setup

class Server {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  // Initialize middlewares
  private initializeMiddlewares(): void {
    // CORS
    this.app.use(
      cors({
        origin: '*', // In production, specify allowed origins
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, _res: Response, next) => {
      logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
      });
      next();
    });

    // Trust proxy (for rate limiting, IP detection behind reverse proxy)
    this.app.set('trust proxy', 1);

    // Apply rate limiting to all routes
    this.app.use(apiRateLimiter);
  }

  // Initialize routes
  private initializeRoutes(): void {
    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        message: 'GitHub Repository Search API',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          rateLimit: '/api/rate-limit',
          search: '/api/repositories/search',
        },
        documentation: 'See README.md for API documentation',
      });
    });

    // API routes
    this.app.use('/api', routes);
  }

  // Initialize error handling
  private initializeErrorHandling(): void {
    // 404 handler (must be after all routes)
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  // Start server
  public listen(): void {
    this.app.listen(this.port, () => {
      logger.info(`Server started successfully`, {
        port: this.port,
        environment: config.nodeEnv,
        githubTokenConfigured: !!config.github.token,
      });
      
      logger.info('API Endpoints:', {
        root: `http://localhost:${this.port}/`,
        health: `http://localhost:${this.port}/api/health`,
        rateLimit: `http://localhost:${this.port}/api/rate-limit`,
        search: `http://localhost:${this.port}/api/repositories/search`,
      });

      if (!config.github.token) {
        logger.warn('GitHub token not configured. Rate limits will be lower (10 req/min vs 30 req/min)');
        logger.warn('Set GITHUB_TOKEN environment variable to increase rate limits');
      }
    });
  }

  /**
   * Get Express app instance (for testing)
   */
  public getApp(): Application {
    return this.app;
  }
}

// Create and start server
const server = new Server();

// Start listening (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
  server.listen();
}

// Export for testing
export default server.getApp();

