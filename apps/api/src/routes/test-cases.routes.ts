import { Router } from 'express';
import * as testCaseController from '../controllers/test-case.controller.js';
import { validate } from '../middleware/validation.js';
import { createTestCaseSchema, updateTestCaseSchema } from '../validators/test-case.validator.js';

const router = Router();

// GET /test-cases - List all test cases
router.get('/', testCaseController.getAll);

// GET /test-cases/:id - Get test case by ID
router.get('/:id', testCaseController.getById);

// POST /test-cases - Create new test case
router.post('/', validate(createTestCaseSchema), testCaseController.create);

// PUT /test-cases/:id - Update test case
router.put('/:id', validate(updateTestCaseSchema), testCaseController.update);

// DELETE /test-cases/:id - Delete test case
router.delete('/:id', testCaseController.deleteTestCase);

// PUT /test-cases/:id/status - Update test case status
router.put('/:id/status', testCaseController.updateStatus);

// POST /test-cases/:id/steps - Add step to test case
router.post('/:id/steps', testCaseController.addStep);

// PUT /test-cases/:id/steps/:stepId - Update step
router.put('/:id/steps/:stepId', testCaseController.updateStep);

// DELETE /test-cases/:id/steps/:stepId - Delete step
router.delete('/:id/steps/:stepId', testCaseController.deleteStep);

// PUT /test-cases/:id/steps/reorder - Reorder steps
router.put('/:id/steps/reorder', testCaseController.reorderSteps);

export default router;
