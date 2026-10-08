import { z } from 'zod';

export const createModuleSchema = z.object({
  params: z.object({
    projectId: z.string().transform((val) => parseInt(val)),
  }),
  body: z.object({
    name: z.string().min(1, 'Module name is required').max(255),
    description: z.string().optional(),
    parentId: z.number().optional(),
    orderIndex: z.number().optional(),
  }),
});

export const updateModuleSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val)),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    parentId: z.number().optional(),
    orderIndex: z.number().optional(),
  }),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>['body'];
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>['body'];
