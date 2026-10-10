import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

// Helper to make API responses flexible for both direct data and { data: ... } callers
const wrap = async <T>(promise: Promise<{ data: T }>): Promise<{ data: T } & T> => {
  const res = await promise;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    return Object.assign({ data: res.data }, res.data);
  }
  return { data: res.data } as { data: T } & T;
};

// ─── Projects ────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => api.get('/projects').then((r) => r.data),
  getAll: () => api.get('/projects').then((r) => r.data),
  get: (id: number) => api.get(`/projects/${id}`).then((r) => r.data),
  getById: (id: number) => api.get(`/projects/${id}`).then((r) => r.data),
  getModules: (id: number) => api.get(`/projects/${id}/modules`).then((r) => r.data),
  createModule: (projectId: number, data: { name: string; description?: string }) =>
    api.post(`/projects/${projectId}/modules`, data).then((r) => r.data),
  create: (data: { name: string; description?: string; key: string }) =>
    api.post('/projects', data).then((r) => r.data),
  update: (id: number, data: Partial<{ name: string; description: string; status: string }>) =>
    api.put(`/projects/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/projects/${id}`).then((r) => r.data),
};

// ─── Modules ─────────────────────────────────────────────────────────────────

export const modulesApi = {
  list: (params?: { projectId?: number }) =>
    api.get('/modules', { params }).then((r) => r.data),
  getAll: (params?: { projectId?: number }) =>
    api.get('/modules', { params }).then((r) => r.data),
  get: (id: number) => api.get(`/modules/${id}`).then((r) => r.data),
  getById: (id: number) => api.get(`/modules/${id}`).then((r) => r.data),
  create: (data: { projectId: number; name: string; description?: string }) =>
    api.post('/modules', data).then((r) => r.data),
  update: (id: number, data: Partial<{ name: string; description: string }>) =>
    api.put(`/modules/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/modules/${id}`).then((r) => r.data),
};

// ─── Scenarios ───────────────────────────────────────────────────────────────

export const scenariosApi = {
  list: (params?: { moduleId?: number; limit?: number }) =>
    api.get('/scenarios', { params }).then((r) => r.data),
  getAll: (params?: { moduleId?: number; limit?: number }) =>
    api.get('/scenarios', { params }).then((r) => r.data),
  get: (id: number) => api.get(`/scenarios/${id}`).then((r) => r.data),
  getById: (id: number) => api.get(`/scenarios/${id}`).then((r) => r.data),
  create: (data: {
    moduleId: number;
    title: string;
    description?: string;
    priority?: string;
    preconditions?: string;
    expectedOutcome?: string;
  }) => api.post('/scenarios', data).then((r) => r.data),
  update: (
    id: number,
    data: Partial<{
      title: string;
      description: string;
      priority: string;
      status: string;
      preconditions: string;
      expectedOutcome: string;
    }>
  ) => api.put(`/scenarios/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/scenarios/${id}`).then((r) => r.data),
  generateTestCases: (
    scenarioId: number,
    data: { prompt?: string; options?: Record<string, unknown> }
  ) => api.post(`/scenarios/${scenarioId}/generate`, data).then((r) => r.data),
  getGenerationStatus: (scenarioId: number) =>
    api.get(`/scenarios/${scenarioId}/generation-status`).then((r) => r.data),
};

// ─── Test Cases ──────────────────────────────────────────────────────────────

export const testCasesApi = {
  list: (params?: { scenarioId?: number; status?: string; page?: number; limit?: number }) =>
    api.get('/test-cases', { params }).then((r) => r.data),
  getAll: (params?: { scenarioId?: number; status?: string; page?: number; limit?: number }) =>
    api.get('/test-cases', { params }).then((r) => r.data),
  get: (id: number) => api.get(`/test-cases/${id}`).then((r) => r.data),
  getById: (id: number) => api.get(`/test-cases/${id}`).then((r) => r.data),
  create: (data: {
    scenarioId: number;
    title: string;
    description?: string;
    preConditions?: string;
    postConditions?: string;
    priority?: string;
  }) => api.post('/test-cases', data).then((r) => r.data),
  update: (
    id: number,
    data: Partial<{
      title: string;
      description: string;
      preConditions: string;
      postConditions: string;
      status: string;
      priority: string;
    }>
  ) => api.put(`/test-cases/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/test-cases/${id}`).then((r) => r.data),
  updateStatus: (id: number, status: string) =>
    api.put(`/test-cases/${id}/status`, { status }).then((r) => r.data),
  addStep: (testCaseId: number, step: { description: string; expectedResult: string }) =>
    api.post(`/test-cases/${testCaseId}/steps`, step).then((r) => r.data),
  updateStep: (testCaseId: number, stepId: number, data: Record<string, unknown>) =>
    api.put(`/test-cases/${testCaseId}/steps/${stepId}`, data).then((r) => r.data),
  deleteStep: (testCaseId: number, stepId: number) =>
    api.delete(`/test-cases/${testCaseId}/steps/${stepId}`).then((r) => r.data),
};

// ─── AI Generation (SambaNova Engine) ────────────────────────────────────────

export const aiApi = {
  generateTestCases: (data: {
    scenarioId: number;
    prompt?: string;
    options?: Record<string, unknown>;
  }) => api.post('/ai/generate-test-cases', data).then((r) => r.data),

  generateSteps: (data: { testCaseId: number; prompt?: string }) =>
    api.post('/ai/generate-steps', data).then((r) => r.data),

  improveTestCase: (data: { testCaseId: number; instructions: string }) =>
    api.post('/ai/improve', data).then((r) => r.data),

  generateTestStepsFromScenario: (data: {
    scenarioTitle: string;
    scenarioDescription?: string;
    preconditions?: string;
    expectedOutcome?: string;
    additionalInstructions?: string;
    environment?: 'argus' | 'lsmv';
  }) => api.post('/ai/generate-test-steps', data).then((r) => r.data),

  getJobStatus: (jobId: string) => api.get(`/ai/generation/${jobId}`).then((r) => r.data),
};

// ─── Export ──────────────────────────────────────────────────────────────────

export const exportApi = {
  json: (id: number) => api.get(`/export/test-cases/${id}/json`, { responseType: 'blob' }),
  markdown: (id: number) => api.get(`/export/test-cases/${id}/markdown`, { responseType: 'blob' }),
  pdf: (id: number) => api.get(`/export/test-cases/${id}/pdf`, { responseType: 'blob' }),
  excel: (id: number) => api.get(`/export/test-cases/${id}/excel`, { responseType: 'blob' }),
  scenario: (scenarioId: number, format: string) =>
    api.get(`/export/scenarios/${scenarioId}`, { params: { format }, responseType: 'blob' }),
};

export default api;
