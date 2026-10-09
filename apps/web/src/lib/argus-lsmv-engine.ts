export interface ScenarioInput {
  scenarioTitle: string;
  scenarioDescription?: string;
  preconditions?: string;
  expectedOutcome?: string;
  additionalInstructions?: string;
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
  steps: GeneratedStep[];
}

export function generateArgusLsmvTestSteps(input: ScenarioInput): GeneratedTestCaseResult {
  const title = input.scenarioTitle.trim();
  const desc = (input.scenarioDescription || '').trim();
  const pre = (input.preconditions || '').trim();
  const post = (input.expectedOutcome || '').trim();
  const instructions = (input.additionalInstructions || '').trim();

  const combined = `${title} ${desc} ${pre} ${post} ${instructions}`.toLowerCase();

  // Detect domain themes
  const isLsmv = combined.includes('lsmv') || combined.includes('literature') || combined.includes('journal') || combined.includes('triage') || combined.includes('pubmed') || combined.includes('article');
  const isBlinded = combined.includes('blind') || combined.includes('unblind') || combined.includes('clinical trial') || combined.includes('placebo') || combined.includes('investigational');
  const isRegulatory = combined.includes('regulatory') || combined.includes('e2b') || combined.includes('fda') || combined.includes('faers') || combined.includes('eudravigilance') || combined.includes('pmda') || combined.includes('cioms') || combined.includes('medwatch') || combined.includes('submission') || combined.includes('expedited');
  const isMedicalReview = combined.includes('medical review') || combined.includes('causality') || combined.includes('seriousness') || combined.includes('listedness') || combined.includes('labeling') || combined.includes('physician') || combined.includes('susar');
  const isSignal = combined.includes('signal') || combined.includes('aggregate') || combined.includes('psur') || combined.includes('pbrer') || combined.includes('dsur') || combined.includes('trend');
  const isLocking = combined.includes('lock') || combined.includes('audit') || combined.includes('21 cfr') || combined.includes('electronic signature') || combined.includes('workflow');

  // Extract or synthesize key PV entities from user input
  const suspectDrug = extractDrugName(combined) || 'Suspect Product (Investigational/Marketed Drug)';
  const adverseEvent = extractEventName(combined) || 'Adverse Event (AE) Reaction Term';
  const role = isLsmv ? 'LSMV Literature Screener' : isMedicalReview ? 'Safety Medical Reviewer (Physician)' : isRegulatory ? 'Regulatory Submissions Specialist' : 'Argus Case Processor / Data Entry Specialist';

  const steps: GeneratedStep[] = [];

  // Step 1: System Access & Role Verification
  steps.push({
    stepNumber: 1,
    description: `Log into Oracle Argus Safety / LSMV enterprise portal with valid "${role}" credentials and select the active Safety Database enterprise environment.`,
    expectedResult: `User is authenticated via SSO/LDAP; Argus Safety Home Dashboard loads with active worklist queues, role-appropriate permissions, and site context.`,
  });

  // Step 2: Preconditions verification
  steps.push({
    stepNumber: 2,
    description: `Verify that system preconditions are met: "${pre || 'Source safety data, user permissions, and master dictionaries (MedDRA & WHO-DD) are active'}".`,
    expectedResult: `Database dictionaries (MedDRA current version, Company Product Dictionary, WHO-DD) and enterprise workflow configurations are verified.`,
  });

  // Step 3 & 4: Intake / Book-in / LSMV Triage
  if (isLsmv) {
    steps.push({
      stepNumber: 3,
      description: `Navigate to Argus LSMV module > "Literature Intake & Triage Queue". Locate source article matching: "${title}".`,
      expectedResult: `LSMV Literature Intake queue renders bibliographic record including Article Title, Journal, Volume/Issue, Authors, and Digital Object Identifier (DOI/PubMed ID).`,
    });
    steps.push({
      stepNumber: 4,
      description: `Perform primary LSMV literature screening: Review publication abstract and attached full-text PDF for the four valid ICSR criteria (Identifiable Reporter, Identifiable Patient, Suspect Product "${suspectDrug}", Adverse Event "${adverseEvent}").`,
      expectedResult: `All four minimum criteria for an Individual Case Safety Report (ICSR) are confirmed; user categorizes the publication as "Potential ICSR".`,
    });
    steps.push({
      stepNumber: 5,
      description: `Execute LSMV Duplicate Search against historical literature citations and Argus safety database using Author Name, Journal Reference, Country, and Suspect Drug.`,
      expectedResult: `Duplicate search grid returns no matching confirmed records (or flags existing parent case for follow-up evaluation).`,
    });
    steps.push({
      stepNumber: 6,
      description: `Promote literature citation in LSMV from Triage Queue to "Argus Case Creation". Select source type "Literature" and assign Initial Receipt Date.`,
      expectedResult: `LSMV auto-creates a draft Argus Safety Case with literature citation pre-populated; unique Argus Case Number is generated and assigned.`,
    });
  } else if (isBlinded) {
    steps.push({
      stepNumber: 3,
      description: `Navigate to Argus Safety > "Case Actions" > "New Case" (Book-in). Select Case Type "Clinical Trial / Study Case" and choose Protocol Number and Study Center.`,
      expectedResult: `Study metadata populates automatically; blinded status flags are activated according to protocol configuration.`,
    });
    steps.push({
      stepNumber: 4,
      description: `Execute pre-book-in Duplicate Search using Study Patient ID, Protocol Site, Patient Initials, and Adverse Event term.`,
      expectedResult: `Duplicate detection confirms no duplicate case exists in the clinical trial database; user proceeds with "Book-in".`,
    });
    steps.push({
      stepNumber: 5,
      description: `In Product tab, verify treatment arm is maintained in Blinded state (e.g., "Active Investigational Product vs Matching Placebo" masked code).`,
      expectedResult: `Study blind is preserved; product name displays blinded label; unblinded treatment information remains restricted to authorized unblinded roles.`,
    });
    steps.push({
      stepNumber: 6,
      description: `If scenario involves emergency/safety unblinding, access "Blinded & Unblinded Processing" workflow, enter Medical Monitor unblinding justification, and confirm unblind token.`,
      expectedResult: `Audit log captures unblind request with timestamp and justification; treatment assignment is unmasked strictly for the authorized reviewer.`,
    });
  } else {
    steps.push({
      stepNumber: 3,
      description: `Navigate to Argus Safety > "Case Actions" > "New Case" (Initial Book-in screen). Enter Initial Receipt Date, Safety Receipt Date, Country of Incidence, and Report Source.`,
      expectedResult: `Initial Case Book-in screen validates mandatory header fields and activates the "Duplicate Search" button.`,
    });
    steps.push({
      stepNumber: 4,
      description: `Execute Argus Duplicate Search matching on Patient Demographics (Initials, Age/DOB, Gender), Reporter Name, and Suspect Product "${suspectDrug}".`,
      expectedResult: `Argus Duplicate Search dialog displays matching candidates score; user verifies no identical duplicate exists and confirms "Create Initial Case".`,
    });
  }

  // Step: General & Reporter Tab Data Entry
  steps.push({
    stepNumber: steps.length + 1,
    description: `Open "General Tab" > "Reporter Information" in Argus Case Form. Input Primary Reporter details (Title, First/Last Name, Qualification e.g. Physician/HCP/Consumer, Health Authority / Institution name, Contact Country, and Regulatory Confidentiality flag).`,
    expectedResult: `Reporter details are validated; HCP qualification checkbox updates; Primary Reporter icon is designated next to the entry.`,
  });

  // Step: Patient Demographics & Medical History
  steps.push({
    stepNumber: steps.length + 1,
    description: `Navigate to "Patient Tab". Enter Patient Initials/Identifier, Gender, Date of Birth (or Age/Age Group), relevant Medical History entries, and baseline Concurrent Conditions.`,
    expectedResult: `Patient data is committed; age group calculates automatically from DOB; medical history conditions link properly to MedDRA hierarchy.`,
  });

  // Step: Product & Dosage Tab
  steps.push({
    stepNumber: steps.length + 1,
    description: `Navigate to "Products Tab". Add suspect medicinal product: Search and select "${suspectDrug}" from Company Product Dictionary / WHO-DD. Specify Daily Dose, Route of Administration, Therapy Start Date, Lot/Batch Number, and Indication.`,
    expectedResult: `Product record is attached with role "Suspect"; dosage regimen is stored; Formulation, Active Ingredient, and Marketing Authorization details map automatically.`,
  });

  // Step: Adverse Event & MedDRA Auto-Coding
  steps.push({
    stepNumber: steps.length + 1,
    description: `Navigate to "Events Tab". Enter reported verbatim reaction term: "${adverseEvent}". Invoke MedDRA Auto-Encoder or manual MedDRA Browser.`,
    expectedResult: `System codes verbatim term to valid MedDRA Lowest Level Term (LLT), Preferred Term (PT), High Level Term (HLT), and System Organ Class (SOC).`,
  });

  // Step: Seriousness & Listedness Evaluation
  steps.push({
    stepNumber: steps.length + 1,
    description: `Under "Events Tab" Seriousness Criteria, evaluate and check applicable seriousness flags (Death, Life-Threatening, Hospitalization / Prolongation, Disability/Incapacity, Congenital Anomaly, Other Medically Important Condition). Check Labeledness against CCDS / SmPC / Investigator Brochure.`,
    expectedResult: `Case seriousness calculates automatically (Serious vs Non-Serious); Listedness status displays "Unlisted" or "Listed" with active datasheet version displayed.`,
  });

  // Step: Medical Review & Causality Assessment
  if (isMedicalReview || isRegulatory || true) {
    steps.push({
      stepNumber: steps.length + 1,
      description: `Navigate to "Analysis Tab" > "Causality". Record Reporter Causality assessment and input Company/Sponsor Causality (e.g., Reasonable Possibility / Related vs Not Related). Draft Case Summary Clinical Narrative.`,
      expectedResult: `Causality matrix updates; clinical narrative stores detailed event timeline, dechallenge/rechallenge analysis, and medical reviewer conclusion.`,
    });
  }

  // Step: Regulatory Reporting & E2B(R3)
  if (isRegulatory || true) {
    steps.push({
      stepNumber: steps.length + 1,
      description: `Navigate to "Regulatory Reporting Tab". Click "Auto-Schedule Reports" to trigger Argus Reporting Rules Engine based on country, seriousness, listedness, and license authorizations (e.g., FDA 15-Day Alert, EMA E2B(R3) Expedited, PMDA, CIOMS I).`,
      expectedResult: `Reporting engine auto-schedules regulatory reports with statutory submission due dates (e.g. Day 7 or Day 15 countdown clock).`,
    });
    steps.push({
      stepNumber: steps.length + 1,
      description: `Select the scheduled E2B(R3) ICSR report and click "Draft View" > "ICSR Validation Check".`,
      expectedResult: `Argus ICSR Validator executes ICH E2B(R3) schema and regional business rule checks; system reports zero mandatory element errors.`,
    });
  }

  // Step: Workflow Routing & Case Lock
  steps.push({
    stepNumber: steps.length + 1,
    description: `Execute Argus Case Lock workflow: Select "Case Actions" > "Case Lock". Review pre-lock checklist. Enter 21 CFR Part 11 Electronic Signature credentials (Username, Password, Meaning of Signature: "Case Lock / Regulatory Approval").`,
    expectedResult: `Case lock is validated; case state transitions to "Locked"; data fields transition to read-only; electronic signature log records signatory, date/time (UTC), and justification.`,
  });

  // Step: Post-Condition & Outcome Validation
  steps.push({
    stepNumber: steps.length + 1,
    description: `Confirm primary business outcome: "${post || 'Case is successfully processed and approved in Oracle Argus Safety / LSMV with all mandatory pharmacovigilance criteria validated'}".`,
    expectedResult: `Final case status reflects completed workflow state; regulatory submission tracking confirms report generation/dispatch.`,
  });

  // Step: Audit Trail & Compliance Verification
  steps.push({
    stepNumber: steps.length + 1,
    description: `Access Argus Utilities > "Case Audit Trail". Filter by current Case ID and verify that all operations (Book-in, Data Entry, MedDRA coding, Causality, Case Lock) are logged.`,
    expectedResult: `Audit log displays complete immutable chronology showing Field Name, Old Value, New Value, User ID, Client IP, and Timestamp without gaps.`,
  });

  return {
    title,
    description: desc || `Oracle Argus Safety & LSMV Pharmacovigilance Test Script: ${title}`,
    preConditions: pre || `Oracle Argus Safety & LSMV active; User assigned "${role}" role; MedDRA & WHO Drug dictionaries configured.`,
    postConditions: post || `Case processed, validated against E2B(R3) rules, locked with 21 CFR Part 11 electronic signature, and logged in audit trail.`,
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
