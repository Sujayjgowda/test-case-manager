import OpenAI from 'openai';
import { prisma } from '../index.js';
import { NotFoundError } from '../middleware/error-handler.js';

// In-memory job storage (use Redis/Bull in production)
const generationJobs = new Map<
  string,
  {
    id: string;
    scenarioId: number;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    prompt?: string;
    options?: Record<string, unknown>;
    testCases?: unknown[];
    error?: string;
    createdAt: Date;
    completedAt?: Date;
  }
>();

let jobIdCounter = 0;

function generateJobId(): string {
  return `job_${Date.now()}_${++jobIdCounter}`;
}

// Lazy client — reads key fresh on each call so .env changes are always picked up
function getSambaNovaClient() {
  const apiKey = process.env.SAMBANOVA_API_KEY;
  if (!apiKey) throw new Error('SAMBANOVA_API_KEY is not set in environment variables');

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.sambanova.ai/v1',
  });
}

async function callAI(prompt: string): Promise<string> {
  const client = getSambaNovaClient();
  const models = ['Meta-Llama-3.3-70B-Instruct', 'gemma-4-31B-it'];

  let lastError: any = null;
  for (const model of models) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 3072,
      });

      const content = completion.choices[0]?.message?.content;
      if (content) return content;
    } catch (err: any) {
      lastError = err;
      console.warn(`SambaNova model ${model} attempt failed: ${err.message}`);
    }
  }

  throw lastError || new Error('SambaNova AI call failed');
}

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return text.trim();
}

// --- Domain-Aware Fallback Generators ---

function generateFallbackTestCases(
  scenario: any,
  prompt?: string,
  options?: Record<string, unknown>
) {
  const title = scenario.title || 'Test Scenario';
  const desc = scenario.description || title;
  const preconditions = scenario.preconditions || 'System operational and prerequisites met';
  const expectedOutcome = scenario.expectedOutcome || 'Operation executes and state is verified';
  const moduleName = scenario.module?.name || 'General Module';

  return [
    {
      title: `${title} - Positive / Standard Workflow Verification`,
      description: `Validate end-to-end execution of "${title}" under standard operational conditions.`,
      preConditions: preconditions,
      postConditions: expectedOutcome,
      priority: 'high',
      steps: [
        {
          stepNumber: 1,
          description: `Access the ${moduleName} module within the application dashboard.`,
          expectedResult: `Module interface loads successfully with all navigation tabs and action controls accessible.`,
        },
        {
          stepNumber: 2,
          description: `Verify that system preconditions are active: "${preconditions}".`,
          expectedResult: `Initial state confirms required records, configurations, or privileges are available.`,
        },
        {
          stepNumber: 3,
          description: `Initiate the transaction for "${title}" and input all valid mandatory parameters.`,
          expectedResult: `All form inputs accept data without formatting errors or inline validation flags.`,
        },
        {
          stepNumber: 4,
          description: `Submit and execute the action, observing client-side request dispatch.`,
          expectedResult: `System shows progress/processing indicator and submits payload without timeout.`,
        },
        {
          stepNumber: 5,
          description: `Confirm primary business outcome: "${expectedOutcome}".`,
          expectedResult: `Success notification appears and record status updates to confirmed/active.`,
        },
        {
          stepNumber: 6,
          description: `Verify system audit log and persisted record consistency in database/storage.`,
          expectedResult: `Activity log documents the event with timestamp, user ID, and unchanged attributes.`,
        },
      ],
    },
    {
      title: `${title} - Negative Flow: Mandatory Field & Missing Input Validation`,
      description: `Ensure the system prevents submission and enforces validation when required inputs are omitted.`,
      preConditions: preconditions,
      postConditions: `No invalid or partial transaction records are committed to the system.`,
      priority: 'high',
      steps: [
        {
          stepNumber: 1,
          description: `Open the entry form for "${title}".`,
          expectedResult: `Form loads with mandatory indicators (asterisks or highlights) visible.`,
        },
        {
          stepNumber: 2,
          description: `Leave mandatory fields blank and trigger the submit/save action.`,
          expectedResult: `Submission is rejected with field-level inline error messages displayed.`,
        },
        {
          stepNumber: 3,
          description: `Verify that form state retains focus on the first invalid field and no server record is generated.`,
          expectedResult: `System prevents persistence and maintains clean state.`,
        },
      ],
    },
    {
      title: `${title} - Boundary & Limit Verification`,
      description: `Test system handling of boundary characters, maximum field lengths, and extreme parameter values.`,
      preConditions: preconditions,
      postConditions: `Inputs exceeding limits are either gracefully truncated or rejected with clear feedback.`,
      priority: 'medium',
      steps: [
        {
          stepNumber: 1,
          description: `Navigate to "${title}" entry screen and enter inputs with maximum allowed boundary lengths.`,
          expectedResult: `System enforces maximum length constraints or indicators without crashing.`,
        },
        {
          stepNumber: 2,
          description: `Enter special characters, unicode strings, and whitespace variations in descriptive fields.`,
          expectedResult: `System handles special formatting properly with sanitization.`,
        },
        {
          stepNumber: 3,
          description: `Execute submission and verify stored string representation.`,
          expectedResult: `Data is stored accurately without injection errors or truncation corruption.`,
        },
      ],
    },
    {
      title: `${title} - Access Control & Role-Based Permissions`,
      description: `Verify that unauthorized or read-only users cannot perform or modify "${title}".`,
      preConditions: `User logged in with restricted / non-privileged role.`,
      postConditions: `Restricted operations remain protected and unauthorized actions are blocked.`,
      priority: 'high',
      steps: [
        {
          stepNumber: 1,
          description: `Attempt to access the action controls for "${title}" using a restricted account.`,
          expectedResult: `Action buttons are disabled or hidden based on RBAC rules.`,
        },
        {
          stepNumber: 2,
          description: `Attempt direct URL or API execution for the protected endpoint.`,
          expectedResult: `Server returns HTTP 403 Forbidden with access denial log recorded.`,
        },
      ],
    },
    {
      title: `${title} - Error Recovery & Concurrency Handling`,
      description: `Verify system resiliency when double-submitting or facing transient network interruptions.`,
      preConditions: preconditions,
      postConditions: `Idempotency is maintained; no duplicate entries created.`,
      priority: 'medium',
      steps: [
        {
          stepNumber: 1,
          description: `Trigger the submission action for "${title}" rapidly twice (double click test).`,
          expectedResult: `System disables the submit button on first click to prevent duplicate submissions.`,
        },
        {
          stepNumber: 2,
          description: `Verify database records for duplicate entries.`,
          expectedResult: `Exactly one transaction is created and confirmed.`,
        },
      ],
    },
  ];
}

