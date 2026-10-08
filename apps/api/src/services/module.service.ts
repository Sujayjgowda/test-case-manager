import { prisma } from '../index.js';
import { NotFoundError } from '../middleware/error-handler.js';

interface GetAllOptions {
  projectId?: number;
  page?: number;
  limit?: number;
}

export async function getAll(options: GetAllOptions = {}) {
  const { projectId, page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const where = projectId ? { projectId } : {};

  const [modules, total] = await Promise.all([
    prisma.module.findMany({
      where,
      skip,
      take: limit,
      orderBy: { orderIndex: 'asc' },
      include: {
        project: {
          select: { id: true, name: true, key: true },
        },
      },
    }),
    prisma.module.count({ where }),
  ]);

  return {
    data: modules,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getById(id: number) {
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      project: {
        select: { id: true, name: true, key: true },
      },
      parent: true,
      children: true,
      scenarios: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!module) {
    throw new NotFoundError('Module');
  }

  return module;
}

export async function update(id: number, data: Record<string, unknown>) {
  const module = await prisma.module.findUnique({ where: { id } });
  if (!module) {
    throw new NotFoundError('Module');
  }

  return prisma.module.update({
    where: { id },
    data,
  });
}

export async function deleteModule(id: number) {
  const module = await prisma.module.findUnique({ where: { id } });
  if (!module) {
    throw new NotFoundError('Module');
  }

  await prisma.module.delete({
    where: { id },
  });
}

export async function getScenarios(moduleId: number) {
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) {
    throw new NotFoundError('Module');
  }

  return prisma.scenario.findMany({
    where: { moduleId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { testCases: true },
      },
    },
  });
}

export async function reorder(moduleId: number, moduleIds: number[]) {
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) {
    throw new NotFoundError('Module');
  }

  // Update order index for each module
  const updates = moduleIds.map((id, index) =>
    prisma.module.update({
      where: { id },
      data: { orderIndex: index },
    })
  );

  return Promise.all(updates);
}
