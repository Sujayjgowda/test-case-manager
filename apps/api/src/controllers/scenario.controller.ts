import { Request, Response, NextFunction } from 'express';
import * as scenarioService from '../services/scenario.service.js';
import * as aiService from '../services/ai.service.js';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { moduleId, status, page = '1', limit = '10' } = req.query;
    const scenarios = await scenarioService.getAll({
      moduleId: moduleId ? parseInt(moduleId as string) : undefined,
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
    res.json(scenarios);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
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
    const id = parseInt(req.params.id);
    const scenario = await scenarioService.update(id, req.body);
    res.json(scenario);
  } catch (error) {
    next(error);
  }
}

export async function deleteScenario(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    await scenarioService.delete(id);
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
    const scenarioId = parseInt(req.params.id);
    const { prompt, options } = req.body;

    const job = await aiService.generateTestCases(scenarioId, prompt, options);
    res.status(202).json(job);
  } catch (error) {
    next(error);
  }
}

export async function getGenerationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const scenarioId = parseInt(req.params.id);
    const status = await aiService.getGenerationStatus(scenarioId);
    res.json(status);
  } catch (error) {
    next(error);
  }
}
