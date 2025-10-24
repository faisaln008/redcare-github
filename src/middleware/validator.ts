import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';
import config from '../config';

/**
 * Validation schema for repository search query
 */
const searchQuerySchema = Joi.object({
  language: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z0-9#+\-_.]+$/)
    .messages({
      'string.pattern.base': 'Language must contain only alphanumeric characters and #+-._ symbols',
    }),

  createdAfter: Joi.string()
    .isoDate()
    .messages({
      'string.isoDate': 'createdAfter must be a valid ISO 8601 date (YYYY-MM-DD)',
    }),

  sort: Joi.string()
    .valid('score', 'stars', 'forks', 'updated')
    .messages({
      'any.only': 'sort must be one of: score, stars, forks, updated',
    }),

  order: Joi.string()
    .valid('asc', 'desc')
    .messages({
      'any.only': 'order must be either asc or desc',
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .messages({
      'number.base': 'page must be a number',
      'number.min': 'page must be at least 1',
      'number.max': 'page cannot exceed 100 (GitHub API limitation)',
    }),

  perPage: Joi.number()
    .integer()
    .min(1)
    .max(config.api.maxPerPage)
    .messages({
      'number.base': 'perPage must be a number',
      'number.min': 'perPage must be at least 1',
      'number.max': `perPage cannot exceed ${config.api.maxPerPage}`,
    }),
}).messages({
  'object.unknown': 'Unknown query parameter: {{#label}}',
});

/**
 * Middleware to validate search query parameters
 */
export const validateSearchQuery = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { error, value } = searchQuerySchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true, // Convert string numbers to actual numbers
  });

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    throw new ValidationError('Invalid query parameters', details);
  }

  // Attach validated and converted values to request
  req.query = value;
  next();
};