function generateFallbackStepsForScenario(data: {
  scenarioTitle: string;
  scenarioDescription?: string;
  preconditions?: string;
  expectedOutcome?: string;
  additionalInstructions?: string;
  environment?: 'argus' | 'lsmv';
}) {
  const { scenarioTitle, scenarioDescription, preconditions, expectedOutcome, environment = 'argus' } = data;

  const isLsmv = environment === 'lsmv' ||
    scenarioTitle.toLowerCase().includes('lsmv') ||
    (scenarioDescription || '').toLowerCase().includes('lsmv') ||
    scenarioTitle.toLowerCase().includes('literature');

  if (isLsmv) {
    return {
      title: scenarioTitle,
      description: scenarioDescription || `LSMV Literature Screening & Medical Valuation: ${scenarioTitle}`,
      preConditions: preconditions || 'LSMV Literature Intake queue configured; user authenticated with Screener/Medical Evaluator role.',
      postConditions: expectedOutcome || 'Literature citation triaged, 4 ICSR criteria evaluated, and record disposition updated.',
      environment: 'lsmv',
      steps: [
        {
          stepNumber: 1,
          description: 'Log into the LSMV (Literature Screening & Medical Valuation) application worklist.',
          expectedResult: 'LSMV dashboard displays unreviewed literature batches and citation counts.',
        },
        {
          stepNumber: 2,
          description: 'Navigate to Literature Triage Queue and filter by search strategy feed (PubMed / Embase).',
          expectedResult: 'Target citation list is displayed with Title, Abstract, Source Journal, and PMID / DOI.',
        },
        {
          stepNumber: 3,
          description: 'Select target article row to open the LSMV Citation Evaluation viewer.',
          expectedResult: 'Article metadata pane, Abstract tab, and Full-Text viewer render without error.',
        },
        {
          stepNumber: 4,
          description: 'Execute duplicate citation cross-check against existing records in LSMV database.',
          expectedResult: 'Duplicate screening engine compares DOI/title and displays match score.',
        },
        {
          stepNumber: 5,
          description: 'Evaluate the 4 mandatory ICSR minimum criteria: Identifiable Reporter, Identifiable Patient, Suspect Product, and Adverse Event.',
          expectedResult: 'Screener checklist reflects compliance for all 4 ICSR criteria or flags missing elements.',
        },
        {
          stepNumber: 6,
          description: 'Access the Full-Text PDF Viewer tab and review full journal publication.',
          expectedResult: 'High-resolution PDF opens with text search and annotation capabilities active.',
        },
        {
          stepNumber: 7,
          description: 'Highlight and annotate adverse event narrative, patient demographics, and dosage regimens.',
          expectedResult: 'Clinical annotations saved and linked to structured extraction fields in LSMV.',
        },
        {
          stepNumber: 8,
          description: 'Route citation to Medical Valuation tab for physician review (Special Situations / Off-Label / Causality).',
          expectedResult: 'Medical Evaluator assessment section unlocks for clinical comments and sign-off.',
        },
        {
          stepNumber: 9,
          description: 'Assign final screening disposition: "Potential ICSR" or "Non-ICSR / No Safety Signal".',
          expectedResult: 'Triage disposition badge updates with reason code recorded in audit trail.',
        },
        {
          stepNumber: 10,
          description: 'For Potential ICSRs, trigger Export to Safety Database (Oracle Argus Safety Intake Queue).',
          expectedResult: 'LSMV transmits bibliographic metadata, abstract, and PDF attachment to safety intake queue.',
        },
        {
          stepNumber: 11,
          description: 'Verify LSMV audit log and transmission status.',
          expectedResult: 'Audit log reflects user ID, timestamp, disposition decision, and transmission confirmation.',
        },
      ],
    };
  }

  // Oracle Argus Safety dedicated steps
  return {
    title: scenarioTitle,
    description: scenarioDescription || `Oracle Argus Safety: ${scenarioTitle}`,
    preConditions: preconditions || 'Oracle Argus Safety enterprise database active; user logged in with Case Processor role.',
    postConditions: expectedOutcome || 'Case processed in Argus Safety, validated, locked with 21 CFR Part 11 signature, and submitted.',
    environment: 'argus',
    steps: [
      {
        stepNumber: 1,
        description: 'Log into Oracle Argus Safety application using authorized Case Processor credentials.',
        expectedResult: 'Argus Safety home portal loads displaying Personal Worklist and Case Intake queue.',
      },
      {
        stepNumber: 2,
        description: 'Navigate to Case Actions > BookIn and select Initial Case Book-in.',
        expectedResult: 'Argus BookIn window opens with Report Type, Country, and Receipt Date fields populated.',
      },
      {
        stepNumber: 3,
        description: 'Execute mandatory Duplicate Search by entering patient initials, adverse event, and suspect drug.',
        expectedResult: 'Duplicate search grid confirms no existing matching cases in the Argus database.',
      },
      {
        stepNumber: 4,
        description: 'Enter General Tab details: Primary Reporter information, Healthcare Professional flag, and Receipt Date.',
        expectedResult: 'Reporter details validated and saved to Argus General tab.',
      },
      {
        stepNumber: 5,
        description: 'Navigate to Patient Tab and record Demographics (Age, Gender, Weight) and Medical History.',
        expectedResult: 'Patient identifiers stored with privacy masking according to enterprise configuration.',
      },
      {
        stepNumber: 6,
        description: 'Navigate to Products Tab and enter Suspect Product name, dosage formulation, and indication.',
        expectedResult: 'Product selected from Argus Company Product Dictionary with WHO-DD link established.',
      },
      {
        stepNumber: 7,
        description: 'Navigate to Events Tab, enter verbatim adverse event term, and trigger MedDRA Auto-Coding.',
        expectedResult: 'MedDRA coding engine resolves term to LLT, PT, and displays primary SOC hierarchy.',
      },
      {
        stepNumber: 8,
        description: 'Navigate to Analysis Tab to perform Listedness determination against CCDS and record Causality assessment.',
        expectedResult: 'Listedness auto-populates as Unlisted/Listed and physician causality score is recorded.',
      },
      {
        stepNumber: 9,
        description: 'Click "ICSR Validation" button to execute comprehensive validation checks.',
        expectedResult: 'Argus validation window displays "0 Errors, 0 Warnings" confirming E2B(R3) conformance.',
      },
      {
        stepNumber: 10,
        description: 'Execute Case Lock under Case Actions > Case Lock with 21 CFR Part 11 electronic signature authentication.',
        expectedResult: 'Case status changes to "Locked", all form fields become read-only, and audit trail logs signature.',
      },
      {
        stepNumber: 11,
        description: 'Generate E2B(R3) electronic report and transmit to health authority gateway (FDA FAERS / EMA).',
        expectedResult: 'E2B(R3) XML generated, transmitted via B2B gateway, and positive MDN ACK (Code 01) captured.',
      },
    ],
  };
}

