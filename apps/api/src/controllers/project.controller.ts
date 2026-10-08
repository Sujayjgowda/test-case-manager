import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index.js';
import { NotFoundError, ConflictError } from '../middleware/error-handler.js';
import * as projectService from '../services/project.service.js';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', status } = req.query;
    const projects = await projectService.getAll({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
    });
    res.json(projects);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const project = await projectService.getById(id);
    res.json(project);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectService.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    const project = await projectService.update(id, req.body);
    res.json(project);
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    await projectService.delete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getModules(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = parseInt(req.params.id);
    const modules = await projectService.getModules(projectId);
    res.json(modules);
  } catch (error) {
    next(error);
  }
}

export async function createModule(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = parseInt(req.params.id);
    const moduleData = { ...req.body, projectId };
    const module = await projectService.createModule(moduleData);
    res.status(201).json(module);
  } catch (error) {
    next(error);
  }
}
