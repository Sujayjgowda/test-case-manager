import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/ai.service.js';

export async function generateTestCases(req: Request, res: Response, next: NextFunction) {
  try {
    const { scenarioId, prompt, options } = req.body;

    const job = await aiService.generateTestCases(scenarioId, prompt, options);
    res.status(202).json(job);
  } catch (error) {
    next(error);
  }
}

export async function generateSteps(req: Request, res: Response, next: NextFunction) {
  try {
    const { testCaseId, prompt } = req.body;

    const result = await aiService.generateSteps(testCaseId, prompt);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function improveTestCase(req: Request, res: Response, next: NextFunction) {
  try {
    const { testCaseId, instructions } = req.body;

    const result = await aiService.improveTestCase(testCaseId, instructions);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getGenerationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const jobId = req.params.jobId as string;
    const status = await aiService.getJobStatus(jobId);
    res.json(status);
  } catch (error) {
    next(error);
  }
}

export async function generateTestStepsFromScenario(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      scenarioTitle,
      scenarioDescription,
      preconditions,
      expectedOutcome,
      additionalInstructions,
      environment,
    } = req.body;

    const result = await aiService.generateTestStepsFromScenario({
      scenarioTitle,
      scenarioDescription,
      preconditions,
      expectedOutcome,
      additionalInstructions,
      environment,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
