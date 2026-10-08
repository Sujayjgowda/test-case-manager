import { Router } from 'express';
import projectsRoutes from './projects.routes.js';
import modulesRoutes from './modules.routes.js';
import scenariosRoutes from './scenarios.routes.js';
import testCasesRoutes from './test-cases.routes.js';
import exportRoutes from './export.routes.js';
import aiRoutes from './ai.routes.js';

const router = Router();

router.use('/projects', projectsRoutes);
router.use('/modules', modulesRoutes);
router.use('/scenarios', scenariosRoutes);
router.use('/test-cases', testCasesRoutes);
router.use('/export', exportRoutes);
router.use('/ai', aiRoutes);

export default router;
