import { Router } from 'express';
import * as scenarioController from '../controllers/scenario.controller.js';
import { validate } from '../middleware/validation.js';
import { createScenarioSchema, updateScenarioSchema } from '../validators/scenario.validator.js';

const router = Router();

// GET /scenarios - List all scenarios
router.get('/', scenarioController.getAll);

// GET /scenarios/:id - Get scenario by ID
router.get('/:id', scenarioController.getById);

// POST /scenarios - Create new scenario
router.post('/', validate(createScenarioSchema), scenarioController.create);

// PUT /scenarios/:id - Update scenario
router.put('/:id', validate(updateScenarioSchema), scenarioController.update);

// DELETE /scenarios/:id - Delete scenario
router.delete('/:id', scenarioController.deleteScenario);

// POST /scenarios/:id/generate - AI generate test cases
router.post('/:id/generate', scenarioController.generateTestCases);

// GET /scenarios/:id/generation-status - Get generation status
router.get('/:id/generation-status', scenarioController.getGenerationStatus);

// POST /scenarios/bulk - Bulk create scenarios
router.post('/bulk', scenarioController.bulkCreate);

export default router;