// --- Main Service Functions ---

export async function generateTestCases(
  scenarioId: number,
  prompt?: string,
  options?: Record<string, unknown>
) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    include: {
      module: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!scenario) {
    throw new NotFoundError('Scenario');
  }

  const jobId = generateJobId();

  // Create job
  generationJobs.set(jobId, {
    id: jobId,
    scenarioId,
    status: 'queued',
    prompt,
    options,
    createdAt: new Date(),
  });

  // Start async processing
  processGeneration(jobId, scenario, prompt, options).catch((err) => {
    console.error('Generation error:', err);
    const job = generationJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = err.message;
      job.completedAt = new Date();
      generationJobs.set(jobId, job);
    }
  });

  return {
    jobId,
    status: 'queued',
    estimatedCompletion: '5-15 seconds',
  };
}

async function processGeneration(
  jobId: string,
  scenario: any,
  prompt?: string,
  options?: Record<string, unknown>
) {
  // Update job status
  const job = generationJobs.get(jobId);
  if (job) {
    job.status = 'processing';
    generationJobs.set(jobId, job);
  }

  // Build AI prompt
  const aiPrompt = buildGenerationPrompt(scenario, prompt, options);

  let testCases: any[] = [];

  try {
    const rawText = await callAI(aiPrompt);
    const result = JSON.parse(extractJSON(rawText));
    testCases = result.testCases || [];
  } catch (aiErr: any) {
    console.warn(`[AI Service] AI generation failed (${aiErr.message}), activating smart fallback generator.`);
    testCases = generateFallbackTestCases(scenario, prompt, options);
  }

  if (!testCases || testCases.length === 0) {
    testCases = generateFallbackTestCases(scenario, prompt, options);
  }

  try {
    // Create test cases in database
    const createdTestCases = await Promise.all(
      testCases.map((tc: any) =>
        prisma.testCase.create({
          data: {
            scenarioId: scenario.id,
            title: tc.title,
            description: tc.description || '',
            preConditions: tc.preConditions || '',
            postConditions: tc.postConditions || '',
            priority: tc.priority || 'medium',
            status: 'draft',
            aiGenerated: true,
            aiPrompt: prompt || null,
            testData: tc.testData ? JSON.stringify(tc.testData) : null,
          },
        })
      )
    );

    // Create steps for each test case
    for (const tc of createdTestCases) {
      const originalTc = testCases.find((t: any) => t.title === tc.title);
      if (originalTc?.steps) {
        for (const step of originalTc.steps) {
          await prisma.testStep.create({
            data: {
              testCaseId: tc.id,
              stepNumber: step.stepNumber,
              description: step.description,
              expectedResult: step.expectedResult,
            },
          });
        }
      }
    }

    // Update job status
    const completedJob = generationJobs.get(jobId);
    if (completedJob) {
      completedJob.status = 'completed';
      completedJob.testCases = createdTestCases;
      completedJob.completedAt = new Date();
      generationJobs.set(jobId, completedJob);
    }
  } catch (dbError: any) {
    throw new Error(`Failed to save generated test cases: ${dbError.message}`);
  }
}

