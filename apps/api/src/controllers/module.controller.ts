import { Request, Response, NextFunction } from 'express';
import * as moduleService from '../services/module.service.js';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, page = '1', limit = '10' } = req.query;
    const modules = await moduleService.getAll({
      projectId: projectId ? parseInt(projectId as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
    res.json(modules);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const module = await moduleService.getById(id);
    res.json(module);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const module = await moduleService.update(id, req.body);
    res.json(module);
  } catch (error) {
    next(error);
  }
}

export async function deleteModule(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    await moduleService.delete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getScenarios(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const scenarios = await moduleService.getScenarios(id);
    res.json(scenarios);
  } catch (error) {
    next(error);
  }
}

export async function reorder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const { moduleIds } = req.body;
    const modules = await moduleService.reorder(id, moduleIds);
    res.json(modules);
  } catch (error) {
    next(error);
  }
}
