import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects
export const projectsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/projects', { params }),
  getById: (id: number) => api.get(`/projects/${id}`),
  create: (data: { name: string; key: string; description?: string }) =>
    api.post('/projects', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  getModules: (id: number) => api.get(`/projects/${id}/modules`),
  createModule: (projectId: number, data: { name: string; description?: string }) =>
    api.post(`/projects/${id}/modules`, data),
};

// Modules
export const modulesApi = {
  getAll: (params?: { projectId?: number }) => api.get('/modules', { params }),
  getById: (id: number) => api.get(`/modules/${id}`),
  update: (id: number, data: Record<string, unknown>) => api.put(`/modules/${id}`, data),
  delete: (id: number) => api.delete(`/modules/${id}`),
  getScenarios: (id: number) => api.get(`/modules/${id}/scenarios`),
};

// Scenarios
export const scenariosApi = {
  getAll: (params?: { moduleId?: number; status?: string; page?: number; limit?: number }) =>
    api.get('/scenarios', { params }),
  getById: (id: number) => api.get(`/scenarios/${id}`),
  create: (data: {
    moduleId: number;
    title: string;
    description?: string;
    priority?: string;
    tags?: string[];
    preconditions?: string;
    expectedOutcome?: string;
  }) => api.post('/scenarios', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/scenarios/${id}`, data),
  delete: (id: number) => api.delete(`/scenarios/${id}`),
  generateTestCases: (
    scenarioId: number,
    data: { prompt?: string; options?: Record<string, unknown> }
  ) => api.post(`/scenarios/${scenarioId}/generate`, data),
  getGenerationStatus: (scenarioId: number) =>
    api.get(`/scenarios/${scenarioId}/generation-status`),
};

// Test Cases
export const testCasesApi = {
  getAll: (params?: { scenarioId?: number; status?: string; page?: number; limit?: number }) =>
    api.get('/test-cases', { params }),
  getById: (id: number) => api.get(`/test-cases/${id}`),
  create: (data: {
    scenarioId: number;
    title: string;
    description?: string;
    preConditions?: string;
    postConditions?: string;
    priority?: string;
  }) => api.post('/test-cases', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/test-cases/${id}`, data),
  delete: (id: number) => api.delete(`/test-cases/${id}`),
  updateStatus: (id: number, status: string) => api.put(`/test-cases/${id}/status`, { status }),
  addStep: (testCaseId: number, step: { description: string; expectedResult: string }) =>
    api.post(`/test-cases/${testCaseId}/steps`, step),
  updateStep: (testCaseId: number, stepId: number, data: Record<string, unknown>) =>
    api.put(`/test-cases/${testCaseId}/steps/${stepId}`, data),
  deleteStep: (testCaseId: number, stepId: number) =>
    api.delete(`/test-cases/${testCaseId}/steps/${stepId}`),
};

// Export
export const exportApi = {
  json: (id: number) => api.get(`/export/test-cases/${id}/json`, { responseType: 'blob' }),
  markdown: (id: number) => api.get(`/export/test-cases/${id}/markdown`, { responseType: 'blob' }),
  pdf: (id: number) => api.get(`/export/test-cases/${id}/pdf`, { responseType: 'blob' }),
  excel: (id: number) => api.get(`/export/test-cases/${id}/excel`, { responseType: 'blob' }),
  scenario: (scenarioId: number, format: string) =>
    api.get(`/export/scenarios/${scenarioId}`, { params: { format }, responseType: 'blob' }),
};
