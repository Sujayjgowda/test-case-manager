import OpenAI from 'openai';
import { prisma } from '../index.js';
import { NotFoundError } from '../middleware/error-handler.js';

// ─── SambaNova Client ────────────────────────────────────────────────────────

function getSambaNovaClient(): OpenAI {
  const apiKey = process.env.SAMBANOVA_API_KEY;
  if (!apiKey) {
    throw new Error(
      'SAMBANOVA_API_KEY is not configured. Set it in your .env file to enable AI test script generation.'
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.sambanova.ai/v1',
  });
}

// ─── Core AI Call ────────────────────────────────────────────────────────────

const SAMBANOVA_MODELS = [
  'gemma-4-31B-it',
  'MiniMax-M3',
  'Meta-Llama-3.3-70B-Instruct',
  'DeepSeek-V3.1',
];

async function callSambaNova(systemPrompt: string, userPrompt: string): Promise<string> {
  const client = getSambaNovaClient();
  let lastError: unknown = null;

  for (const model of SAMBANOVA_MODELS) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.15,
        max_tokens: 3000,
      });

      const content = completion.choices[0]?.message?.content;
      if (content) return content;
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[SambaNova] Model "${model}" failed: ${errMsg}`);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('All SambaNova AI models failed. Check your API key and network connection.');
}

// ─── JSON Extraction ─────────────────────────────────────────────────────────

function extractJSON(text: string): string {
  // Try fenced code block first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Try to find a JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0].trim();

  return text.trim();
}

function parseAIResponse<T>(raw: string): T {
  const jsonStr = extractJSON(raw);
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error(
      `Failed to parse AI response as JSON. Raw output:\n${raw.substring(0, 500)}`
    );
  }
}

// ─── System Prompts ──────────────────────────────────────────────────────────

// ─── System Prompts ──────────────────────────────────────────────────────────

const PHARMA_SYSTEM_PROMPT = `You are a Principal QA Validation Engineer and Pharmacovigilance Subject Matter Expert with comprehensive mastery of Oracle Argus Safety (Release 8.4) and LSMV (Literature Screening & Medical Valuation).

================================================================================
ORACLE ARGUS SAFETY 8.4 — ARCHITECTURE, LOOK & FEEL, AND WORKFLOW SPECIFICATION:
================================================================================

1. UI LOOK & FEEL, NAVIGATION & SHORTCUTS:
- Supported resolution: Minimum 1280 x 1024, zoom 100%. Pop-up blocker disabled.
- Home Page: Personal Argus Status page (Checkboxes: Cases Assigned, Contact Log Entries, Action Item Entries, Overdue Action Items).
- Quick Launch Toolbar (Top Right Icons):
  * New Case from Image (create case from image)
  * New Case (Initial Case Entry dialog)
  * Open Case (Case Search dialog)
  * Close Case
  * Print Case (Case Form print dialog)
  * Save Case
  * Forward Case / Return Case (Case Routing dialog)
  * Worklist (Worklist - New / Open)
  * Lock Case (Case Lock/Unlock dialog for Local PRPT / globally locked case)
  * Local Lock (toggle icon for Local Lock / Local Unlock for Japan PRPT)
  * Medical Review (Medical Review - Case Form dialog)
  * Coding Review (Coding Review dialog)
  * Draft Report (View Draft pop-up with Report Form, Destination, Product)
  * ICSR Check (prints DTD Length Check Warnings & DTD Validation)
  * Validation Check (executes case validation)
- Field Validation Icons & Overrides:
  * Red flag icon: Mandatory field validation failed — case CANNOT be saved until corrected.
  * Orange flag icon: Optional validation failed — user must click icon, enter justification (or choose standard reason) in Field Justification dialog, turning icon to green.
