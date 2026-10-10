'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Zap,
  CheckSquare,
  Loader2,
  Copy,
  Download,
  ChevronRight,
  Plus,
  AlertCircle,
  Check,
  Bot,
  FileText,
  Shield,
  BookOpen,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeneratedStep {
  stepNumber: number;
  description: string;
  expectedResult: string;
}

interface GeneratedTestScript {
  title: string;
  description: string;
  preConditions: string;
  postConditions: string;
  environment?: 'argus' | 'lsmv';
  steps: GeneratedStep[];
}

// ─── Template Data ───────────────────────────────────────────────────────────

const ARGUS_TEMPLATES = [
  {
    title: 'Spontaneous AE Book-in',
    description:
      'MedWatch 3500A report intake, duplicate search, General/Patient/Products/Events tabs, MedDRA auto-coding',
    scenarioTitle: 'Argus Safety Spontaneous Adverse Event Intake via MedWatch 3500A',
    scenarioDescription:
      'Capture spontaneous HCP report of severe adverse reaction, perform duplicate search, enter patient and suspect drug details, and auto-encode MedDRA.',
    preconditions:
      '1. Argus Safety database accessible\n2. User has Case Processor privileges\n3. MedDRA v27.0 dictionary active',
    expectedOutcome:
      'New Argus case successfully booked in with zero duplicate flags and correct MedDRA LLT/PT mapping.',
    instructions:
      'Include 12-15 detailed steps covering initial book-in, duplicate detection, reporter tab, patient demographics, product details, MedDRA encoding, and case save.',
  },
  {
    title: 'Blinded Clinical Trial Case',
    description:
      'Clinical trial AE intake with protocol configuration and masked investigational medicinal product',
    scenarioTitle: 'Create Blinded Case for Clinical Trial AE',
    scenarioDescription:
      'Verify that a user with Blinded Case Processor role can create a case where treatment information is masked.',
    preconditions:
      '1. User logged in with Blinded Case Processor role\n2. Clinical Study protocol configured for double-blind\n3. Patient enrolled and eligible',
    expectedOutcome:
      'Case saved in Argus Safety with blinded status; Study Drug field displays masked value; unblinded access restricted.',
    instructions:
      'Include 10-12 steps covering study selection, patient ID entry, blind maintenance verification, and audit log.',
  },
  {
    title: 'MedDRA Auto-Coding & Hierarchy',
    description:
      'Verbatim symptom entry, MedDRA browser search, primary SOC selection, LLT/PT hierarchy mapping',
    scenarioTitle: 'Argus MedDRA Auto-Coding and Hierarchy Selection',
    scenarioDescription:
      'Validate auto-encoding of verbatim adverse event term into MedDRA LLT, PT, and verification of primary SOC assignment.',
    preconditions:
      '1. Case form open on Events tab\n2. Active MedDRA version loaded\n3. Verbatim adverse event entered',
    expectedOutcome:
      'MedDRA coding engine resolves exact LLT match, displays full hierarchy path, and saves primary SOC correctly.',
    instructions:
      'Include 10 steps covering verbatim entry, auto-code trigger, MedDRA browser lookup, hierarchy confirmation, and audit save.',
  },
  {
    title: 'Medical Review & Causality',
    description:
      'Listedness comparison against CCDS, WHO-UMC causality score, Medical Reviewer sign-off',
    scenarioTitle: 'Argus Medical Review, Listedness & Causality Assessment',
    scenarioDescription:
      'Verify physician medical review workflow including listedness comparison against Core Data Sheet and WHO causality assessment.',
    preconditions:
      '1. Case in Medical Review routing status\n2. User has Medical Reviewer privileges\n3. Data entry and MedDRA coding completed',
    expectedOutcome:
      'Medical reviewer assessment recorded, listedness flagged appropriately, case advanced to Quality Review.',
    instructions:
      'Include 10-12 steps covering Analysis tab, Listedness determination, Causality matrix, medical narrative, and routing.',
  },
  {
    title: '21 CFR Part 11 Case Lock',
    description:
      'ICSR validation check, mandatory field verification, electronic signature authentication, case lock',
    scenarioTitle: 'Argus Safety 21 CFR Part 11 Electronic Signature and Case Lock',
    scenarioDescription:
      'Verify validation engine enforces completeness checks and case lock requires electronic signature authentication.',
    preconditions:
      '1. Case in QA Approved status\n2. All mandatory ICSR fields populated\n3. User has Case Lock privileges',
    expectedOutcome:
      'Case locked, all fields become read-only, electronic signature recorded in audit log with timestamp.',
    instructions:
      'Include 10 steps covering ICSR validation, Case Lock dialog, password auth, audit trail, and read-only verification.',
  },
  {
    title: 'E2B(R3) Regulatory Transmission',
    description:
      'Generate ICH E2B(R3) XML, transmit via B2B gateway to FDA FAERS/EMA, verify ACK receipt',
    scenarioTitle: 'Submit E2B(R3) Regulatory Transmission to FDA FAERS',
    scenarioDescription:
      'Verify electronic transmission of ICH E2B(R3) HL7 XML report to health authority gateway and parse MDN/ACK.',
    preconditions:
      '1. Case is locked\n2. Reporting destination configured for FDA FAERS\n3. B2B ESM gateway active',
    expectedOutcome:
      'E2B(R3) generation passes DTD/schema validation; transmission completes with ACK Code 01 (Accepted).',
    instructions:
      'Include 10 steps covering Regulatory Reports tab, ICSR viewer, E2B generation, gateway transmission, and ACK status.',
  },
];

