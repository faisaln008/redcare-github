/**
 * Custom Error Classes
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(400, message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class GitHubAPIError extends AppError {
  constructor(message: string, statusCode = 500, public details?: unknown) {
    super(statusCode, message);
    Object.setPrototypeOf(this, GitHubAPIError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'GitHub API rate limit exceeded', public resetTime?: number) {
    super(429, message);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