- Date Formats: DDMMMYYYY (e.g., 10OCT2026), DDMMMYY, DDMMYYYY with '.', '-', or '/' separators. Partial dates supported where permitted.
- Null Flavor (NF) Button: ICH E2B(R3) missing data reasons (MSK, UNK, NA, etc.). NF button background turns blue when active; warns user if existing data is cleared.
- Dynamic Workflow Indicator: Traffic light icon (Green: good standing; Yellow: danger of exceeding; Red: timing exceeded with negative time displayed in red).
- Keyboard Shortcuts:
  * CTRL+SHIFT+#: Jump to tab (1=General, 2=Patient, 3=Products, 4=Events, etc.)
  * ALT+SHIFT+#: Jump to sub-tab/entity (ALT+SHIFT+1 to ALT+SHIFT+0 for entities 1-10)
  * Double-click field label: Field-level context help
  * Tab / Case Save: Triggers autocalculation (e.g., daily dose, duration, latencies)

2. CASE CREATION & BOOK-IN WORKFLOW:
- Navigation: Case Actions > New OR Worklist > Intake.
- Initial Case Entry / Book-In Dialog:
  * Initial Receipt Date: Complete date company became aware (mandatory, no partial dates).
  * Central Receipt Date: Date received by Central Safety.
  * Country of Incidence: Country where event occurred.
  * Report Type: Spontaneous, Sponsored Trial, Literature, Other.
  * Clinical Trial fields: Study ID & Center ID via Clinical Trial Selection dialog (search Project/Study/Center).
  * Initial Justification: Click green dot to select pre-configured standard justification.
  * Product Name: Trade Name Product Lookup dialog (populates Product Name, Generic Name, licenses).
  * Description as Reported: Verbatim event description (icon opens MedDRA hierarchy dialog).
  * Onset Date/Time: Event onset.
  * Duplicate Search / Receipt Range Limits:
    - No date: -90 days to +2 days from System Date
    - Full Onset Date: -10 days to +90 days
    - Full Initial Receipt Date: -60 days to +60 days
  * Reported Causality & Seriousness Criteria checkboxes (Death, Hospitalization, Life Threatening, Disability, Congenital Anomaly, Other).
  * Attachments and References: File attachment up to 4GB, URL reference, Documentum link.
  * BookIn Action: Click BookIn button (generates Case ID). System prompts: "Do you want to enter case data now?" (Yes = opens Case Form, No = saves and closes).

3. CASE FORM TABS & FIELD-LEVEL DATA ENTRY:
- GENERAL TAB:
  * Study Information: Project ID, Study Phase, Blinding Status (Blinded, Not Blinded, Broken by Sponsor/Investigator), Unblinding Date.
  * Reporter Information: Add up to 100 reporters; Primary Reporter displayed in blue tab; "Protect Confidentiality" checkbox masks name/address with "NAME AND ADDRESS WITHHELD" and sets MSK null flavor for eVAERS.
  * Literature Information: Journal and/or Title lookup.
  * Follow-ups/Amendments: Add up to 500 entries; Significant F/U checkbox; Data Clean up version checkbox (for Data Lock Point versioning).
- PATIENT TAB:
  * "Patient Info From Reporter" button copies reporter details if patient is reporter.
  * Patient Demographics: Initials/Name (transferred from book-in), Pat. ID (for trials), DOB, Age, Gender.
  * Current Medical Status: Captures history/conditions (mapped to German BfArM tab).
  * Pregnancy Information: Enabled if Gender=Female and Pregnant=Yes (Gestation period & unit, Number of fetus, Prospective vs Retrospective, Neonate details).
  * Patient Death Details: Autopsy Done? (Yes/No/Unk), Autopsy Results Available?, Cause of Death rows (up to 50 entries).
  * Other Relevant History: Past drugs (WHO Drug encoded), Medical conditions (MedDRA encoded), Start/Stop dates, Ongoing flag.
  * Lab Data: Add Test Name / Lab Test Group (up to 1500 lab records, Norm Low/High, Results/Units, Qualitative Assessment).
  * Parent Information tab for maternal/paternal exposure cases.
