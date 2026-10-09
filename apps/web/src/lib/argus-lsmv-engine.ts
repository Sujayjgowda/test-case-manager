export type TargetEnvironment = 'argus' | 'lsmv';

export interface ScenarioInput {
  scenarioTitle: string;
  scenarioDescription?: string;
  preconditions?: string;
  expectedOutcome?: string;
  additionalInstructions?: string;
  environment?: TargetEnvironment;
}

export interface GeneratedStep {
  stepNumber: number;
  description: string;
  expectedResult: string;
}

export interface GeneratedTestCaseResult {
  title: string;
  description: string;
  preConditions: string;
  postConditions: string;
  environment: TargetEnvironment;
  steps: GeneratedStep[];
}

/**
 * Main Entry Point: Dispatches to either Oracle Argus Safety or LSMV based on selected environment.
 * The steps for each application are strictly separated and NEVER clubbed together.
 */
export function generateTestSteps(input: ScenarioInput): GeneratedTestCaseResult {
  const env: TargetEnvironment = input.environment || (
    input.scenarioTitle.toLowerCase().includes('lsmv') ||
    (input.scenarioDescription || '').toLowerCase().includes('lsmv') ||
    (input.scenarioTitle || '').toLowerCase().includes('literature triage')
      ? 'lsmv'
      : 'argus'
  );

  if (env === 'lsmv') {
    return generateLsmvTestSteps(input);
  }
  return generateArgusSafetyTestSteps(input);
}

// Backward compatibility alias
export const generateArgusLsmvTestSteps = generateTestSteps;

/**
 * ORACLE ARGUS SAFETY GENERATOR
 * Strictly focused on Oracle Argus Safety Core application functionality:
 * Case Intake, Initial Book-in, Duplicate Search, General/Patient/Products/Events/Analysis tabs,
 * MedDRA Auto-Coding, Listedness, Causality, Case Lock (21 CFR Part 11), E2B(R3) Regulatory Reporting, Audit Trail.
 */