const LSMV_TEMPLATES = [
  {
    title: 'Search Feeds Ingestion & Intake',
    description:
      'Ingest weekly PubMed/Embase bibliographic search feeds into LSMV queue and assign screeners',
    scenarioTitle: 'LSMV Automated Literature Search Feed Ingestion & Screening Queue Intake',
    scenarioDescription:
      'Ingest automated bibliographic feeds from PubMed and Embase, generate unique citation tracking IDs, and assign triage batches.',
    preconditions:
      '1. LSMV database ingestion connector active\n2. Weekly literature search string configured\n3. User has LSMV Administrator role',
    expectedOutcome:
      'Search batch ingested with 100% record count reconciliation; unreviewed citations populated in screener worklists.',
    instructions:
      'Include 10-12 steps covering search query feed run, citation import log, duplicate check, and worklist distribution.',
  },
  {
    title: '4-Criteria ICSR Triage Screening',
    description:
      'Screen journal article against 4 ICSR criteria: Reporter, Patient, Suspect Drug, Adverse Event',
    scenarioTitle: 'LSMV Literature Screening & 4-Criteria ICSR Triage',
    scenarioDescription:
      'Screen published medical journal article in LSMV, evaluate minimum 4 ICSR criteria, and categorize citation.',
    preconditions:
      '1. LSMV Literature Intake queue configured\n2. PubMed citation with full-text PDF indexed\n3. User has LSMV Literature Screener role',
    expectedOutcome:
      'Article triaged as Potential ICSR; 4 criteria checklist verified and logged in LSMV screening record.',
    instructions:
      'Include 12-14 steps covering literature triage queue, 4 ICSR criteria verification, screening decision, and audit sign-off.',
  },
  {
    title: 'Duplicate Citation Screening',
    description:
      'Cross-database duplicate identification across PubMed and Embase using DOI, title similarity, author matches',
    scenarioTitle: 'LSMV Cross-Database Duplicate Citation Screening and De-Duplication',
    scenarioDescription:
      'Identify and merge duplicate citations across PubMed and Embase using DOI matching, title fuzzy logic, and master designation.',
    preconditions:
      '1. LSMV triage batch loaded\n2. Identical study published in two sources\n3. User has LSMV Screener role',
    expectedOutcome:
      'System flags duplicate pair with match confidence score; user links duplicate to primary master citation.',
    instructions:
      'Include 10 steps covering duplicate alert, side-by-side comparison, master selection, and audit trail.',
  },
  {
    title: 'Full-Text PDF Retrieval & Annotations',
    description:
      'Retrieve full-text PDF, annotate adverse event passages, off-label dosages, and medical history',
    scenarioTitle: 'LSMV Full-Text Article PDF Retrieval and Adverse Event Text Annotation',
    scenarioDescription:
      'Retrieve full-text publisher PDF for flagged abstract, attach to LSMV record, and highlight clinical AE findings.',
    preconditions:
      '1. Citation triaged as Potential ICSR\n2. Electronic journal access active\n3. Full-text PDF available',
    expectedOutcome:
      'Full-text PDF attached; adverse event excerpts highlighted and mapped to structured screening fields.',
    instructions:
      'Include 10-12 steps covering PDF attachment, text annotation, extraction of patient data, drug dosage, and AE details.',
  },
  {
    title: 'Medical Valuation & Special Situations',
    description:
      'Physician valuation of off-label use, drug overdose, pregnancy exposure, lack of therapeutic efficacy',
    scenarioTitle: 'LSMV Medical Valuation of Special Situations and Off-Label Use',
    scenarioDescription:
      'Conduct medical evaluator review for complex literature cases assessing off-label use, pregnancy, and benefit-risk impact.',
    preconditions:
      '1. Article triaged by primary screener\n2. Special situation flag present\n3. User has LSMV Medical Evaluator role',
    expectedOutcome:
      'Medical assessment documented with clinical rationale, special situation classification, and safety DB intake recommendation.',
    instructions:
      'Include 10 steps covering medical review queue, clinical valuation, special situation categorization, and sign-off.',
  },
  {
    title: 'QC Review & Safety DB Export',
    description:
      'Quality control dual-check, disposition confirmation, and automated XML/ICSR export to Oracle Argus Safety',
    scenarioTitle: 'LSMV Quality Control Sign-Off and ICSR Export to Safety Database',
    scenarioDescription:
      'Perform secondary QC audit on completed literature triage record, verify attachments, and execute export.',
    preconditions:
      '1. Article passed primary screening and medical valuation\n2. User has LSMV QC Reviewer role\n3. Safety DB interface configured',
    expectedOutcome:
      'QC disposition approved; ICSR payload with bibliographic metadata and PDF transmitted to safety DB intake queue.',
    instructions:
      'Include 10 steps covering QC worklist, reconciliation checklist, disposition approval, export trigger, and log verification.',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TestStepsGeneratorPage() {
  const [environment, setEnvironment] = useState<'argus' | 'lsmv'>('argus');
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [generatedResult, setGeneratedResult] = useState<GeneratedTestScript | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // ── AI Mutation ──────────────────────────────────────────────────────────

  const generateMutation = useMutation({
    mutationFn: () =>
      aiApi.generateTestStepsFromScenario({
        scenarioTitle,
        scenarioDescription,
        preconditions,
        expectedOutcome,
        additionalInstructions,
        environment,
      }),
    onSuccess: (data: any) => {
      if (data.steps && Array.isArray(data.steps)) {
        setGeneratedResult({
          title: data.title || scenarioTitle,
          description: data.description || scenarioDescription,
          preConditions: data.preConditions || preconditions,
          postConditions: data.postConditions || expectedOutcome,
          environment: data.environment || environment,
          steps: data.steps,
        });
      }
      // Scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    if (!scenarioTitle.trim()) return;
    generateMutation.mutate();
  };

  const handleCopySteps = () => {
    if (!generatedResult) return;
    const text = generatedResult.steps
      .map(
        (step) =>
          `Step ${step.stepNumber}: ${step.description}\nExpected Result: ${step.expectedResult}`
      )
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (!generatedResult) return;
    const csv = [
      ['Step Number', 'Description', 'Expected Result'],
      ...generatedResult.steps.map((s) => [
        s.stepNumber,
        `"${s.description.replace(/"/g, '""')}"`,
        `"${s.expectedResult.replace(/"/g, '""')}"`,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    downloadBlob(csv, 'text/csv', `${slugify(scenarioTitle)}_test_steps.csv`);
  };

  const handleExportMarkdown = () => {
    if (!generatedResult) return;
    const isLsmv = (generatedResult.environment || environment) === 'lsmv';
    const md = `# ${generatedResult.title}

**Target Application:** ${isLsmv ? 'LSMV (Literature Screening & Medical Valuation)' : 'Oracle Argus Safety'}
**Domain:** Pharmacovigilance & Drug Safety
**AI Generated:** Yes (SambaNova AI)

## Description
${generatedResult.description}

## Preconditions
${generatedResult.preConditions}

## Expected Outcome
${generatedResult.postConditions}

## Test Steps

${generatedResult.steps
  .map(
    (s) => `### Step ${s.stepNumber}
- **Action:** ${s.description}
- **Expected Result:** ${s.expectedResult}
`
  )
  .join('\n')}
`;
    downloadBlob(
      md,
      'text/markdown',
      `${slugify(scenarioTitle)}_${isLsmv ? 'lsmv' : 'argus'}_test_script.md`
    );
  };

  const handleExportJSON = () => {
    if (!generatedResult) return;
    const json = JSON.stringify(generatedResult, null, 2);
    downloadBlob(json, 'application/json', `${slugify(scenarioTitle)}_test_script.json`);
  };

  const loadTemplate = (template: (typeof ARGUS_TEMPLATES)[0], env: 'argus' | 'lsmv') => {
    setEnvironment(env);
    setScenarioTitle(template.scenarioTitle);
    setScenarioDescription(template.scenarioDescription);
    setPreconditions(template.preconditions);
    setExpectedOutcome(template.expectedOutcome);
    setAdditionalInstructions(template.instructions);
    setGeneratedResult(null);
    // Scroll to input form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const templates = environment === 'argus' ? ARGUS_TEMPLATES : LSMV_TEMPLATES;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
                <Bot className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                AI Test Script Generator
              </h1>
            </div>
            <p className="text-blue-100 text-sm max-w-xl">
              Powered by <span className="font-semibold text-white">SambaNova AI</span> — generate
              comprehensive, regulatory-compliant test scripts for Oracle Argus Safety and LSMV
              instantly.
            </p>
          </div>
          <Badge className="self-start sm:self-auto px-4 py-2 bg-white/20 border-white/30 text-white backdrop-blur-sm text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            SambaNova AI Engine
          </Badge>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* ─── Input Panel ──────────────────────────────────────────── */}
        <Card className="shadow-lg border-0 ring-1 ring-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Zap className="w-4 h-4 text-indigo-600" />
              </div>
              Scenario Input
            </CardTitle>
            <CardDescription>
              Define your pharmacovigilance test scenario. The AI will generate a complete test
              script.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Environment Selector */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-cyan-50 border border-indigo-200/60 space-y-3">
              <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Target Application
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEnvironment('argus')}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border-2 text-left transition-all ${
                    environment === 'argus'
                      ? 'border-indigo-500 bg-white shadow-md ring-2 ring-indigo-500/20'
                      : 'border-transparent bg-white/60 hover:bg-white hover:border-gray-200'
                  }`}
                >
                  <Shield
                    className={`w-5 h-5 shrink-0 ${
                      environment === 'argus' ? 'text-indigo-600' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        environment === 'argus' ? 'text-indigo-900' : 'text-gray-600'
                      }`}
                    >
                      Oracle Argus Safety
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Case Processing, MedDRA, E2B
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setEnvironment('lsmv')}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border-2 text-left transition-all ${
                    environment === 'lsmv'
                      ? 'border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20'
                      : 'border-transparent bg-white/60 hover:bg-white hover:border-gray-200'
                  }`}
                >
                  <BookOpen
                    className={`w-5 h-5 shrink-0 ${
                      environment === 'lsmv' ? 'text-emerald-600' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        environment === 'lsmv' ? 'text-emerald-900' : 'text-gray-600'
                      }`}
                    >
                      LSMV
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Literature Screening & Valuation
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Scenario Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={scenarioTitle}
                onChange={(e) => setScenarioTitle(e.target.value)}
                placeholder={
                  environment === 'argus'
                    ? 'e.g., Argus Safety Spontaneous AE Intake via MedWatch 3500A'
                    : 'e.g., LSMV Literature Screening & 4-Criteria ICSR Triage'
                }
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Description</label>
              <Textarea
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                placeholder={
                  environment === 'argus'
                    ? 'Describe the Argus Safety case processing workflow to test...'
                    : 'Describe the LSMV literature triage workflow to test...'
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Preconditions</label>
                <Textarea
                  value={preconditions}
                  onChange={(e) => setPreconditions(e.target.value)}
                  placeholder="System state required before testing..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Expected Outcome</label>
                <Textarea
                  value={expectedOutcome}
                  onChange={(e) => setExpectedOutcome(e.target.value)}
                  placeholder="What should happen after successful test..."
                  rows={3}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Additional AI Instructions
              </label>
              <Textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="e.g., Include specific steps for anaphylaxis reaction, verify WHO causality matrix..."
                rows={2}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !scenarioTitle.trim()}
              className="w-full h-12 text-base font-bold shadow-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all"
              size="lg"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  SambaNova AI is generating your test script...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate{' '}
                  {environment === 'argus' ? 'Oracle Argus Safety' : 'LSMV'} Test Script
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ─── Output Panel ─────────────────────────────────────────── */}
        <Card className="shadow-lg border-0 ring-1 ring-gray-200" ref={resultRef}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              </div>
              Generated Test Script
            </CardTitle>
            <CardDescription>
              AI-generated test steps with precise actions and expected results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generateMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600" />
                  <Bot className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-base font-semibold text-gray-800 mt-6">
                  SambaNova AI is generating your test script...
                </p>
                <p className="text-xs text-gray-500 mt-1.5">
                  Creating detailed {environment === 'argus' ? 'Oracle Argus Safety' : 'LSMV'}{' '}
                  pharmacovigilance test steps
                </p>
              </div>
            ) : generateMutation.isError ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7 text-red-600" />
                </div>
                <p className="text-red-700 font-bold mb-2">Generation Failed</p>
                <p className="text-sm text-gray-500 text-center max-w-sm">
                  {(generateMutation.error as Error)?.message ||
                    'Could not connect to SambaNova AI. Check your API key and try again.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => generateMutation.mutate()}
                >
                  Retry
                </Button>
              </div>
            ) : generatedResult ? (
              <div className="space-y-4">
                {/* Result Header */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="success"
                      className="font-bold text-xs px-2.5 py-1"
                    >
                      {generatedResult.steps.length} Steps
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold px-2.5 py-1 ${
                        generatedResult.environment === 'lsmv'
                          ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                          : 'border-indigo-300 text-indigo-700 bg-indigo-50'
                      }`}
                    >
                      {generatedResult.environment === 'lsmv' ? (
                        <>
                          <BookOpen className="w-3 h-3 mr-1" />
                          LSMV
                        </>
                      ) : (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Oracle Argus
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopySteps}
                      className="text-xs"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 mr-1" />
                      )}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportMarkdown}
                      className="text-xs"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      MD
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      className="text-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportJSON}
                      className="text-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      JSON
                    </Button>
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {generatedResult.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="group p-4 border rounded-xl hover:shadow-md transition-all bg-white"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1 space-y-2.5">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              Action
                            </span>
                            <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                              Expected Result
                            </span>
                            <p className="text-xs text-emerald-800 mt-0.5 bg-emerald-50 border border-emerald-200/60 p-2.5 rounded-lg leading-relaxed">
                              {step.expectedResult}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Metadata Footer */}
                <div className="pt-3 border-t space-y-1.5">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Script Metadata
                  </h4>
                  <p className="text-xs">
                    <span className="font-semibold text-gray-500">Title:</span>{' '}
                    <span className="text-gray-800 font-medium">{generatedResult.title}</span>
                  </p>
                  {generatedResult.preConditions && (
                    <p className="text-xs">
                      <span className="font-semibold text-gray-500">Preconditions:</span>{' '}
                      <span className="text-gray-600">{generatedResult.preConditions}</span>
                    </p>
                  )}
                  {generatedResult.postConditions && (
                    <p className="text-xs">
                      <span className="font-semibold text-gray-500">Expected Outcome:</span>{' '}
                      <span className="text-gray-600">{generatedResult.postConditions}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="p-4 bg-gray-100 rounded-2xl mb-4">
                  <Bot className="w-10 h-10 opacity-40" />
                </div>
                <p className="text-sm font-semibold text-gray-500">
                  Ready to generate your test script
                </p>
                <p className="text-xs mt-1 text-gray-400 max-w-xs text-center">
                  Fill in the scenario details and click Generate. SambaNova AI will create a
                  complete, regulatory-compliant test script.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Quick Templates ────────────────────────────────────────────────── */}
      <Card className="shadow-lg border-0 ring-1 ring-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Pharmacovigilance Quick Templates</CardTitle>
              <CardDescription>
                Click any template to auto-fill the form — then let SambaNova AI generate the script
              </CardDescription>
            </div>
            <div className="flex rounded-xl border bg-gray-100 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setEnvironment('argus')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  environment === 'argus'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Argus Safety
              </button>
              <button
                type="button"
                onClick={() => setEnvironment('lsmv')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  environment === 'lsmv'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                LSMV
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => loadTemplate(t, environment)}
                className="group p-5 border rounded-xl text-left hover:shadow-lg hover:border-indigo-300 transition-all bg-white"
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-indigo-700 transition-colors">
                      {t.title}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase font-bold shrink-0 ${
                      environment === 'lsmv'
                        ? 'border-emerald-300 text-emerald-700'
                        : 'border-indigo-300 text-indigo-700'
                    }`}
                  >
                    {environment === 'lsmv' ? 'LSMV' : 'Argus'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{t.description}</p>
                <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] font-bold text-indigo-600 flex items-center justify-between">
                  <span>Use Template</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function downloadBlob(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
