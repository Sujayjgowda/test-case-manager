import axios from 'axios';
import { localStore } from './local-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 3500,
});

function isClientMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname.includes('github.io') ||
    (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'))
  );
}

// Projects
export const projectsApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const list = localStore.getProjects();
    const wrapped = { data: list, total: list.length, pagination: { total: list.length, page: 1, limit: 100 } };
    if (isClientMode()) return { data: wrapped };
    try {
      return await api.get('/projects', { params });
    } catch {
      return { data: wrapped };
    }
  },
  getById: async (id: number) => {
    if (isClientMode()) return { data: localStore.getProjectById(id) };
    try {
      return await api.get(`/projects/${id}`);
    } catch {
      return { data: localStore.getProjectById(id) };
    }
  },
  create: async (data: { name: string; key: string; description?: string }) => {
    if (isClientMode()) return { data: localStore.createProject(data) };
    try {
      return await api.post('/projects', data);
    } catch {
      return { data: localStore.createProject(data) };
    }
  },
  update: async (id: number, data: Record<string, unknown>) => {
    try {
      return await api.put(`/projects/${id}`, data);
    } catch {
      return { data: { id, ...data } };
    }
  },
  delete: async (id: number) => {
    if (isClientMode()) return { data: localStore.deleteProject(id) };
    try {
      return await api.delete(`/projects/${id}`);
    } catch {
      return { data: localStore.deleteProject(id) };
    }
  },
  getModules: async (id: number) => {
    const list = localStore.getModules(id);
    if (isClientMode()) return { data: list };
    try {
      return await api.get(`/projects/${id}/modules`);
    } catch {
      return { data: list };
    }
  },
  createModule: async (projectId: number, data: { name: string; description?: string }) => {
    if (isClientMode()) return { data: localStore.createModule(projectId, data) };
    try {
      return await api.post(`/projects/${projectId}/modules`, data);
    } catch {
      return { data: localStore.createModule(projectId, data) };
    }
  },
};

// Modules
export const modulesApi = {
  getAll: async (params?: { projectId?: number }) => {
    const list = localStore.getModules(params?.projectId);
    const wrapped = { data: list, total: list.length };
    if (isClientMode()) return { data: wrapped };
    try {
      return await api.get('/modules', { params });
    } catch {
      return { data: wrapped };
    }
  },
  getById: async (id: number) => {
    if (isClientMode()) return { data: localStore.getModuleById(id) };
    try {
      return await api.get(`/modules/${id}`);
    } catch {
      return { data: localStore.getModuleById(id) };
    }
  },
  update: (id: number, data: Record<string, unknown>) => api.put(`/modules/${id}`, data),
  delete: async (id: number) => {
    if (isClientMode()) return { data: localStore.deleteModule(id) };
    try {
      return await api.delete(`/modules/${id}`);
    } catch {
      return { data: localStore.deleteModule(id) };
    }
  },
  getScenarios: async (id: number) => {
    const list = localStore.getScenarios({ moduleId: id });
    if (isClientMode()) return { data: list };
    try {
      return await api.get(`/modules/${id}/scenarios`);
    } catch {
      return { data: list };
    }
  },
};