export function generateArgusSafetyTestSteps(input: ScenarioInput): GeneratedTestCaseResult {
  const title = input.scenarioTitle.trim();
  const desc = (input.scenarioDescription || '').trim();
  const pre = (input.preconditions || '').trim();
  const post = (input.expectedOutcome || '').trim();
  const instructions = (input.additionalInstructions || '').trim();

  const combined = `${title} ${desc} ${pre} ${post} ${instructions}`.toLowerCase();

  const isBlinded = combined.includes('blind') || combined.includes('unblind') || combined.includes('clinical trial') || combined.includes('study case');
  const isRegulatory = combined.includes('regulatory') || combined.includes('e2b') || combined.includes('fda') || combined.includes('faers') || combined.includes('eudravigilance') || combined.includes('pmda') || combined.includes('submission') || combined.includes('expedited');
  const isMedicalReview = combined.includes('medical review') || combined.includes('causality') || combined.includes('seriousness') || combined.includes('listedness') || combined.includes('susar');

  const suspectDrug = extractDrugName(combined) || 'Suspect Medicinal Product';
  const adverseEvent = extractEventName(combined) || 'Adverse Event Reaction Term';

  const role = isMedicalReview
    ? 'Argus Safety Physician / Medical Reviewer'
    : isRegulatory
    ? 'Argus Regulatory Submissions Specialist'
    : 'Argus Safety Case Processor';

  const steps: GeneratedStep[] = [];

  // Step 1: Login to Oracle Argus Safety
  steps.push({
    stepNumber: 1,
    description: `Log into the Oracle Argus Safety Web Application with valid "${role}" credentials and verify enterprise user profile and assigned permissions.`,
    expectedResult: `User is authenticated via Enterprise SSO; Oracle Argus Safety Main Navigation Menu, Worklist, and active enterprise database instance load successfully.`,
  });

  // Step 2: Preconditions
  steps.push({
    stepNumber: 2,
    description: `Verify Argus Safety environment prerequisites: "${pre || 'Argus Safety active database, active MedDRA & WHO Drug dictionaries, and enterprise workflow rules verified'}".`,
    expectedResult: `Prerequisite configurations in Argus Console (System Configuration, Reporting Destinations, User Group permissions) are verified.`,
  });

  // Step 3: Book-in & Source Selection
  if (isBlinded) {
    steps.push({
      stepNumber: 3,
      description: `In Oracle Argus Safety, navigate to "Case Actions" > "New Case" (Initial Book-in). Select Case Type "Clinical Trial / Study Case", select Protocol Number, and choose Study Site.`,
      expectedResult: `Argus auto-populates clinical study protocol attributes; treatment blinding flags are enforced according to study configuration.`,
    });
    steps.push({
      stepNumber: 4,
      description: `Execute Argus Pre-Book-in Duplicate Search matching on Study Patient ID, Protocol Site, Patient Initials, and Country.`,
      expectedResult: `Argus Duplicate Detection dialog returns 0 matching candidates; user proceeds with "Book-in" confirmation.`,
    });
    steps.push({
      stepNumber: 5,
      description: `Under Products Tab, verify that treatment assignment is displayed as a masked blinded entry (e.g. "Investigational Product vs Matching Placebo").`,
      expectedResult: `Study blind is preserved; treatment arm remains masked for blinded users with unblinded access restricted to authorized unblinded roles.`,
    });
  } else {
    steps.push({
      stepNumber: 3,
      description: `In Oracle Argus Safety, navigate to "Case Actions" > "New Case" (Initial Book-in). Enter Initial Receipt Date, Safety Receipt Date, Country of Incidence, and Report Source (e.g. Spontaneous / MedWatch 3500A / Health Authority).`,
      expectedResult: `Argus Initial Book-in window validates mandatory fields; unique temporary Case ID is staged; "Duplicate Search" button becomes active.`,
    });
    steps.push({
      stepNumber: 4,
      description: `Click "Duplicate Search" in Argus Safety. Execute search matching on Patient Initials, Soundex, Date of Birth/Age, Gender, Reporter Country, and Suspect Drug "${suspectDrug}".`,
      expectedResult: `Argus Duplicate Search grid renders match score candidates; user confirms no prior case exists and clicks "Create Case".`,
    });
  }

  // Step: General Tab
  steps.push({
    stepNumber: steps.length + 1,
    description: `In Argus Case Form, open "General Tab" > "Reporter Information". Enter Primary Reporter details (Title, Name, Health Care Professional qualification, Institution, Country, and Regulatory Confidentiality flag).`,
    expectedResult: `Reporter information is saved; Primary Reporter checkbox is checked; HCP status reflects accurately on regulatory reports.`,
  });

  // Step: Patient Tab
  steps.push({
    stepNumber: steps.length + 1,
    description: `Navigate to "Patient Tab". Enter Patient Demographics (Initials, Date of Birth / Age Group, Gender, Weight) and add relevant Medical History and Concurrent Conditions.`,
    expectedResult: `Patient details are committed; age group calculates automatically; medical history entries link to MedDRA terminology.`,
  });

  // Step: Products Tab
  steps.push({
    stepNumber: steps.length + 1,
    description: `Navigate to "Products Tab". Click "Add Product", search Company Product Dictionary / WHO-DD for "${suspectDrug}", select Formulation, enter Daily Dose, Route of Administration, Therapy Start/Stop dates, and Lot/Batch Number.`,
    expectedResult: `Product is added with Product Type "Suspect"; dosage regimen is saved; Active Substance and Marketing Authorization data map into the case.`,
  });

  // Step: Events Tab & MedDRA Coding
  steps.push({
    stepNumber: steps.length + 1,
    description: `Navigate to "Events Tab". Enter reported verbatim reaction term "${adverseEvent}". Click "Auto-Encode" or open the integrated MedDRA Browser.`,
    expectedResult: `MedDRA hierarchy auto-codes the verbatim term to valid Lowest Level Term (LLT), Preferred Term (PT), High Level Term (HLT), and System Organ Class (SOC).`,
  });

  // Step: Seriousness & Listedness
  steps.push({
    stepNumber: steps.length + 1,
    description: `Under Events Tab, evaluate Seriousness Criteria (Death, Life-Threatening, Hospitalization / Prolongation, Disability, Congenital Anomaly, Other Medically Important Condition). Check Labeledness/Listedness against Company Core Data Sheet (CCDS) / SmPC.`,
    expectedResult: `Case seriousness calculates automatically; Event Listedness displays "Unlisted" or "Listed" with active datasheet version indicated.`,
  });

  // Step: Analysis & Causality Tab
  steps.push({
    stepNumber: steps.length + 1,
    description: `Navigate to "Analysis Tab" > "Causality". Record Reporter Causality and enter Company Causality (e.g., Reasonable Possibility / Related). Compose Physician Clinical Summary Narrative.`,
    expectedResult: `Causality matrix updates; clinical summary narrative is committed with dechallenge and rechallenge details.`,
  });

  // Step: Regulatory Reporting & E2B(R3)
  steps.push({
    stepNumber: steps.length + 1,
    description: `Navigate to "Regulatory Reporting Tab". Click "Auto-Schedule" to run the Argus Reporting Rules Engine (evaluating country, seriousness, listedness, license authorizations).`,
    expectedResult: `Expedited regulatory reports (e.g. FDA 15-Day Alert, EMA E2B(R3), PMDA) are auto-scheduled with statutory countdown submission dates.`,
  });

  steps.push({
    stepNumber: steps.length + 1,
    description: `Select scheduled E2B(R3) report, click "Draft View" > "ICSR Validation Check" in Argus Safety.`,
    expectedResult: `Argus ICSR Validator executes ICH E2B(R3) schema and business validation rules; validation confirmation dialog reports 0 errors.`,
  });

  // Step: Case Lock & Electronic Signature
  steps.push({
    stepNumber: steps.length + 1,
    description: `Execute Argus Case Lock: Select "Case Actions" > "Case Lock". Complete pre-lock verification checklist. Enter 21 CFR Part 11 Electronic Signature credentials (Username, Password, Meaning of Signature: "Case Lock / Approval").`,
    expectedResult: `Case status transitions to "Locked"; all case fields lock to read-only; electronic signature audit entry is stamped with UTC timestamp.`,
  });

  // Step: Outcome & Audit Trail
  steps.push({
    stepNumber: steps.length + 1,
    description: `Confirm primary business outcome: "${post || 'Case is successfully booked in, data-entered, evaluated, and locked in Oracle Argus Safety'}".`,
    expectedResult: `Case status in Argus Worklist confirms completed state; regulatory report moves to transmission queue.`,
  });

  steps.push({
    stepNumber: steps.length + 1,
    description: `Navigate to "Utilities" > "Case Audit Trail". Filter by Case Number and review field-level audit log.`,
    expectedResult: `Argus Audit Trail displays complete immutable audit history (Field Name, Old Value, New Value, User ID, Date/Time Stamp UTC) without gaps.`,
  });

  return {
    title,
    description: desc || `Oracle Argus Safety Core Pharmacovigilance Test Script: ${title}`,
    preConditions: pre || `Oracle Argus Safety active; User assigned "${role}" role; MedDRA & Product dictionaries configured.`,
    postConditions: post || `Case processed, verified against E2B(R3) validation rules, locked with 21 CFR Part 11 electronic signature, and logged in Argus Audit Trail.`,
    environment: 'argus',
    steps,
  };
}

