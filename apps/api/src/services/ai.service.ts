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
  const completion = await client.chat.completions.create({
    model: 'Meta-Llama-3.3-70B-Instruct',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 3072,
  });
  
  return completion.choices[0].message.content || '';
}

function extractJSON(text: string): string {
  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return text.trim();
}

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
    estimatedCompletion: '30-60 seconds',
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

  // Call AI API
  const rawText = await callAI(aiPrompt);

  try {
    const result = JSON.parse(extractJSON(rawText));
    const testCases = result.testCases || [];

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
  } catch (parseError) {
    throw new Error(`Failed to parse AI response: ${parseError}`);
  }
}

function buildGenerationPrompt(
  scenario: any,
  prompt?: string,
  options?: Record<string, unknown>
): string {
  const { includeNegativeCases, includeEdgeCases, numberOfCases = 10 } = options || {};

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
  // Find the most recent job for this scenario
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

  const rawText = await callAI(aiPrompt);
  const result = JSON.parse(extractJSON(rawText));
  return result.steps || [];
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

  const rawText = await callAI(aiPrompt);
  return JSON.parse(extractJSON(rawText));
}

export async function generateTestStepsFromScenario(data: {
  scenarioTitle: string;
  scenarioDescription: string;
  preconditions: string;
  expectedOutcome: string;
  additionalInstructions?: string;
}) {
  const {
    scenarioTitle,
    scenarioDescription,
    preconditions,
    expectedOutcome,
    additionalInstructions,
  } = data;

  const aiPrompt = `You are an expert QA engineer specializing in pharmaceutical and clinical testing. Generate detailed test steps for the following test scenario:

**Scenario Title:** ${scenarioTitle}
**Description:** ${scenarioDescription || 'No description provided'}
**Preconditions:** ${preconditions || 'None specified'}
**Expected Outcome:** ${expectedOutcome || 'Not specified'}

${additionalInstructions ? `**Additional Instructions:** ${additionalInstructions}` : ''}

Requirements:
- Generate 10-15 detailed, actionable test steps
- Each step should have a clear action and expected result
- Include navigation steps, data entry steps, verification steps, and outcome validation
- Cover the complete workflow from start to finish
- Include both positive path and relevant edge cases

Format the response as JSON (no markdown, no extra text):
{
  "title": "${scenarioTitle}",
  "description": "${scenarioDescription || ''}",
  "preConditions": "${preconditions || ''}",
  "postConditions": "${expectedOutcome || ''}",
  "steps": [
    {
      "stepNumber": 1,
      "description": "Clear, actionable step description",
      "expectedResult": "Specific, verifiable expected outcome"
    }
  ]
}

Respond ONLY with valid JSON, no additional text.`;

  const rawText = await callAI(aiPrompt);

  try {
    return JSON.parse(extractJSON(rawText));
  } catch (parseError) {
    throw new Error(`Failed to parse AI response: ${parseError}`);
  }
}