- PRODUCTS TAB:
  * Product Lookup: Company Product Browser (Ingredient, Family, Product Name, Trade Name) OR WHO Drug Browser (WHO-DD B or C format, wildcard %, Full Search).
  * Product Type: Suspect, Concomitant, Treatment/Other.
  * Indications: Reported Indication & Coded Indication (MedDRA).
  * Quality Control (QC): QC Safety Date, Cross Reference, CID #, PCID #, Lot Number (auto-creates QC follow-up action item assigned to user).
  * Dosage Regimens: Start/Stop Date/Time, Ongoing checkbox (clears Stop Date & duration), Frequency, Daily Dosage, Regimen Dosage, Duration of Regimen.
  * Product Details: First Dose, Last Dose, Duration of Administration, Action Taken (Dechallenge, Rechallenge with Pos/Neg/UNK and start/stop dates), Gestation Period at Exposure (First Dose - LMP Date).
  * Specialized FDA Categories: Abuse, Counterfeit, Medication error, Misuse, Occupational exposure, Off label use, Overdose, Tampering (Additional Information on Drug G.k.10.r in E2B(R3)).
  * Device Information: Catalog #, Implant/Explant facility, UDI System (GS1, HIBCC, ICCBBA), UDI-DI, UDI-PI, FDA Exemption Number, IMDRF Code, Malfunction Type (21 CFR Part 803), MIR Report Type.
  * Vaccine Information: VAERS Form-1 block, Route of admin, Anatomical location.
- EVENTS TAB:
  * Description as Reported (verbatim) copied to Description to be Coded.
  * MedDRA Coding: Autocoding via Alt+Tab or MedDRA Browser (% wildcard). 5 hierarchy levels: SOC > HLGT > HLT > PT > LLT. Yellow highlight = primary SOC path; Asterisk (*) = non-current term. Standard MedDRA Queries (SMQs).
  * Seriousness Criteria: Death (opens Death Details), Hospitalization (opens Hospitalization Details), Life Threatening, Disability, Congenital Anomaly, Other (mandatory explanatory text).
  * Diagnosis-Event Relationships: Group symptoms under diagnosis using Move Up/Down (CIOMS I formatted).
  * Event Assessment Tab: Product-Event pair matrix. Causality as Reported (Investigator), Causality as Determined (Sponsor/MAH), Listedness against Datasheet (Listed/Unlisted), Recalculate button.
- ANALYSIS TAB:
  * MedWatch 3500A Info: Block B (Adverse Event / Product Problem), Block C (Suspect Meds), Block F (UF/Distributor info, MDR Contact person), Block G (Report sources).
  * BfArM 643 Info & AFSSAPS Info.
  * Case Analysis: Clinical narrative, Show Difference button (strikethrough red text = removed, green highlight = added between locked revisions).
- ACTIVITIES TAB:
  * Case Routing: Route to Next State or Return to previous state with password, routing justification, and comments.
  * Case Locking/Unlocking: Global Lock, Local Lock (Japan PRPT), Unlock with password and reason (Significant F/U vs Non-significant F/U selection). Formally Close Case (final stage before archiving).
  * Contact Log: Generate Custom Letter Templates, track correspondence, action items.
  * Action Items: S/U/R status, Action Item Code, Group/Responsibility, Open Date, Due Date, Completed Date.

4. REGULATORY REPORTING & COMPLIANCE (ICSRs & PERIODIC):
- Expedited Reports:
  * Scheduling: Regulatory Reports > Schedule New Reports (Aware Date, Due Date, Destination, License) OR Auto-Schedule based on reporting rules algorithm.
  * Report Forms: CIOMS I, US FDA MedWatch 3500A, US FDA VAERS, French CERFA, Spanish Spontaneous, ICH E2B(R2), ICH E2B(R3).
  * View Draft: Preview in draft mode (case can be unlocked).
  * Final Report Generation & Approval: Requires case lock; Route report to Approved state.
  * Electronic Transmission: Reports Detail Dialog > Transmit tab (E2B EDI gateway, fax, email).
  * Bulk Operations: Worklist > Bulk Transmit, Bulk Print, Bulk ICSR Transmit.
  * Incoming ICSRs: Reports > ICSR Pending Reports (Duplicate search, Difference Report: addition=grey, deletion=red, modification=yellow; Accept initial E2B as follow-up).
