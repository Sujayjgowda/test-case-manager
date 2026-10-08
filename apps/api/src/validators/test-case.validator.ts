import { z } from 'zod';

export const createTestCaseSchema = z.object({
  body: z.object({
    scenarioId: z.number({ message: 'Scenario ID is required' }),
    title: z.string().min(1, 'Title is required').max(500),
    description: z.string().optional(),
    preConditions: z.string().optional(),
    postConditions: z.string().optional(),
    status: z.enum(['draft', 'in_review', 'reviewed', 'approved', 'deprecated']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    estimatedTime: z.number().optional(),
    testData: z.record(z.unknown()).optional(),
  }),
});

export const updateTestCaseSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val)),
  }),
  body: z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().optional(),
    preConditions: z.string().optional(),
    postConditions: z.string().optional(),
    status: z.enum(['draft', 'in_review', 'reviewed', 'approved', 'deprecated']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    estimatedTime: z.number().optional(),
    testData: z.record(z.unknown()).optional(),
  }),
});

export const createStepSchema = z.object({
  params: z.object({
    testCaseId: z.string().transform((val) => parseInt(val)),
  }),
  body: z.object({
    stepNumber: z.number({ message: 'Step number is required' }),
    description: z.string().min(1, 'Step description is required'),
    expectedResult: z.string().min(1, 'Expected result is required'),
    testData: z.record(z.unknown()).optional(),
  }),
});

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>['body'];
export type UpdateTestCaseInput = z.infer<typeof updateTestCaseSchema>['body'];
export type CreateStepInput = z.infer<typeof createStepSchema>['body'];
