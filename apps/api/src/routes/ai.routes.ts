import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';

const router = Router();

// POST /ai/generate-test-cases - Generate test cases from scenario
router.post('/generate-test-cases', aiController.generateTestCases);

// POST /ai/generate-steps - Generate test steps for a test case
router.post('/generate-steps', aiController.generateSteps);

// POST /ai/improve - Improve/enhance existing test case
router.post('/improve', aiController.improveTestCase);

// POST /ai/generate-test-steps - Generate test steps from scenario input
router.post('/generate-test-steps', aiController.generateTestStepsFromScenario);

// GET /ai/generation/:jobId - Get generation job status
router.get('/generation/:jobId', aiController.getGenerationStatus);

export default router;