function buildGenerationPrompt(
  scenario: any,
  prompt?: string,
  options?: Record<string, unknown>
): string {
  const { includeNegativeCases, includeEdgeCases, numberOfCases = 5 } = options || {};

  return `You are an expert QA engineer. Generate comprehensive test cases for the following scenario:

**Project:** ${scenario.module.project.name}
**Module:** ${scenario.module.name}
**Scenario:** ${scenario.title}
**Description:** ${scenario.description || 'No description provided'}
**Preconditions:** ${scenario.preconditions || 'None specified'}
**Expected Outcome:** ${scenario.expectedOutcome || 'Not specified'}

Requirements:
- Generate ${numberOfCases} test cases
${includeNegativeCases ? '- Include negative test cases (invalid inputs, error conditions)' : ''}
${includeEdgeCases ? '- Include edge cases and boundary conditions' : ''}
- Include clear, actionable steps for each test case
- Include expected results for each step
- Cover happy path, alternative flows, and error scenarios

${prompt ? `Additional instructions: ${prompt}` : ''}

Format the response as JSON with this exact structure (no markdown, no extra text):
{
  "testCases": [
    {
      "title": "Clear, descriptive title",
      "description": "Brief description of what this test validates",
      "preConditions": "Any preconditions needed",
      "postConditions": "Expected state after test",
      "priority": "high|medium|low",
      "steps": [
        {
          "stepNumber": 1,
          "description": "Action to perform",
          "expectedResult": "Expected outcome"
        }
      ]
    }
  ]
}

Respond ONLY with valid JSON, no additional text.`;
}

