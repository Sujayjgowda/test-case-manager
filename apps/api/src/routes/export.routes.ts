import { Router } from 'express';
import * as exportController from '../controllers/export.controller.js';

const router = Router();

// GET /export/test-cases/:id/json - Export test case as JSON
router.get('/test-cases/:id/json', exportController.exportJson);

// GET /export/test-cases/:id/markdown - Export test case as Markdown
router.get('/test-cases/:id/markdown', exportController.exportMarkdown);

// GET /export/test-cases/:id/pdf - Export test case as PDF
router.get('/test-cases/:id/pdf', exportController.exportPdf);

// GET /export/test-cases/:id/excel - Export test case as Excel
router.get('/test-cases/:id/excel', exportController.exportExcel);

// POST /export/bulk - Bulk export multiple test cases
router.post('/bulk', exportController.bulkExport);

// GET /export/scenarios/:id - Export all test cases in scenario
router.get('/scenarios/:id', exportController.exportScenario);

export default router;