- Periodic Reports:
  * CTPR / DSUR, ICH PSUR / PBRER, US IND Annual, US NDA Periodic.
  * Line Listings, Summary Tabulations, Data Lock Point (DLP) queries (Last Completed Version vs Next Completed Version with Data Cleaning), As of Reporting.

5. ADVANCED CONDITIONS & MULTI-TENANCY:
- Advanced Condition Library: Single filter or Query set using logical operators (AND, OR) and set operators (UNION, INTERSECT, MINUS). Case Series (Hit list): Find Now, Store Case Series, CSV Export, XLS/TXT Import (1000 cases/60 sec).
- Multi-tenancy: Global Portal Homepage (GHP), Enterprise ID, Global Worklists (Individual, Group, All).

================================================================================
CRITICAL RULES FOR TEST SCRIPT GENERATION:
================================================================================
1. ALWAYS respond with valid JSON only — no markdown fences, no explanatory text.
2. In Oracle Argus Safety test scripts, use the exact menu paths, tab names, dialog names, field labels, keyboard shortcuts, validation icons (red/orange/green), and lock states from the specification above.
3. Every test step must include:
   - Precise user action (e.g., "Navigate to Case Actions > New", "Enter '10OCT2026' in Initial Receipt Date", "Press Alt+Tab in Description as Reported to trigger MedDRA auto-coding").
   - Concrete, verifiable expected result (e.g., "System displays Initial Case Entry dialog with mandatory fields flagged with a red icon", "Term codes to PT: Nausea, SOC: Gastrointestinal disorders").
4. Never generate generic or vague steps. Always reference Argus 8.4 UI mechanisms.`;

// ─── In-Memory Job Queue ─────────────────────────────────────────────────────

interface GenerationJob {
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

const generationJobs = new Map<string, GenerationJob>();
let jobCounter = 0;

function createJobId(): string {
  return `job_${Date.now()}_${++jobCounter}`;
}

// ─── Generate Test Cases for a Scenario ──────────────────────────────────────

export async function generateTestCases(
  scenarioId: number,
  prompt?: string,
  options?: Record<string, unknown>
) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    include: {
      module: {
        include: { project: true },
      },
    },
  });

  if (!scenario) throw new NotFoundError('Scenario');

  const jobId = createJobId();

  generationJobs.set(jobId, {
    id: jobId,
    scenarioId,
    status: 'queued',
    prompt,
    options,
    createdAt: new Date(),
  });

  // Fire-and-forget async processing
  processTestCaseGeneration(jobId, scenario, prompt, options).catch((err) => {
    console.error('[AI Service] Generation failed:', err);
    const job = generationJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = err instanceof Error ? err.message : String(err);
      job.completedAt = new Date();
    }
  });

  return {
    jobId,
    status: 'queued',
    estimatedCompletion: '10-30 seconds',
  };
}

async function processTestCaseGeneration(
  jobId: string,
  scenario: any,
  prompt?: string,
  options?: Record<string, unknown>
) {
  const job = generationJobs.get(jobId);
  if (job) job.status = 'processing';

  const { includeNegativeCases, includeEdgeCases, numberOfCases = 5 } = options || {};

  const userPrompt = `Generate ${numberOfCases} comprehensive test cases for the following pharmacovigilance scenario:

PROJECT: ${scenario.module.project.name}
MODULE: ${scenario.module.name}
SCENARIO: ${scenario.title}
DESCRIPTION: ${scenario.description || 'Not provided'}
PRECONDITIONS: ${scenario.preconditions || 'None specified'}
EXPECTED OUTCOME: ${scenario.expectedOutcome || 'Not specified'}

