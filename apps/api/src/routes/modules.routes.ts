import { Router } from 'express';
import * as moduleController from '../controllers/module.controller.js';

const router = Router();

// GET /modules - List all modules (with optional project filter)
router.get('/', moduleController.getAll);

// GET /modules/:id - Get module by ID
router.get('/:id', moduleController.getById);

// PUT /modules/:id - Update module
router.put('/:id', moduleController.update);

// DELETE /modules/:id - Delete module
router.delete('/:id', moduleController.deleteModule);

// GET /modules/:id/scenarios - Get scenarios for module
router.get('/:id/scenarios', moduleController.getScenarios);

// PUT /modules/:id/reorder - Reorder modules
router.put('/:id/reorder', moduleController.reorder);

export default router;