export async function getGenerationStatus(scenarioId: number) {
  const jobs = Array.from(generationJobs.values())
    .filter((j) => j.scenarioId === scenarioId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (jobs.length === 0) {
    return { status: 'no_jobs' };
  }

  const job = jobs[0];
  return {
    jobId: job.id,
    status: job.status,
    error: job.error,
    testCases: job.testCases,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  };
}

export async function getJobStatus(jobId: string) {
  const job = generationJobs.get(jobId);
  if (!job) {
    throw new NotFoundError('Job');
  }

  return {
    id: job.id,
    scenarioId: job.scenarioId,
    status: job.status,
    error: job.error,
    testCases: job.testCases,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  };
}

export async function generateSteps(testCaseId: number, prompt?: string) {
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: {
      scenario: true,
    },
  });

  if (!testCase) {
    throw new NotFoundError('Test case');
  }

  const aiPrompt = `Generate detailed test steps for the following test case:

**Test Case:** ${testCase.title}
**Description:** ${testCase.description || 'No description'}
**Scenario:** ${testCase.scenario.title}

${prompt ? `Additional instructions: ${prompt}` : ''}

Format as JSON (no markdown, no extra text):
{
  "steps": [
    {
      "stepNumber": 1,
      "description": "Step description",
      "expectedResult": "Expected result"
    }
  ]
}`;

  try {
    const rawText = await callAI(aiPrompt);
    const result = JSON.parse(extractJSON(rawText));
    return result.steps || [];
  } catch (err: any) {
    console.warn(`[AI Service] AI steps generation failed (${err.message}), using fallback.`);
    const fallback = generateFallbackStepsForScenario({
      scenarioTitle: testCase.title,
      scenarioDescription: testCase.description,
      preconditions: testCase.preConditions,
      expectedOutcome: testCase.postConditions,
    });
    return fallback.steps;
  }
}

export async function improveTestCase(testCaseId: number, instructions: string) {
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
      scenario: true,
    },
  });

  if (!testCase) {
    throw new NotFoundError('Test case');
  }

  const aiPrompt = `Improve the following test case based on these instructions: "${instructions}"

**Current Test Case:**
Title: ${testCase.title}
Description: ${testCase.description || 'N/A'}
Pre-conditions: ${testCase.preConditions || 'N/A'}
Post-conditions: ${testCase.postConditions || 'N/A'}

**Current Steps:**
${testCase.steps.map((s) => `${s.stepNumber}. ${s.description} -> ${s.expectedResult}`).join('\n')}

Provide improved version as JSON (no markdown, no extra text):
{
  "title": "Improved title",
  "description": "Improved description",
  "preConditions": "Improved preconditions",
  "postConditions": "Improved postconditions",
  "steps": [
    {
      "stepNumber": 1,
      "description": "Step description",
      "expectedResult": "Expected result"
    }
  ]
}`;

  try {
    const rawText = await callAI(aiPrompt);
    return JSON.parse(extractJSON(rawText));
  } catch (err: any) {
    console.warn(`[AI Service] AI improve test case failed (${err.message}), using enhanced fallback.`);
    return {
      title: `${testCase.title} [Enhanced]`,
      description: `${testCase.description || ''} (Enhanced: ${instructions})`.trim(),
      preConditions: testCase.preConditions || 'Standard preconditions satisfied',
      postConditions: testCase.postConditions || 'Postconditions verified',
      steps: testCase.steps.length > 0 ? testCase.steps : generateFallbackStepsForScenario({
        scenarioTitle: testCase.title,
        scenarioDescription: testCase.description,
        preconditions: testCase.preConditions,
        expectedOutcome: testCase.postConditions,
      }).steps,
    };
  }
}

