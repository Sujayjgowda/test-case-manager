import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export function errorHandler(
  err: Error | AppError | ZodError | any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Zod validation error
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
  }

  // App error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // AI API rate limit (429)
  if (err?.status === 429) {
    const retryDelay = err?.headers?.['retry-after'] ? `${err.headers['retry-after']}s` : '60s';
    return res.status(429).json({
      error: 'AI rate limit reached',
      message: `AI Provider rate limit exceeded. Please wait ${retryDelay} and try again.`,
      retryAfter: retryDelay,
    });
  }

  // Unknown error — always expose message for AI/external errors
  return res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred',
  });
}
