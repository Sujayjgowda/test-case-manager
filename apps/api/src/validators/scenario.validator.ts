import { z } from 'zod';

export const createScenarioSchema = z.object({
  body: z.object({
    moduleId: z.number({ message: 'Module ID is required' }),
    title: z.string().min(1, 'Title is required').max(500),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    tags: z.array(z.string()).optional(),
    preconditions: z.string().optional(),
    expectedOutcome: z.string().optional(),
  }),
});

export const updateScenarioSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val)),
  }),
  body: z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    tags: z.array(z.string()).optional(),
    preconditions: z.string().optional(),
    expectedOutcome: z.string().optional(),
    status: z.enum(['draft', 'active', 'deprecated']).optional(),
  }),
});

export type CreateScenarioInput = z.infer<typeof createScenarioSchema>['body'];
export type UpdateScenarioInput = z.infer<typeof updateScenarioSchema>['body'];
