import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, GitHubAPIError, RateLimitError } from '../utils/errors';
import { ErrorResponse } from '../types/github.types';
import logger from '../utils/logger';
import config from '../config';

/**
 * Global error handling middleware
 * Catches all errors and returns appropriate responses
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    query: req.query,
  });

  // Handle known application errors
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: err.constructor.name,
      message: err.message,
      statusCode: err.statusCode,
    };

    // Add details for specific error types
    if (err instanceof ValidationError && err.details) {
      response.details = err.details;
    }

    if (err instanceof GitHubAPIError && err.details) {
      response.details = config.nodeEnv === 'development' ? err.details : undefined;
    }

    if (err instanceof RateLimitError && err.resetTime) {
      const resetDate = new Date(err.resetTime * 1000);
      response.details = {
        resetAt: resetDate.toISOString(),
        resetIn: Math.max(0, Math.ceil((resetDate.getTime() - Date.now()) / 1000)),
      };
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unexpected errors
  const response: ErrorResponse = {
    error: 'InternalServerError',
    message: config.nodeEnv === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    statusCode: 500,
    ...(config.nodeEnv === 'development' && {
      details: {
        stack: err.stack,
      },
    }),
  };

  res.status(500).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ErrorResponse = {
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  };

  res.status(404).json(response);
};

/**
 * Async handler wrapper to catch async errors
 * Wraps async route handlers to properly catch rejected promises
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

