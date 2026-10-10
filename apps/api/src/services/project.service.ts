import { prisma } from '../index.js';
import { NotFoundError, ConflictError } from '../middleware/error-handler.js';

interface GetAllOptions {
  page?: number;
  limit?: number;
  status?: string;
}

export async function getAll(options: GetAllOptions = {}) {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    data: projects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getById(id: number) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { orderIndex: 'asc' },
        include: {
          _count: {
            select: { scenarios: true },
          },
        },
      },
    },
  });

  if (!project) {
    throw new NotFoundError('Project');
  }

  return project;
}

export async function create(data: {
  name: string;
  description?: string;
  key: string;
  status?: string;
  settings?: Record<string, unknown> | string;
}) {
  // Check for duplicate key
  const existing = await prisma.project.findUnique({
    where: { key: data.key },
  });

  if (existing) {
    throw new ConflictError('Project with this key already exists');
  }

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      key: data.key,
      status: data.status,
      settings: typeof data.settings === 'object' ? JSON.stringify(data.settings) : data.settings,
    },
  });

  return project;
}

export async function update(id: number, data: Record<string, unknown>) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw new NotFoundError('Project');
  }

  // Check for duplicate key if changing
  if (data.key && data.key !== project.key) {
    const existing = await prisma.project.findUnique({
      where: { key: data.key as string },
    });
    if (existing) {
      throw new ConflictError('Project with this key already exists');
    }
  }

  const updateData = { ...data };
  if (typeof updateData.settings === 'object' && updateData.settings !== null) {
    updateData.settings = JSON.stringify(updateData.settings);
  }

  return prisma.project.update({
    where: { id },
    data: updateData as any,
  });
}

export async function deleteProject(id: number) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw new NotFoundError('Project');
  }

  await prisma.project.delete({
    where: { id },
  });
}

export async function getModules(projectId: number) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new NotFoundError('Project');
  }

  return prisma.module.findMany({
    where: { projectId },
    orderBy: { orderIndex: 'asc' },
    include: {
      _count: {
        select: { scenarios: true },
      },
    },
  });
}

export async function createModule(data: {
  projectId: number;
  name: string;
  description?: string;
  parentId?: number;
  orderIndex?: number;
}) {
  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  if (!project) {
    throw new NotFoundError('Project');
  }

  return prisma.module.create({
    data,
  });
}