REQUIREMENTS:
- Generate exactly ${numberOfCases} test cases
${includeNegativeCases ? '- Include negative test cases (invalid inputs, error conditions, access violations)' : ''}
${includeEdgeCases ? '- Include edge cases and boundary conditions' : ''}
- Each test case must have 8-15 detailed steps
- Cover the complete workflow: navigation, data entry, validation, and outcome verification
- Include regulatory compliance checkpoints
${prompt ? `\nADDITIONAL INSTRUCTIONS: ${prompt}` : ''}

Respond with this exact JSON structure:
{
  "testCases": [
    {
      "title": "Descriptive test case title",
      "description": "What this test validates",
      "preConditions": "Required preconditions",
      "postConditions": "Expected state after test completion",
      "priority": "high|medium|low",
      "steps": [
        {
          "stepNumber": 1,
          "description": "Precise action to perform",
          "expectedResult": "Specific, verifiable expected outcome"
        }
      ]
    }
  ]
}`;

  const rawResponse = await callSambaNova(PHARMA_SYSTEM_PROMPT, userPrompt);
  const parsed = parseAIResponse<{ testCases: any[] }>(rawResponse);

  if (!parsed.testCases || parsed.testCases.length === 0) {
    throw new Error('AI returned empty test cases array');
  }

  // Persist to database
  const createdTestCases = await Promise.all(
    parsed.testCases.map((tc: any) =>
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

  // Persist steps for each test case
  for (const tc of createdTestCases) {
    const originalTc = parsed.testCases.find((t: any) => t.title === tc.title);
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

  if (job) {
    job.status = 'completed';
    job.testCases = createdTestCases;
    job.completedAt = new Date();
  }
}

// ─── Generate Steps for an Existing Test Case ────────────────────────────────

export async function generateSteps(testCaseId: number, prompt?: string) {
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: { scenario: true },
  });

  if (!testCase) throw new NotFoundError('Test case');

  const userPrompt = `Generate detailed test steps for the following test case:

TEST CASE: ${testCase.title}
DESCRIPTION: ${testCase.description || 'No description'}
SCENARIO: ${testCase.scenario.title}
PRECONDITIONS: ${testCase.preConditions || 'None'}
EXPECTED OUTCOME: ${testCase.postConditions || 'Not specified'}
${prompt ? `\nADDITIONAL INSTRUCTIONS: ${prompt}` : ''}

Generate 10-15 precise, actionable test steps.

Respond with this exact JSON structure:
{
  "steps": [
    {
      "stepNumber": 1,
      "description": "Precise action to perform",
      "expectedResult": "Specific, verifiable expected outcome"
    }
  ]
}`;

  const rawResponse = await callSambaNova(PHARMA_SYSTEM_PROMPT, userPrompt);
  const parsed = parseAIResponse<{ steps: any[] }>(rawResponse);
  return parsed.steps || [];
}

// ─── Improve an Existing Test Case ───────────────────────────────────────────

export async function improveTestCase(testCaseId: number, instructions: string) {
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: {
      steps: { orderBy: { stepNumber: 'asc' } },
      scenario: true,
    },
  });

  if (!testCase) throw new NotFoundError('Test case');

  const currentSteps = testCase.steps
    .map((s) => `Step ${s.stepNumber}: ${s.description} → Expected: ${s.expectedResult}`)
    .join('\n');

  const userPrompt = `Improve the following test case based on these instructions: "${instructions}"

CURRENT TEST CASE:
Title: ${testCase.title}
Description: ${testCase.description || 'N/A'}
Pre-conditions: ${testCase.preConditions || 'N/A'}
Post-conditions: ${testCase.postConditions || 'N/A'}
Scenario: ${testCase.scenario.title}

CURRENT STEPS:
${currentSteps || 'No steps defined yet'}

Provide the improved version. Respond with this exact JSON structure:
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

  const rawResponse = await callSambaNova(PHARMA_SYSTEM_PROMPT, userPrompt);
  return parseAIResponse(rawResponse);
}

// ─── Generate Test Steps from Scenario Input (Standalone) ────────────────────

