import { prisma } from '../index.js';
import { NotFoundError } from '../middleware/error-handler.js';

interface GetAllOptions {
  scenarioId?: number;
  status?: string;
  page?: number;
  limit?: number;
}

interface CreateTestCaseInput {
  scenarioId: number;
  title: string;
  description?: string;
  preConditions?: string;
  postConditions?: string;
  status?: string;
  priority?: string;
  estimatedTime?: number;
  testData?: Record<string, unknown>;
}

interface CreateStepInput {
  stepNumber: number;
  description: string;
  expectedResult: string;
  testData?: Record<string, unknown>;
}

// Status workflow transitions
const STATUS_WORKFLOW: Record<string, string[]> = {
  draft: ['in_review'],
  in_review: ['draft', 'reviewed'],
  reviewed: ['in_review', 'approved'],
  approved: ['reviewed', 'deprecated'],
  deprecated: ['draft'],
};

export async function getAll(options: GetAllOptions = {}) {
  const { scenarioId, status, page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (scenarioId) where.scenarioId = scenarioId;
  if (status) where.status = status;

  const [testCases, total] = await Promise.all([
    prisma.testCase.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        scenario: {
          select: { id: true, title: true, moduleId: true },
        },
        _count: {
          select: { steps: true },
        },
      },
    }),
    prisma.testCase.count({ where }),
  ]);

  return {
    data: testCases,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getById(id: number) {
  const testCase = await prisma.testCase.findUnique({
    where: { id },
    include: {
      scenario: {
        select: { id: true, title: true, moduleId: true },
      },
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
  });

  if (!testCase) {
    throw new NotFoundError('Test case');
  }

  return testCase;
}

export async function create(data: CreateTestCaseInput) {
  const scenario = await prisma.scenario.findUnique({ where: { id: data.scenarioId } });
  if (!scenario) {
    throw new NotFoundError('Scenario');
  }

  return prisma.testCase.create({
    data: {
      ...data,
      testData: data.testData ? JSON.stringify(data.testData) : null,
    },
  });
}

export async function update(id: number, data: Record<string, unknown>) {
  const testCase = await prisma.testCase.findUnique({ where: { id } });
  if (!testCase) {
    throw new NotFoundError('Test case');
  }

  // Handle testData conversion
  if (data.testData && typeof data.testData === 'object') {
    data.testData = JSON.stringify(data.testData);
  }

  return prisma.testCase.update({
    where: { id },
    data,
  });
}

export async function deleteTestCase(id: number) {
  const testCase = await prisma.testCase.findUnique({ where: { id } });
  if (!testCase) {
    throw new NotFoundError('Test case');
  }

  await prisma.testCase.delete({
    where: { id },
  });
}

export async function updateStatus(id: number, status: string, comment?: string) {
  const testCase = await prisma.testCase.findUnique({ where: { id } });
  if (!testCase) {
    throw new NotFoundError('Test case');
  }

  // Validate status transition
  const allowedTransitions = STATUS_WORKFLOW[testCase.status] || [];
  if (!allowedTransitions.includes(status)) {
    throw new Error(
      `Cannot transition from ${testCase.status} to ${status}. Allowed: ${allowedTransitions.join(', ')}`
    );
  }

  const updated = await prisma.testCase.update({
    where: { id },
    data: { status },
  });

  // Log audit entry
  await prisma.auditLog.create({
    data: {
      entityType: 'test_case',
      entityId: id,
      action: 'status_change',
      changes: JSON.stringify({ from: testCase.status, to: status, comment }),
    },
  });

  return updated;
}

export async function addStep(testCaseId: number, data: CreateStepInput) {
  const testCase = await prisma.testCase.findUnique({ where: { id: testCaseId } });
  if (!testCase) {
    throw new NotFoundError('Test case');
  }

  return prisma.testStep.create({
    data: {
      ...data,
      testCaseId,
      testData: data.testData ? JSON.stringify(data.testData) : null,
    },
  });
}

export async function updateStep(stepId: number, data: Record<string, unknown>) {
  const step = await prisma.testStep.findUnique({ where: { id: stepId } });
  if (!step) {
    throw new NotFoundError('Test step');
  }

  // Handle testData conversion
  if (data.testData && typeof data.testData === 'object') {
    data.testData = JSON.stringify(data.testData);
  }

  return prisma.testStep.update({
    where: { id: stepId },
    data,
  });
}

export async function deleteStep(stepId: number) {
  const step = await prisma.testStep.findUnique({ where: { id: stepId } });
  if (!step) {
    throw new NotFoundError('Test step');
  }

  await prisma.testStep.delete({
    where: { id: stepId },
  });
}

export async function reorderSteps(testCaseId: number, stepIds: number[]) {
  const testCase = await prisma.testCase.findUnique({ where: { id: testCaseId } });
  if (!testCase) {
    throw new NotFoundError('Test case');
  }

  // Update step numbers based on order
  const updates = stepIds.map((id, index) =>
    prisma.testStep.update({
      where: { id },
      data: { stepNumber: index + 1 },
    })
  );

  return Promise.all(updates);
}
