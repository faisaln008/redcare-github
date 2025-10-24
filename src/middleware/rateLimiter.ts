import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

/**
 * Rate limiter middleware to prevent API abuse
 * 
 * Limits:
 * - 100 requests per 15 minutes per IP address
 * - Returns 429 (Too Many Requests) when limit exceeded
 * - Provides retry information in headers and response
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'TooManyRequestsError',
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Custom handler to log rate limit violations
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    
    res.status(429).json({
      error: 'TooManyRequestsError',
      message: 'Too many requests from this IP, please try again in 15 minutes.',
      statusCode: 429,
      retryAfter: '15 minutes',
    });
  },
});

/**
 * Stricter rate limiter for search endpoint
 * 
 * Limits:
 * - 30 requests per 15 minutes per IP address
 * - Protects expensive GitHub API calls
 */
export const searchRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 search requests per windowMs
  message: {
    error: 'TooManyRequestsError',
    message: 'Too many search requests, please try again later.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logger.warn('Search rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      query: req.query,
    });
    
    res.status(429).json({
      error: 'TooManyRequestsError',
      message: 'Too many search requests from this IP. Please try again in 15 minutes.',
      statusCode: 429,
      retryAfter: '15 minutes',
    });
  },
});

