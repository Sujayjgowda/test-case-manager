import { Request, Response, NextFunction } from 'express';
import * as exportService from '../services/export.service.js';

export async function exportJson(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const buffer = await exportService.exportToJson(id);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="test-case-${id}.json"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

export async function exportMarkdown(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const markdown = await exportService.exportToMarkdown(id);

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="test-case-${id}.md"`);
    res.send(markdown);
  } catch (error) {
    next(error);
  }
}

export async function exportPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const buffer = await exportService.exportToPdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="test-case-${id}.pdf"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

export async function exportExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const buffer = await exportService.exportToExcel(id);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="test-case-${id}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

export async function bulkExport(req: Request, res: Response, next: NextFunction) {
  try {
    const { testCasesIds, format } = req.body;
    const result = await exportService.bulkExport(testCasesIds, format);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="test-cases-bulk.${format}"`);
    res.send(result.buffer);
  } catch (error) {
    next(error);
  }
}

export async function exportScenario(req: Request, res: Response, next: NextFunction) {
  try {
    const scenarioId = parseInt(req.params.id);
    const { format = 'json' } = req.query;
    const result = await exportService.exportScenario(scenarioId, format as string);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="scenario-${scenarioId}-test-cases.${format}"`);
    res.send(result.buffer);
  } catch (error) {
    next(error);
  }
}
