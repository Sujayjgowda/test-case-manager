// Shared types for Test Case Manager

export interface Project {
  id: number;
  name: string;
  description?: string;
  key: string;
  status: 'active' | 'archived' | 'inactive';
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  parentId?: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface Scenario {
  id: number;
  moduleId: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  preconditions?: string;
  expectedOutcome?: string;
  status: 'draft' | 'active' | 'deprecated';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: number;
  scenarioId: number;
  title: string;
  description?: string;
  preConditions?: string;
  postConditions?: string;
  status: 'draft' | 'in_review' | 'reviewed' | 'approved' | 'deprecated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime?: number;
  testData?: Record<string, unknown>;
  aiGenerated: boolean;
  aiPrompt?: string;
  version: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestStep {
  id: number;
  testCaseId: number;
  stepNumber: number;
  description: string;
  expectedResult: string;
  testData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  userId?: string;
  changes?: Record<string, unknown>;
  createdAt: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GenerationJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
  testCases?: TestCase[];
  createdAt: string;
  completedAt?: string;
}

// Status workflow
export const STATUS_WORKFLOW: Record<string, string[]> = {
  draft: ['in_review'],
  in_review: ['draft', 'reviewed'],
  reviewed: ['in_review', 'approved'],
  approved: ['reviewed', 'deprecated'],
  deprecated: ['draft'],
};
