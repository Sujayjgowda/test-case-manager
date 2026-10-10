import { Request, Response, NextFunction } from 'express';
import * as testCaseService from '../services/test-case.service.js';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { scenarioId, status, page = '1', limit = '10' } = req.query;
    const testCases = await testCaseService.getAll({
      scenarioId: scenarioId ? parseInt(scenarioId as string, 10) : undefined,
      status: status as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });
    res.json(testCases);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const testCase = await testCaseService.getById(id);
    res.json(testCase);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const testCase = await testCaseService.create(req.body);
    res.status(201).json(testCase);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const testCase = await testCaseService.update(id, req.body);
    res.json(testCase);
  } catch (error) {
    next(error);
  }
}

export async function deleteTestCase(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    await testCaseService.deleteTestCase(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { status, comment } = req.body;
    const testCase = await testCaseService.updateStatus(id, status, comment);
    res.json(testCase);
  } catch (error) {
    next(error);
  }
}

export async function addStep(req: Request, res: Response, next: NextFunction) {
  try {
    const testCaseId = parseInt(req.params.id as string, 10);
    const step = await testCaseService.addStep(testCaseId, req.body);
    res.status(201).json(step);
  } catch (error) {
    next(error);
  }
}

export async function updateStep(req: Request, res: Response, next: NextFunction) {
  try {
    const stepId = parseInt(req.params.stepId as string, 10);
    const step = await testCaseService.updateStep(stepId, req.body);
    res.json(step);
  } catch (error) {
    next(error);
  }
}

export async function deleteStep(req: Request, res: Response, next: NextFunction) {
  try {
    const stepId = parseInt(req.params.stepId as string, 10);
    await testCaseService.deleteStep(stepId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function reorderSteps(req: Request, res: Response, next: NextFunction) {
  try {
    const testCaseId = parseInt(req.params.id as string, 10);
    const { stepIds } = req.body;
    const steps = await testCaseService.reorderSteps(testCaseId, stepIds);
    res.json(steps);
  } catch (error) {
    next(error);
  }
}
