import { prisma } from '../index.js';
import { NotFoundError } from '../middleware/error-handler.js';

interface GetAllOptions {
  moduleId?: number;
  status?: string;
  page?: number;
  limit?: number;
}

interface CreateScenarioInput {
  moduleId: number;
  title: string;
  description?: string;
  priority?: string;
  tags?: string[];
  preconditions?: string;
  expectedOutcome?: string;
}

export async function getAll(options: GetAllOptions = {}) {
  const { moduleId, status, page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (moduleId) where.moduleId = moduleId;
  if (status) where.status = status;

  const [scenarios, total] = await Promise.all([
    prisma.scenario.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        module: {
          select: { id: true, name: true, projectId: true },
        },
        _count: {
          select: { testCases: true },
        },
      },
    }),
    prisma.scenario.count({ where }),
  ]);

  return {
    data: scenarios,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getById(id: number) {
  const scenario = await prisma.scenario.findUnique({
    where: { id },
    include: {
      module: {
        include: {
          project: {
            select: { id: true, name: true, key: true },
          },
        },
      },
      testCases: {
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { steps: true },
          },
        },
      },
    },
  });

  if (!scenario) {
    throw new NotFoundError('Scenario');
  }

  return scenario;
}

export async function create(data: CreateScenarioInput) {
  const module = await prisma.module.findUnique({ where: { id: data.moduleId } });
  if (!module) {
    throw new NotFoundError('Module');
  }

  return prisma.scenario.create({
    data: {
      ...data,
      tags: data.tags ? JSON.stringify(data.tags) : null,
    },
  });
}

export async function update(id: number, data: Record<string, unknown>) {
  const scenario = await prisma.scenario.findUnique({ where: { id } });
  if (!scenario) {
    throw new NotFoundError('Scenario');
  }

  // Handle tags conversion
  if (data.tags && Array.isArray(data.tags)) {
    data.tags = JSON.stringify(data.tags);
  }

  return prisma.scenario.update({
    where: { id },
    data,
  });
}

export async function deleteScenario(id: number) {
  const scenario = await prisma.scenario.findUnique({ where: { id } });
  if (!scenario) {
    throw new NotFoundError('Scenario');
  }

  await prisma.scenario.delete({
    where: { id },
  });
}

export async function bulkCreate(scenarios: CreateScenarioInput[]) {
  const created = await Promise.all(
    scenarios.map((s) => create(s))
  );
  return created;
}
