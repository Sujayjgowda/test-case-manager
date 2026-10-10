import { Request, Response, NextFunction } from 'express';
import * as moduleService from '../services/module.service.js';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, page = '1', limit = '10' } = req.query;
    const modules = await moduleService.getAll({
      projectId: projectId ? parseInt(projectId as string, 10) : undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });
    res.json(modules);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const module = await moduleService.getById(id);
    res.json(module);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const module = await moduleService.update(id, req.body);
    res.json(module);
  } catch (error) {
    next(error);
  }
}

export async function deleteModule(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    await moduleService.deleteModule(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getScenarios(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const scenarios = await moduleService.getScenarios(id);
    res.json(scenarios);
  } catch (error) {
    next(error);
  }
}

export async function reorder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { moduleIds } = req.body;
    const modules = await moduleService.reorder(id, moduleIds);
    res.json(modules);
  } catch (error) {
    next(error);
  }
}