/**
 * LSMV (LITERATURE SCREENING & MEDICAL VALUATION) GENERATOR
 * Strictly focused on LSMV application functionality:
 * Literature Search Feeds Ingestion, Triage Queue, Bibliographic Citation Metadata,
 * Integrated PDF Viewer, 4 Minimum ICSR Criteria Evaluation Checklist,
 * Duplicate Citation Screening, Special Situations Tagging, Medical Valuation,
 * Quality Check (QC) Review, Disposition / ICSR Hand-off to Safety Database, LSMV Audit Log.
 */
export function generateLsmvTestSteps(input: ScenarioInput): GeneratedTestCaseResult {
  const title = input.scenarioTitle.trim();
  const desc = (input.scenarioDescription || '').trim();
  const pre = (input.preconditions || '').trim();
  const post = (input.expectedOutcome || '').trim();
  const instructions = (input.additionalInstructions || '').trim();

  const combined = `${title} ${desc} ${pre} ${post} ${instructions}`.toLowerCase();

  const suspectDrug = extractDrugName(combined) || 'Target Product / Medicinal Substance';
  const adverseEvent = extractEventName(combined) || 'Adverse Drug Reaction / Safety Finding';

  const steps: GeneratedStep[] = [];

  // Step 1: Login to LSMV Portal
  steps.push({
    stepNumber: 1,
    description: `Log into the LSMV (Literature Screening & Medical Valuation) Web Application with valid "LSMV Literature Screener / Medical Evaluator" credentials.`,
    expectedResult: `User is authenticated; LSMV Home Dashboard opens displaying active Screening Batches, Literature Ingestion Feeds, and Triage Inbox queues.`,
  });

  // Step 2: Preconditions
  steps.push({
    stepNumber: 2,
    description: `Verify LSMV environment prerequisites: "${pre || 'LSMV literature database connected; PubMed / Embase search strategies active; User assigned Screener and QC Reviewer roles'}".`,
    expectedResult: `LSMV system verifies literature source connectors (PubMed, Embase, local medical journals) and active weekly search query alerts.`,
  });

  // Step 3: Search Strategy & Ingestion Feed Verification
  steps.push({
    stepNumber: 3,
    description: `In LSMV, navigate to "Literature Intake" > "Search Strategies & Batches". Select the active literature batch for "${suspectDrug}".`,
    expectedResult: `LSMV displays ingested bibliographic records with Batch ID, Ingestion Date, Source Database (e.g. PubMed / MEDLINE, Embase), and total article count.`,
  });

  // Step 4: Open Triage Queue
  steps.push({
    stepNumber: 4,
    description: `Navigate to LSMV "Triage Queue / Screening Inbox". Locate the article matching: "${title}". Filter by Product "${suspectDrug}" and status "Pending Primary Screening".`,
    expectedResult: `Article record renders with Article Title, Journal Name, ISSN, Volume/Issue, Authors, Publication Year, and PubMed ID / DOI.`,
  });

  // Step 5: Review Workspace & Integrated PDF Viewer
  steps.push({
    stepNumber: 5,
    description: `Click on the article in LSMV to launch the "Article Review Workspace". Verify that the publication Abstract and integrated full-text PDF viewer load side-by-side.`,
    expectedResult: `LSMV Article Review Workspace displays full bibliographic metadata in left panel and rendered full-text publication PDF in right viewer panel with annotation tools active.`,
  });

  // Step 6: 4 Minimum ICSR Criteria Evaluation Checklist
  steps.push({
    stepNumber: 6,
    description: `In LSMV "ICSR Eligibility Checklist", evaluate the 4 Minimum ICSR Criteria:
a) Identifiable Reporter (Author name, correspondence address, hospital/institution, country)
b) Identifiable Patient (Age, gender, patient initials, patient count, case history)
c) Suspect Medicinal Product ("${suspectDrug}")
d) Adverse Drug Reaction / Event ("${adverseEvent}")`,
    expectedResult: `All 4 checklist checkboxes indicate confirmed status based on clinical information documented in the article text.`,
  });

  // Step 7: Duplicate Citation Screening in LSMV
  steps.push({
    stepNumber: 7,
    description: `Click "Duplicate Screening" within LSMV. System checks historical literature screening repository using Article Title, Author Names, Journal Reference, and DOI.`,
    expectedResult: `LSMV Duplicate Check confirms whether this publication was previously triaged or published in multiple journals; returns "No Duplicate Found" or flags related parent publication.`,
  });

  // Step 8: Literature Categorization & Special Situations
  steps.push({
    stepNumber: 8,
    description: `Under LSMV "Categorization & Disposition", select Primary Triage Classification: "Individual Case Safety Report (ICSR)". Tag applicable Special Situation categories (e.g. Off-label use, Overdose, Drug interaction, Pregnancy exposure, Lack of efficacy).`,
    expectedResult: `Triage classification is set to "Potential ICSR"; Special Situation flags are recorded; ICSR conversion workflow is triggered.`,
  });

  // Step 9: LSMV Medical Valuation & Seriousness Tagging
  steps.push({
    stepNumber: 9,
    description: `Navigate to LSMV "Medical Valuation" section. Assign preliminary Seriousness Assessment (Serious vs Non-Serious) based on reported clinical outcome, and select primary MedDRA System Organ Class (SOC) / Reaction term.`,
    expectedResult: `LSMV Medical Valuation form stores preliminary causality impression, seriousness rationale, and evaluator clinical comments.`,
  });

  // Step 10: Quality Check (QC) Review in LSMV
  steps.push({
    stepNumber: 10,
    description: `In LSMV, submit primary screening decision to "Quality Check (QC) Queue". Log in as "LSMV QC Reviewer", open the article from QC Inbox, and review the screener's 4-criteria checklist and valuation notes.`,
    expectedResult: `QC Reviewer verifies screening accuracy, confirms ICSR eligibility, and clicks "Approve Primary Triage Decision" with mandatory QC comments.`,
  });

  // Step 11: Disposition & Export Transmission to Safety Database
  steps.push({
    stepNumber: 11,
    description: `Execute LSMV Final Disposition: Select "Export to Safety Database". Confirm export package contains Bibliographic Citation Metadata, Abstract, Screener Triage Sheet, and Full-Text PDF attachment.`,
    expectedResult: `LSMV packages the literature case payload and transmits it to the Safety Database intake queue; confirmation receipt token and Export Batch ID are logged.`,
  });

  // Step 12: Outcome & LSMV Audit Log Verification
  steps.push({
    stepNumber: 12,
    description: `Confirm primary business outcome: "${post || 'Article successfully screened, validated for 4 ICSR criteria, QC-approved, and exported in LSMV application'}".`,
    expectedResult: `Article status in LSMV changes to "Completed - Exported to Safety DB"; record transitions to read-only archive status.`,
  });

  steps.push({
    stepNumber: 13,
    description: `Access LSMV "Audit Trail & Activity Log". Review the article history log for complete screening timeline.`,
    expectedResult: `LSMV Audit Log displays immutable record capturing Screener User ID, Ingestion Timestamp, 4-Criteria Checklist timestamps, QC Approval, and Export Transmission details.`,
  });

  return {
    title,
    description: desc || `LSMV (Literature Screening & Medical Valuation) Test Script: ${title}`,
    preConditions: pre || `LSMV Literature Screening Application online; Literature search feeds connected; User assigned Screener and QC roles.`,
    postConditions: post || `Article triaged for 4 ICSR criteria, duplicate-screened, QC-approved, and exported to Safety DB with complete LSMV audit log.`,
    environment: 'lsmv',
    steps,
  };
}

function extractDrugName(text: string): string | null {
  const matches = text.match(/(?:drug|product|medication|compound|treatment|agent)\s*[:=-]?\s*([a-zA-Z0-9_-]+)/i);
  if (matches && matches[1]) return matches[1];

  const common = ['pembrolizumab', 'atorvastatin', 'metformin', 'aspirin', 'adalimumab', 'rituximab', 'remdesivir', 'vaccine'];
  for (const drug of common) {
    if (text.includes(drug)) return drug.charAt(0).toUpperCase() + drug.slice(1);
  }
  return null;
}

function extractEventName(text: string): string | null {
  const matches = text.match(/(?:event|reaction|adverse event|ae|symptom|toxicity)\s*[:=-]?\s*([a-zA-Z0-9_\s-]+?)(?:\s+(?:with|in|for|after|due|from|,|\.|$))/i);
  if (matches && matches[1] && matches[1].length < 35) return matches[1].trim();

  const common = ['myocardial infarction', 'anaphylaxis', 'hepatotoxicity', 'rash', 'stevens-johnson syndrome', 'seizure', 'acute kidney injury', 'headache'];
  for (const ev of common) {
    if (text.includes(ev)) return ev.charAt(0).toUpperCase() + ev.slice(1);
  }
  return null;
}
