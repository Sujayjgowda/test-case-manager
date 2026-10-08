// Shared constants for Test Case Manager

export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Priority = typeof PRIORITIES[number];

export const TEST_CASE_STATUS = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  DEPRECATED: 'deprecated',
} as const;
export type TestCaseStatus = typeof TEST_CASE_STATUS[keyof typeof TEST_CASE_STATUS];

export const SCENARIO_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  DEPRECATED: 'deprecated',
} as const;
export type ScenarioStatus = typeof SCENARIO_STATUS[keyof typeof SCENARIO_STATUS];

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  INACTIVE: 'inactive',
} as const;
export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

export const EXPORT_FORMATS = ['json', 'markdown', 'pdf', 'excel'] as const;
export type ExportFormat = typeof EXPORT_FORMATS[number];

// Status workflow transitions
export const STATUS_WORKFLOW: Record<string, string[]> = {
  [TEST_CASE_STATUS.DRAFT]: [TEST_CASE_STATUS.IN_REVIEW],
  [TEST_CASE_STATUS.IN_REVIEW]: [TEST_CASE_STATUS.DRAFT, TEST_CASE_STATUS.REVIEWED],
  [TEST_CASE_STATUS.REVIEWED]: [TEST_CASE_STATUS.IN_REVIEW, TEST_CASE_STATUS.APPROVED],
  [TEST_CASE_STATUS.APPROVED]: [TEST_CASE_STATUS.REVIEWED, TEST_CASE_STATUS.DEPRECATED],
  [TEST_CASE_STATUS.DEPRECATED]: [TEST_CASE_STATUS.DRAFT],
};

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