export async function generateTestStepsFromScenario(data: {
  scenarioTitle: string;
  scenarioDescription?: string;
  preconditions?: string;
  expectedOutcome?: string;
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

  const isLsmv =
    environment === 'lsmv' ||
    scenarioTitle.toLowerCase().includes('lsmv') ||
    (scenarioDescription || '').toLowerCase().includes('lsmv') ||
    scenarioTitle.toLowerCase().includes('literature');

  const appContext = isLsmv
    ? `TARGET APPLICATION: LSMV (Literature Screening & Medical Valuation)
Generate test steps STRICTLY for LSMV workflows:
- PubMed/Embase Feed Ingestion & Citation Import
- 4-Criteria ICSR Triage (Identifiable Reporter, Identifiable Patient, Suspect Product, Adverse Event)
- Duplicate Citation Cross-Check (DOI/Title matching)
- Full-Text PDF Retrieval, Review & Annotation
- Medical Valuation (Special Situations, Off-Label Use, Pregnancy Exposure, Lack of Efficacy)
- QC Audit Sign-Off & Export to Safety Database (Oracle Argus Safety Intake Queue)
DO NOT include Oracle Argus Safety Case Form tabs or workflows.`
    : `TARGET APPLICATION: Oracle Argus Safety (Release 8.4)
Generate test steps STRICTLY according to Oracle Argus Safety 8.4 UI, look & feel, and workflows:
- UI & Look and Feel: 1280x1024 resolution, 100% zoom, Personal Argus Status page (Cases Assigned, Contact Log, Action Items, Overdue Action Items), Quick Launch Toolbar (New Case, Open Case, Save, Forward/Return, Lock Case, Local Lock, Medical Review, Coding Review, Draft Report, ICSR Check, Validation Check).
- Validation Flags & Overrides: Red flag (mandatory check unmet, cannot save), Orange flag (optional check unmet, click to open Field Justification dialog, turns green upon justification).
- Data Formatting: Dates in DDMMMYYYY format (e.g. 10OCT2026), Null Flavor (NF) button (ICH E2B(R3) missing data, turns blue when active). Keyboard shortcuts (CTRL+SHIFT+# for tabs, ALT+SHIFT+# for sub-tabs).
- Case Intake & Book-in: Case Actions > New or Worklist > Intake. Initial Case Entry dialog (Initial Receipt Date, Central Receipt Date, Country of Incidence, Report Type, Study ID/Center ID for trials, Product Name via Trade Name Lookup, Description as Reported verbatim with MedDRA icon, Onset Date/Time).
- Duplicate Detection: Receipt Range Limits (No date: -90/+2 days; Full Onset: -10/+90 days; Full Initial Receipt: -60/+60 days).
- General Tab: Study Info (Blinding Status: Blinded/Not Blinded/Broken by Sponsor or Investigator, Unblinding Date), Reporter Info (up to 100 reporters, Primary Reporter blue tab, Protect Confidentiality masks name/address & sets MSK null flavor for eVAERS), Follow-ups/Amendments (Significant F/U, Data Clean up version for DLP).
- Patient Tab: "Patient Info From Reporter" copy button, Demographics, Current Medical Status (BfArM), Pregnancy Information (Gestation period, Number of fetus, Prospective vs Retrospective, Neonate info), Patient Death Details (Autopsy Done?, Cause of Death up to 50 rows), Other Relevant History (WHO Drug & MedDRA coded), Lab Data (up to 1500 lab tests, Norm Low/High, Assessment).
- Products Tab: Company Product Browser vs WHO Drug Browser (WHO-DD B or C format, wildcard % search), Product Type (Suspect, Concomitant, Treatment/Other), Indications (Reported Indication, Coded Indication via MedDRA), Quality Control (QC Date, CID #, PCID #, Lot Number, auto-creates QC action item), Dosage Regimens (Start/Stop Date, Ongoing checkbox, Duration of Regimen), Product Details (Dechallenge, Rechallenge, Gestation Period at Exposure = First Dose - LMP Date), Specialized FDA categories (Abuse, Misuse, Off-label, Overdose, Counterfeit, Medication error, Tampering), Device details (UDI-DI/PI, IMDRF Code, Malfunction Type, MIR report type), Vaccine details (VAERS Form-1).
- Events Tab: Description as Reported verbatim copied to Description to be Coded, MedDRA Auto-Coding (Alt+Tab) or MedDRA Browser (SOC > HLGT > HLT > PT > LLT; yellow highlight = primary SOC; asterisk = non-current), Seriousness criteria (Death, Hospitalization, Life Threatening, Disability, Congenital Anomaly, Other), Diagnosis-Event Relationships (Move Up/Down), Event Assessment matrix (Product-Event pairs, Causality as Reported/Determined, Listedness vs Datasheet, Recalculate button).
- Analysis Tab: MedWatch 3500A (Blocks B, C, F, G), BfArM 643 Info, AFSSAPS Info, Case Narrative, Show Difference (strikethrough red text = removed, green highlight = added between locked revisions).
- Activities Tab: Case Routing (Route / Return with password, routing justification, comments), Case Lock / Unlock (Global Lock, Local Lock for Japan PRPT, password re-authentication, Significant vs Non-significant F/U selection), Formally Close Case (final stage before archive).
- Regulatory Reports: Schedule New Reports (Aware Date, Due Date, Destination, License) or Auto-Schedule, View Draft report, Route to Approved, Transmit ICSR electronically (E2B(R2)/(R3), MedWatch 3500A, VAERS, CIOMS I, Bulk Transmit, Incoming ICSRs with Duplicate Search & Difference Report: Addition=grey, Deletion=red, Modification=yellow).
- Periodic Reports: CTPR/DSUR, ICH PSUR/PBRER, US IND Annual, US NDA Periodic (Line listings, Summary tabulations, DLP queries, As of Reporting).
- Advanced Conditions & Multi-tenancy: Advanced Condition Library (AND/OR, UNION/INTERSECT/MINUS), Case Series (Hit list: CSV export, XLS/TXT import 1000 cases/60s), Global Portal Homepage (GHP, Enterprise ID / tenant selection).
DO NOT include LSMV Literature Triage workflows.`;

  const userPrompt = `Generate a complete, detailed test script for the following pharmacovigilance scenario:

SCENARIO TITLE: ${scenarioTitle}
DESCRIPTION: ${scenarioDescription || 'Not provided'}
PRECONDITIONS: ${preconditions || 'Standard system preconditions'}
EXPECTED OUTCOME: ${expectedOutcome || 'Successful completion of workflow'}

${appContext}

${additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${additionalInstructions}` : ''}

REQUIREMENTS:
- Generate 10-15 detailed, actionable test steps
- Each step must have a clear action and a specific, verifiable expected result
- Follow the exact application workflow sequence
- Include navigation steps, data entry, validation, and outcome verification
- Include regulatory compliance checkpoints where applicable

Respond with this exact JSON structure:
{
  "title": "${scenarioTitle}",
  "description": "Detailed test script description",
  "preConditions": "Complete list of preconditions",
  "postConditions": "Expected state after successful test completion",
  "environment": "${isLsmv ? 'lsmv' : 'argus'}",
  "steps": [
    {
      "stepNumber": 1,
      "description": "Precise, actionable step description",
      "expectedResult": "Specific, verifiable expected outcome"
    }
  ]
}`;

  const rawResponse = await callSambaNova(PHARMA_SYSTEM_PROMPT, userPrompt);
  return parseAIResponse(rawResponse);
}

// ─── Job Status ──────────────────────────────────────────────────────────────

export async function getGenerationStatus(scenarioId: number) {
  const jobs = Array.from(generationJobs.values())
    .filter((j) => j.scenarioId === scenarioId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (jobs.length === 0) return { status: 'no_jobs' };

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
  if (!job) throw new NotFoundError('Job');

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