// Scenarios
export const scenariosApi = {
  getAll: async (params?: { moduleId?: number; status?: string; page?: number; limit?: number }) => {
    const list = localStore.getScenarios(params);
    const wrapped = { data: list, total: list.length, pagination: { total: list.length, page: 1, limit: 100 } };
    if (isClientMode()) return { data: wrapped };
    try {
      return await api.get('/scenarios', { params });
    } catch {
      return { data: wrapped };
    }
  },
  getById: async (id: number) => {
    if (isClientMode()) return { data: localStore.getScenarioById(id) };
    try {
      return await api.get(`/scenarios/${id}`);
    } catch {
      return { data: localStore.getScenarioById(id) };
    }
  },
  create: async (data: {
    moduleId: number;
    title: string;
    description?: string;
    priority?: string;
    tags?: string[];
    preconditions?: string;
    expectedOutcome?: string;
  }) => {
    if (isClientMode()) return { data: localStore.createScenario(data) };
    try {
      return await api.post('/scenarios', data);
    } catch {
      return { data: localStore.createScenario(data) };
    }
  },
  update: (id: number, data: Record<string, unknown>) => api.put(`/scenarios/${id}`, data),
  delete: async (id: number) => {
    if (isClientMode()) return { data: localStore.deleteScenario(id) };
    try {
      return await api.delete(`/scenarios/${id}`);
    } catch {
      return { data: localStore.deleteScenario(id) };
    }
  },
  generateTestCases: async (
    scenarioId: number,
    data: { prompt?: string; options?: Record<string, unknown> }
  ) => {
    if (isClientMode()) return { data: localStore.generateTestCasesForScenario(scenarioId) };
    try {
      return await api.post(`/scenarios/${scenarioId}/generate`, data);
    } catch {
      return { data: localStore.generateTestCasesForScenario(scenarioId) };
    }
  },
  getGenerationStatus: async (scenarioId: number) => {
    if (isClientMode()) return { data: { status: 'completed' } };
    try {
      return await api.get(`/scenarios/${scenarioId}/generation-status`);
    } catch {
      return { data: { status: 'completed' } };
    }
  },
};

// Test Cases
export const testCasesApi = {
  getAll: async (params?: { scenarioId?: number; status?: string; page?: number; limit?: number }) => {
    const list = localStore.getTestCases(params);
    const wrapped = { data: list, total: list.length, pagination: { total: list.length, page: 1, limit: 100 } };
    if (isClientMode()) return { data: wrapped };
    try {
      return await api.get('/test-cases', { params });
    } catch {
      return { data: wrapped };
    }
  },
  getById: async (id: number) => {
    if (isClientMode()) return { data: localStore.getTestCaseById(id) };
    try {
      return await api.get(`/test-cases/${id}`);
    } catch {
      return { data: localStore.getTestCaseById(id) };
    }
  },
  create: async (data: {
    scenarioId: number;
    title: string;
    description?: string;
    preConditions?: string;
    postConditions?: string;
    priority?: string;
  }) => {
    if (isClientMode()) return { data: localStore.createTestCase(data) };
    try {
      return await api.post('/test-cases', data);
    } catch {
      return { data: localStore.createTestCase(data) };
    }
  },
  update: async (id: number, data: Record<string, unknown>) => {
    if (isClientMode()) return { data: localStore.updateTestCase(id, data) };
    try {
      return await api.put(`/test-cases/${id}`, data);
    } catch {
      return { data: localStore.updateTestCase(id, data) };
    }
  },
  delete: async (id: number) => {
    if (isClientMode()) return { data: localStore.deleteTestCase(id) };
    try {
      return await api.delete(`/test-cases/${id}`);
    } catch {
      return { data: localStore.deleteTestCase(id) };
    }
  },
  updateStatus: async (id: number, status: string) => {
    if (isClientMode()) return { data: localStore.updateTestCase(id, { status }) };
    try {
      return await api.put(`/test-cases/${id}/status`, { status });
    } catch {
      return { data: localStore.updateTestCase(id, { status }) };
    }
  },
  addStep: async (testCaseId: number, step: { description: string; expectedResult: string }) => {
    if (isClientMode()) return { data: localStore.addStep(testCaseId, step) };
    try {
      return await api.post(`/test-cases/${testCaseId}/steps`, step);
    } catch {
      return { data: localStore.addStep(testCaseId, step) };
    }
  },
  updateStep: (testCaseId: number, stepId: number, data: Record<string, unknown>) =>
    api.put(`/test-cases/${testCaseId}/steps/${stepId}`, data),
  deleteStep: async (testCaseId: number, stepId: number) => {
    if (isClientMode()) return { data: localStore.deleteStep(testCaseId, stepId) };
    try {
      return await api.delete(`/test-cases/${testCaseId}/steps/${stepId}`);
    } catch {
      return { data: localStore.deleteStep(testCaseId, stepId) };
    }
  },
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
