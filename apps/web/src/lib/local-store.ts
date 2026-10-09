import initialProjects from './initial-data.json';
import { generateArgusLsmvTestSteps, ScenarioInput, TargetEnvironment } from './argus-lsmv-engine';

const STORAGE_KEY = 'tcm_local_projects';

interface Project {
  id: number;
  name: string;
  key: string;
  description?: string;
  status: string;
  modules?: Module[];
  _count?: { modules: number };
}

interface Module {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  orderIndex: number;
  scenarios?: Scenario[];
  project?: Project;
  _count?: { scenarios: number };
}

interface Scenario {
  id: number;
  moduleId: number;
  title: string;
  description?: string;
  priority: string;
  preconditions?: string;
  expectedOutcome?: string;
  status: string;
  module?: Module;
  testCases?: TestCase[];
  _count?: { testCases: number };
}

interface TestStep {
  id: number;
  testCaseId: number;
  stepNumber: number;
  description: string;
  expectedResult: string;
}

interface TestCase {
  id: number;
  scenarioId: number;
  title: string;
  description?: string;
  preConditions?: string;
  postConditions?: string;
  priority: string;
  status: string;
  aiGenerated?: boolean;
  steps?: TestStep[];
  scenario?: Scenario;
  _count?: { steps: number };
}

function loadProjects(): Project[] {
  if (typeof window === 'undefined') {
    return initialProjects as any;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProjects));
      return initialProjects as any;
    }
    return JSON.parse(raw);
  } catch {
    return initialProjects as any;
  }
}

