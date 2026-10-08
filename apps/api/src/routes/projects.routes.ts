import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { validate } from '../middleware/validation.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

const router = Router();

// GET /projects - List all projects
router.get('/', projectController.getAll);

// GET /projects/:id - Get project by ID
router.get('/:id', projectController.getById);

// POST /projects - Create new project
router.post('/', validate(createProjectSchema), projectController.create);

// PUT /projects/:id - Update project
router.put('/:id', validate(updateProjectSchema), projectController.update);

// DELETE /projects/:id - Delete project
router.delete('/:id', projectController.deleteProject);

// GET /projects/:id/modules - Get modules for project
router.get('/:id/modules', projectController.getModules);

// POST /projects/:id/modules - Create module in project
router.post('/:id/modules', projectController.createModule);

export default router;
