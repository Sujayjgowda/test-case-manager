import { Request, Response, NextFunction } from 'express';
import * as scenarioService from '../services/scenario.service.js';
import * as aiService from '../services/ai.service.js';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { moduleId, status, page = '1', limit = '10' } = req.query;
    const scenarios = await scenarioService.getAll({
      moduleId: moduleId ? parseInt(moduleId as string, 10) : undefined,
      status: status as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });
    res.json(scenarios);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const scenario = await scenarioService.getById(id);
    res.json(scenario);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const scenario = await scenarioService.create(req.body);
    res.status(201).json(scenario);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const scenario = await scenarioService.update(id, req.body);
    res.json(scenario);
  } catch (error) {
    next(error);
  }
}

export async function deleteScenario(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    await scenarioService.deleteScenario(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function bulkCreate(req: Request, res: Response, next: NextFunction) {
  try {
    const { scenarios } = req.body;
    const created = await scenarioService.bulkCreate(scenarios);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function generateTestCases(req: Request, res: Response, next: NextFunction) {
  try {
    const scenarioId = parseInt(req.params.id as string, 10);
    const { prompt, options } = req.body;

    const job = await aiService.generateTestCases(scenarioId, prompt, options);
    res.status(202).json(job);
  } catch (error) {
    next(error);
  }
}

export async function getGenerationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const scenarioId = parseInt(req.params.id as string, 10);
    const status = await aiService.getGenerationStatus(scenarioId);
    res.json(status);
  } catch (error) {
    next(error);
  }
}