function saveProjects(projects: Project[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export const localStore = {
  // Projects
  getProjects: () => {
    const projects = loadProjects();
    return projects.map((p) => ({
      ...p,
      _count: { modules: p.modules?.length || 0 },
    }));
  },

  getProjectById: (id: number) => {
    const projects = loadProjects();
    const project = projects.find((p) => p.id === id);
    if (!project) throw new Error('Project not found');
    return {
      ...project,
      _count: { modules: project.modules?.length || 0 },
    };
  },

  createProject: (data: { name: string; key: string; description?: string }) => {
    const projects = loadProjects();
    const newId = Math.max(...projects.map((p) => p.id), 0) + 1;
    const newProject: Project = {
      id: newId,
      name: data.name,
      key: data.key,
      description: data.description || '',
      status: 'active',
      modules: [],
    };
    projects.push(newProject);
    saveProjects(projects);
    return newProject;
  },

  deleteProject: (id: number) => {
    let projects = loadProjects();
    projects = projects.filter((p) => p.id !== id);
    saveProjects(projects);
    return { success: true };
  },

  // Modules
  getModules: (projectId?: number) => {
    const projects = loadProjects();
    let allModules: Module[] = [];
    projects.forEach((p) => {
      p.modules?.forEach((m) => {
        allModules.push({
          ...m,
          project: { id: p.id, name: p.name, key: p.key, description: p.description, status: p.status },
          _count: { scenarios: m.scenarios?.length || 0 },
        });
      });
    });
    if (projectId) {
      allModules = allModules.filter((m) => m.projectId === projectId);
    }
    return allModules;
  },

  getModuleById: (id: number) => {
    const modules = localStore.getModules();
    const module = modules.find((m) => m.id === id);
    if (!module) throw new Error('Module not found');
    return module;
  },

  createModule: (projectId: number, data: { name: string; description?: string }) => {
    const projects = loadProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) throw new Error('Project not found');
    if (!project.modules) project.modules = [];

    const allModuleIds = projects.flatMap((p) => p.modules?.map((m) => m.id) || []);
    const newId = Math.max(...allModuleIds, 0) + 1;

    const newModule: Module = {
      id: newId,
      projectId,
      name: data.name,
      description: data.description || '',
      orderIndex: project.modules.length,
      scenarios: [],
    };
    project.modules.push(newModule);
    saveProjects(projects);
    return newModule;
  },

  deleteModule: (id: number) => {
    const projects = loadProjects();
    projects.forEach((p) => {
      if (p.modules) {
        p.modules = p.modules.filter((m) => m.id !== id);
      }
    });
    saveProjects(projects);
    return { success: true };
  },

  // Scenarios
  getScenarios: (params?: { moduleId?: number; status?: string }) => {
    const projects = loadProjects();
    const scenarios: Scenario[] = [];
    projects.forEach((p) => {
      p.modules?.forEach((m) => {
        m.scenarios?.forEach((s) => {
          scenarios.push({
            ...s,
            module: {
              ...m,
              project: { id: p.id, name: p.name, key: p.key, description: p.description, status: p.status },
            },
            _count: { testCases: s.testCases?.length || 0 },
          });
        });
      });
    });

    let filtered = scenarios;
    if (params?.moduleId) {
      filtered = filtered.filter((s) => s.moduleId === params.moduleId);
    }
    if (params?.status) {
      filtered = filtered.filter((s) => s.status === params.status);
    }
    return filtered;
  },

  getScenarioById: (id: number) => {
    const scenarios = localStore.getScenarios();
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario) throw new Error('Scenario not found');
    return scenario;
  },

  createScenario: (data: {
    moduleId: number;
    title: string;
    description?: string;
    priority?: string;
    preconditions?: string;
    expectedOutcome?: string;
  }) => {
    const projects = loadProjects();
    let targetModule: Module | undefined;
    for (const p of projects) {
      targetModule = p.modules?.find((m) => m.id === data.moduleId);
      if (targetModule) break;
    }
    if (!targetModule) throw new Error('Module not found');
    if (!targetModule.scenarios) targetModule.scenarios = [];

    const allScenarioIds = projects.flatMap(
      (p) => p.modules?.flatMap((m) => m.scenarios?.map((s) => s.id) || []) || []
    );
    const newId = Math.max(...allScenarioIds, 0) + 1;

    const newScenario: Scenario = {
      id: newId,
      moduleId: data.moduleId,
      title: data.title,
      description: data.description || '',
      priority: data.priority || 'medium',
      preconditions: data.preconditions || '',
      expectedOutcome: data.expectedOutcome || '',
      status: 'draft',
      testCases: [],
    };
    targetModule.scenarios.push(newScenario);
    saveProjects(projects);
    return newScenario;
  },

  deleteScenario: (id: number) => {
    const projects = loadProjects();
    projects.forEach((p) => {
      p.modules?.forEach((m) => {
        if (m.scenarios) {
          m.scenarios = m.scenarios.filter((s) => s.id !== id);
        }
      });
    });
    saveProjects(projects);
    return { success: true };
  },

  // Test Cases
  getTestCases: (params?: { scenarioId?: number; status?: string }) => {
    const scenarios = localStore.getScenarios();
    const testCases: TestCase[] = [];
    scenarios.forEach((s) => {
      s.testCases?.forEach((tc) => {
        testCases.push({
          ...tc,
          scenario: s,
          _count: { steps: tc.steps?.length || 0 },
        });
      });
    });

    let filtered = testCases;
    if (params?.scenarioId) {
      filtered = filtered.filter((tc) => tc.scenarioId === params.scenarioId);
    }
    if (params?.status) {
      filtered = filtered.filter((tc) => tc.status === params.status);
    }
    return filtered;
  },

  getTestCaseById: (id: number) => {
    const testCases = localStore.getTestCases();
    const tc = testCases.find((t) => t.id === id);
    if (!tc) throw new Error('Test case not found');
    return tc;
  },

  createTestCase: (data: {
    scenarioId: number;
    title: string;
    description?: string;
    preConditions?: string;
    postConditions?: string;
    priority?: string;
  }) => {
    const projects = loadProjects();
    let targetScenario: Scenario | undefined;
    for (const p of projects) {
      for (const m of p.modules || []) {
        targetScenario = m.scenarios?.find((s) => s.id === data.scenarioId);
        if (targetScenario) break;
      }
      if (targetScenario) break;
    }
    if (!targetScenario) throw new Error('Scenario not found');
    if (!targetScenario.testCases) targetScenario.testCases = [];

    const allTestCases = projects.flatMap(
      (p) => p.modules?.flatMap((m) => m.scenarios?.flatMap((s) => s.testCases || []) || []) || []
    );
    const newId = Math.max(...allTestCases.map((tc) => tc.id), 0) + 1;

    const newTestCase: TestCase = {
      id: newId,
      scenarioId: data.scenarioId,
      title: data.title,
      description: data.description || '',
      preConditions: data.preConditions || '',
      postConditions: data.postConditions || '',
      priority: data.priority || 'medium',
      status: 'draft',
      steps: [],
    };
    targetScenario.testCases.push(newTestCase);
    saveProjects(projects);
    return newTestCase;
  },

  updateTestCase: (id: number, data: Record<string, any>) => {
    const projects = loadProjects();
    let foundTc: TestCase | undefined;
    for (const p of projects) {
      for (const m of p.modules || []) {
        for (const s of m.scenarios || []) {
          const tc = s.testCases?.find((t) => t.id === id);
          if (tc) {
            Object.assign(tc, data);
            foundTc = tc;
            break;
          }
        }
        if (foundTc) break;
      }
      if (foundTc) break;
    }
    if (!foundTc) throw new Error('Test case not found');
    saveProjects(projects);
    return foundTc;
  },

  deleteTestCase: (id: number) => {
    const projects = loadProjects();
    projects.forEach((p) => {
      p.modules?.forEach((m) => {
        if (m.scenarios) {
          m.scenarios.forEach((s) => {
            if (s.testCases) {
              s.testCases = s.testCases.filter((tc) => tc.id !== id);
            }
          });
        }
      });
    });
    saveProjects(projects);
    return { success: true };
  },

  addStep: (testCaseId: number, step: { description: string; expectedResult: string }) => {
    const projects = loadProjects();
    let targetTc: TestCase | undefined;
    for (const p of projects) {
      for (const m of p.modules || []) {
        for (const s of m.scenarios || []) {
          targetTc = s.testCases?.find((t) => t.id === testCaseId);
          if (targetTc) break;
        }
        if (targetTc) break;
      }
      if (targetTc) break;
    }
    if (!targetTc) throw new Error('Test case not found');
    if (!targetTc.steps) targetTc.steps = [];

    const allStepIds = projects.flatMap(
      (p) =>
        p.modules?.flatMap(
          (m) =>
            m.scenarios?.flatMap((s) => s.testCases?.flatMap((tc) => tc.steps?.map((st) => st.id) || []) || []) ||
            []
        ) || []
    );
    const newStepId = Math.max(...allStepIds, 0) + 1;

    const newStep: TestStep = {
      id: newStepId,
      testCaseId,
      stepNumber: targetTc.steps.length + 1,
      description: step.description,
      expectedResult: step.expectedResult,
    };
    targetTc.steps.push(newStep);
    saveProjects(projects);
    return newStep;
  },

  deleteStep: (testCaseId: number, stepId: number) => {
    const projects = loadProjects();
    projects.forEach((p) => {
      p.modules?.forEach((m) => {
        m.scenarios?.forEach((s) => {
          s.testCases?.forEach((tc) => {
            if (tc.id === testCaseId && tc.steps) {
              tc.steps = tc.steps.filter((st) => st.id !== stepId);
              // Re-number
              tc.steps.forEach((st, idx) => {
                st.stepNumber = idx + 1;
              });
            }
          });
        });
      });
    });
    saveProjects(projects);
    return { success: true };
  },

  // AI Generation on Client
  generateTestCasesForScenario: (scenarioId: number) => {
    const scenario = localStore.getScenarioById(scenarioId);
    const argusStepsResult = generateArgusLsmvTestSteps({
      scenarioTitle: scenario.title,
      scenarioDescription: scenario.description,
      preconditions: scenario.preconditions,
      expectedOutcome: scenario.expectedOutcome,
    });

    const primaryCase = localStore.createTestCase({
      scenarioId,
      title: `${scenario.title} - Argus / LSMV End-to-End Workflow`,
      description: scenario.description || `Validate full pharmacovigilance workflow for ${scenario.title}`,
      priority: scenario.priority || 'high',
      preConditions: argusStepsResult.preConditions,
      postConditions: argusStepsResult.postConditions,
    });
    argusStepsResult.steps.forEach((st) => localStore.addStep(primaryCase.id, st));

    // Also create Negative & Conformance verification cases
    const validationCase = localStore.createTestCase({
      scenarioId,
      title: `${scenario.title} - Mandatory Field & E2B(R3) Validation Checks`,
      description: `Verify ICSR validation engine flags missing mandatory elements and blocks submission without required data.`,
      priority: 'high',
      preConditions: argusStepsResult.preConditions,
      postConditions: `Validation errors displayed; case cannot be locked until errors resolved.`,
    });
    [
      { stepNumber: 1, description: 'Open case in Argus Safety and clear mandatory Primary Reporter or Suspect Drug fields.', expectedResult: 'Mandatory field markers highlight in red.' },
      { stepNumber: 2, description: 'Click "ICSR Validation Check".', expectedResult: 'Argus ICSR Validator presents list of critical E2B conformance errors.' },
      { stepNumber: 3, description: 'Attempt to execute "Case Lock".', expectedResult: 'System blocks case locking and requires resolution of mandatory validation errors.' },
    ].forEach((st) => localStore.addStep(validationCase.id, st));

    return { jobId: `local_${Date.now()}`, status: 'completed', testCases: [primaryCase, validationCase] };
  },

  generateTestSteps: (data: ScenarioInput) => {
    return generateArgusLsmvTestSteps(data);
  },
};