export async function generateTestStepsFromScenario(data: {
  scenarioTitle: string;
  scenarioDescription: string;
  preconditions: string;
  expectedOutcome: string;
  additionalInstructions?: string;
  environment?: 'argus' | 'lsmv';
}) {
  const {
    scenarioTitle,
    scenarioDescription,
    preconditions,
    expectedOutcome,
    additionalInstructions,
    environment = 'argus',
  } = data;

  const isLsmv = environment === 'lsmv' ||
    scenarioTitle.toLowerCase().includes('lsmv') ||
    (scenarioDescription || '').toLowerCase().includes('lsmv') ||
    scenarioTitle.toLowerCase().includes('literature');

  const appGuidance = isLsmv
    ? `TARGET APPLICATION: LSMV (Literature Screening & Medical Valuation).
CRITICAL: Generate test steps STRICTLY for LSMV (PubMed/Embase Feed Ingestion, 4-Criteria ICSR Triage [Reporter, Patient, Drug, Event], Duplicate Screening, Full-Text PDF Review, Medical Valuation, QC Audit & Export to Safety DB).
DO NOT INCLUDE or club Oracle Argus Safety Case Form tabs (BookIn, General, Patient, Product, Events tabs). Keep steps 100% focused on LSMV.`
    : `TARGET APPLICATION: Oracle Argus Safety.
CRITICAL: Generate test steps STRICTLY for Oracle Argus Safety (Case Intake/Book-in, Duplicate Detection, General, Patient, Products, Events tabs, MedDRA Auto-Coding, Listedness, WHO Causality, 21 CFR Part 11 Case Lock, E2B-R3 Regulatory Submission).
DO NOT INCLUDE or club LSMV Literature Triage steps. Keep steps 100% focused on Oracle Argus Safety.`;

  const aiPrompt = `You are an expert QA engineer specializing in Pharmacovigilance and Drug Safety systems validation. Generate detailed test steps for the following test scenario:

**Scenario Title:** ${scenarioTitle}
**Target Environment:** ${isLsmv ? 'LSMV (Literature Screening & Medical Valuation)' : 'Oracle Argus Safety'}
**Description:** ${scenarioDescription || 'No description provided'}
**Preconditions:** ${preconditions || 'None specified'}
**Expected Outcome:** ${expectedOutcome || 'Not specified'}

${appGuidance}

${additionalInstructions ? `**Additional Instructions:** ${additionalInstructions}` : ''}

Requirements:
- Generate 10-15 detailed, actionable test steps strictly for this application
- Each step should have a clear action and expected result
- Include navigation steps, data entry steps, verification steps, and outcome validation
- Cover the complete workflow from start to finish
- Include both positive path and relevant validation checks

Format the response as JSON (no markdown, no extra text):
{
  "title": "${scenarioTitle}",
  "description": "${scenarioDescription || ''}",
  "preConditions": "${preconditions || ''}",
  "postConditions": "${expectedOutcome || ''}",
  "environment": "${isLsmv ? 'lsmv' : 'argus'}",
  "steps": [
    {
      "stepNumber": 1,
      "description": "Clear, actionable step description",
      "expectedResult": "Specific, verifiable expected outcome"
    }
  ]
}

Respond ONLY with valid JSON, no additional text.`;

  try {
    const rawText = await callAI(aiPrompt);
    return JSON.parse(extractJSON(rawText));
  } catch (aiErr: any) {
    console.warn(`[AI Service] AI generate-test-steps failed (${aiErr.message}), activating smart fallback.`);
    return generateFallbackStepsForScenario(data);
  }
}
