import initialProjects from './initial-data.json';

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
    const cases = [
      {
        title: `${scenario.title} - Standard Positive Workflow`,
        description: `Verify standard execution of "${scenario.title}" with valid data.`,
        priority: 'high',
        steps: [
          { stepNumber: 1, description: `Navigate to ${scenario.module?.name} screen.`, expectedResult: 'Screen loads with inputs.' },
          { stepNumber: 2, description: `Enter valid parameters for ${scenario.title}.`, expectedResult: 'All fields accept input.' },
          { stepNumber: 3, description: 'Submit transaction.', expectedResult: 'Request processes and confirmation appears.' },
          { stepNumber: 4, description: 'Verify expected outcome: ' + (scenario.expectedOutcome || 'Complete'), expectedResult: 'Status confirmed.' },
        ],
      },
      {
        title: `${scenario.title} - Mandatory Field Validation`,
        description: `Verify system error handling when required inputs are omitted.`,
        priority: 'medium',
        steps: [
          { stepNumber: 1, description: 'Open input form.', expectedResult: 'Form loads.' },
          { stepNumber: 2, description: 'Leave required fields blank and click Submit.', expectedResult: 'Inline validation errors appear.' },
          { stepNumber: 3, description: 'Verify record is not saved.', expectedResult: 'Database remains unchanged.' },
        ],
      },
      {
        title: `${scenario.title} - Boundary Limits Verification`,
        description: `Verify system stability when entering boundary characters and lengths.`,
        priority: 'medium',
        steps: [
          { stepNumber: 1, description: 'Enter maximum allowed length strings in all fields.', expectedResult: 'Lengths are constrained.' },
          { stepNumber: 2, description: 'Submit transaction.', expectedResult: 'System saves cleanly without errors.' },
        ],
      },
    ];

    const created = cases.map((c) => {
      const tc = localStore.createTestCase({
        scenarioId,
        title: c.title,
        description: c.description,
        priority: c.priority,
        preConditions: scenario.preconditions,
        postConditions: scenario.expectedOutcome,
      });
      c.steps.forEach((st) => localStore.addStep(tc.id, st));
      return tc;
    });

    return { jobId: `local_${Date.now()}`, status: 'completed', testCases: created };
  },

  generateTestSteps: (data: { scenarioTitle: string; scenarioDescription?: string; preconditions?: string; expectedOutcome?: string }) => {
    return {
      title: data.scenarioTitle,
      description: data.scenarioDescription || `Automated test steps for ${data.scenarioTitle}`,
      preConditions: data.preconditions || 'Environment active',
      postConditions: data.expectedOutcome || 'Execution successful',
      steps: [
        { stepNumber: 1, description: 'Log in with verified user credentials.', expectedResult: 'Dashboard opens.' },
        { stepNumber: 2, description: `Navigate to module for "${data.scenarioTitle}".`, expectedResult: 'Target screen loads completely.' },
        { stepNumber: 3, description: `Confirm preconditions: "${data.preconditions || 'Initial state ready'}".`, expectedResult: 'Preconditions verified.' },
        { stepNumber: 4, description: 'Open action form/dialog.', expectedResult: 'Form renders with required fields.' },
        { stepNumber: 5, description: `Enter valid test inputs for "${data.scenarioTitle}".`, expectedResult: 'Inputs validated.' },
        { stepNumber: 6, description: 'Click Submit/Process.', expectedResult: 'Request processes and confirmation is shown.' },
        { stepNumber: 7, description: `Validate outcome: "${data.expectedOutcome || 'Action completed'}".`, expectedResult: 'Records match expected state.' },
        { stepNumber: 8, description: 'Verify audit log entry.', expectedResult: 'Audit log documents change with timestamp and user ID.' },
      ],
    };
  },
};
