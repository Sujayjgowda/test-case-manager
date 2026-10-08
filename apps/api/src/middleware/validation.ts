import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './error-handler.js';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and attach parsed data to request
      const validated = schema.parse({
        params: req.params,
        body: req.body,
        query: req.query,
      });

      // Merge validated data into request
      if (validated.params) {
        req.params = { ...req.params, ...validated.params };
      }
      if (validated.body) {
        req.body = { ...req.body, ...validated.body };
      }
      if (validated.query) {
        req.query = { ...req.query, ...validated.query };
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError(error.message));
      } else {
        next(error);
      }
    }
  };
}
