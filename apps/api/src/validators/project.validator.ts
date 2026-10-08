import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required').max(255),
    description: z.string().optional(),
    key: z.string().min(1, 'Project key is required').max(50),
    status: z.enum(['active', 'archived', 'inactive']).optional(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val)),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    key: z.string().min(1).max(50).optional(),
    status: z.enum(['active', 'archived', 'inactive']).optional(),
    settings: z.record(z.unknown()).optional(),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
