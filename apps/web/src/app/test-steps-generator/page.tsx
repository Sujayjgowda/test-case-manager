'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { scenariosApi } from '@/lib/api-client';
import { localStore } from '@/lib/local-store';
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
  Trash2,
  Plus,
  ChevronRight,
} from 'lucide-react';

interface GeneratedStep {
  stepNumber: number;
  description: string;
  expectedResult: string;
}

interface GeneratedTestCase {
  title: string;
  description: string;
  preConditions: string;
  postConditions: string;
  environment?: 'argus' | 'lsmv';
  steps: GeneratedStep[];
}

export default function TestStepsGeneratorPage() {
  const [environment, setEnvironment] = useState<'argus' | 'lsmv'>('argus');
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [generatedResult, setGeneratedResult] = useState<GeneratedTestCase | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | undefined>();
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      // If we have a scenario ID, use the scenario generation endpoint
      if (selectedScenarioId) {
        const response = await scenariosApi.generateTestCases(selectedScenarioId, {
          prompt: additionalInstructions || undefined,
          options: {
            includeNegativeCases: false,
            includeEdgeCases: false,
            numberOfCases: 1,
          },
        });
        return response.data;
      }

      // Otherwise, call the direct AI generation endpoint
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/ai/generate-test-steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioTitle,
            scenarioDescription,
            preconditions,
            expectedOutcome,
            additionalInstructions,
            environment,
          }),
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        // Fall through to local generation
      }

      return localStore.generateTestSteps({
        scenarioTitle,
        scenarioDescription,
        preconditions,
        expectedOutcome,
        additionalInstructions,
        environment,
      });
    },
    onSuccess: (data) => {
      setRetryCountdown(null);
      // The endpoint returns { title, description, preConditions, postConditions, environment, steps }
      if (data.steps && Array.isArray(data.steps)) {
        setGeneratedResult({
          title: data.title || scenarioTitle,
          description: data.description || scenarioDescription,
          preConditions: data.preConditions || preconditions,
          postConditions: data.postConditions || expectedOutcome,
          environment: data.environment || environment,
          steps: data.steps,
        });
      } else if (data.testCases && data.testCases.length > 0) {
        setGeneratedResult({
          ...data.testCases[0],
          environment: data.environment || environment,
        });
      }
    },
    onError: (error: Error) => {
      // Check for rate limit — parse seconds from message like "Please wait 57s and try again"
      const match = error.message.match(/(\d+)s/);
      if (match && error.message.toLowerCase().includes('rate limit')) {
        const seconds = parseInt(match[1]) + 2;
        setRetryCountdown(seconds);
        // Start countdown
        if (retryTimerRef.current) clearInterval(retryTimerRef.current);
        retryTimerRef.current = setInterval(() => {
          setRetryCountdown((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(retryTimerRef.current!);
              retryTimerRef.current = null;
              // Auto-retry
              generateMutation.mutate();
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleCopySteps = () => {
    if (!generatedResult) return;

    const text = generatedResult.steps
      .map((step) => `Step ${step.stepNumber}: ${step.description}\nExpected: ${step.expectedResult}`)
      .join('\n\n');

    navigator.clipboard.writeText(text);
  };

  const handleExport = () => {
    if (!generatedResult) return;

    const csv = [
      ['Step Number', 'Description', 'Expected Result'],
      ...generatedResult.steps.map((s) => [s.stepNumber, `"${s.description.replace(/"/g, '""')}"`, `"${s.expectedResult.replace(/"/g, '""')}"`]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenarioTitle.replace(/[^a-z0-9]/gi, '_')}_test_steps.csv`;
    a.click();
  };

  const handleExportMarkdown = () => {
    if (!generatedResult) return;
    const isLsmv = (generatedResult.environment || environment) === 'lsmv';
    const md = `# ${generatedResult.title}

**Target Application:** ${isLsmv ? 'LSMV (Literature Screening & Medical Valuation)' : 'Oracle Argus Safety'}
**Domain:** Pharmacovigilance & Drug Safety
**Status:** Validated Test Script

## Description
${generatedResult.description}

## Preconditions
${generatedResult.preConditions}

## Expected Outcome
${generatedResult.postConditions}

## Detailed Pharmacovigilance Test Steps (${isLsmv ? 'LSMV Specific' : 'Oracle Argus Safety Specific'})
${generatedResult.steps.map((s) => `### Step ${s.stepNumber}
- **Action:** ${s.description}
- **Expected Result:** ${s.expectedResult}
`).join('\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenarioTitle.replace(/[^a-z0-9]/gi, '_')}_${isLsmv ? 'lsmv' : 'argus'}_test_steps.md`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Test Steps Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate detailed, non-clubbed test steps strictly isolated for Oracle Argus Safety or LSMV
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Scenario Input
            </CardTitle>
            <CardDescription>
              Select your target application environment and scenario details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Environment Dropdown Selector */}
            <div className="p-3.5 border-2 border-primary/20 bg-primary/5 rounded-lg space-y-2">
              <label htmlFor="environment-select" className="block text-sm font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  Target Application Environment <span className="text-red-500">*</span>
                </span>
                <span className="text-xs font-medium text-primary uppercase tracking-wider">
                  Isolated Test Steps
                </span>
              </label>
              <select
                id="environment-select"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as 'argus' | 'lsmv')}
                className="w-full h-11 px-3 py-2 bg-background border-2 border-primary/40 rounded-md text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="argus">🛡️ Oracle Argus Safety (Case Book-in, MedDRA, Case Lock, E2B-R3)</option>
                <option value="lsmv">📖 LSMV (Literature Screening & Medical Valuation, ICSR Triage, PDF Review)</option>
              </select>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {environment === 'argus' ? (
                  <span>
                    <strong className="text-primary font-semibold">Oracle Argus Safety Active:</strong> Generates strict regulatory safety database steps (Book-in, Patient/Product/Events tabs, MedDRA, Listedness, 21 CFR Part 11 Lock, E2B-R3). Never mixes LSMV triage steps.
                  </span>
                ) : (
                  <span>
                    <strong className="text-emerald-700 font-semibold">LSMV Application Active:</strong> Generates strict literature workflow steps (PubMed/Embase Feed Ingestion, 4-Criteria Triage, Duplicate Screening, Full-Text PDF Review, Medical Valuation, Safety DB Export). Never mixes Argus Case Form tabs.
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Scenario Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={scenarioTitle}
                onChange={(e) => setScenarioTitle(e.target.value)}
                placeholder={
                  environment === 'argus'
                    ? 'e.g., Argus Safety Spontaneous Adverse Event Intake via MedWatch 3500A'
                    : 'e.g., LSMV Literature Screening & 4-Criteria ICSR Triage'
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Scenario Description
              </label>
              <Textarea
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                placeholder={
                  environment === 'argus'
                    ? 'Describe Argus Safety case intake, MedDRA coding, case lock, or E2B reporting...'
                    : 'Describe LSMV literature search feed triage, duplicate screening, PDF review, or export...'
                }
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Preconditions
              </label>
              <Textarea
                value={preconditions}
                onChange={(e) => setPreconditions(e.target.value)}
                placeholder={
                  environment === 'argus'
                    ? 'e.g., User has Argus Case Processor role, MedDRA dictionary active, Study unmasked...'
                    : 'e.g., PubMed/Embase feed indexed in LSMV, User has Literature Screener role, Full-text PDF available...'
                }
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Expected Outcome
              </label>
              <Textarea
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                placeholder={
                  environment === 'argus'
                    ? 'e.g., Argus case booked in, MedDRA coded, locked with 21 CFR Part 11 signature, E2B-R3 submitted...'
                    : 'e.g., 4 ICSR criteria satisfied, citation triaged as Potential ICSR, approved by Medical Reviewer, exported to Argus...'
                }
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Instructions for AI
              </label>
              <Textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="e.g., Include 10-15 detailed steps, Focus on data entry validation, Include negative error testing..."
                rows={2}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !scenarioTitle}
              className="w-full"
              size="lg"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating {environment === 'argus' ? 'Argus Safety' : 'LSMV'} Test Steps...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate {environment === 'argus' ? 'Oracle Argus Safety' : 'LSMV'} Steps
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Dedicated test steps will be prepared strictly for {environment === 'argus' ? 'Oracle Argus Safety' : 'LSMV'}
            </p>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-600" />
              Generated Test Steps
            </CardTitle>
            <CardDescription>
              AI-generated test steps with expected results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generateMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">
                  AI is generating detailed test steps...
                </p>
              </div>
            ) : generateMutation.isError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-red-600 text-2xl">✕</span>
                </div>
                <p className="text-red-600 font-medium mb-2">Generation Failed</p>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  {(generateMutation.error as Error)?.message || 'An unexpected error occurred. Please check your API configuration.'}
                </p>
              </div>
            ) : generatedResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="success">
                      {generatedResult.steps.length} Steps Generated
                    </Badge>
                    {generatedResult.environment === 'lsmv' ? (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                        📖 LSMV Application Validated
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
                        🛡️ Oracle Argus Safety Validated
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopySteps}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
                      <Download className="w-4 h-4 mr-2" />
                      Markdown
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {generatedResult.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              Action
                            </span>
                            <p className="text-sm mt-1">{step.description}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              Expected Result
                            </span>
                            <p className="text-sm mt-1 text-green-700 bg-green-50 p-2 rounded">
                              {step.expectedResult}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Test Case Info</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Title:</span>{' '}
                      <span className="font-medium">{generatedResult.title}</span>
                    </div>
                    {generatedResult.preConditions && (
                      <div>
                        <span className="text-muted-foreground">Preconditions:</span>{' '}
                        <p className="text-muted-foreground mt-1">
                          {generatedResult.preConditions}
                        </p>
                      </div>
                    )}
                    {generatedResult.postConditions && (
                      <div>
                        <span className="text-muted-foreground">
                          Post-conditions:
                        </span>{' '}
                        <p className="text-muted-foreground mt-1">
                          {generatedResult.postConditions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckSquare className="w-12 h-12 mb-4 opacity-20" />
                <p>Enter your scenario details and click generate</p>
                <p className="text-sm mt-2">
                  Test steps will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Pharmacovigilance Quick Templates</CardTitle>
              <CardDescription>
                Select a validated template for either Oracle Argus Safety or LSMV application
              </CardDescription>
            </div>
            {/* Quick Template Environment Switcher */}
            <div className="flex rounded-lg border bg-muted p-1">
              <button
                type="button"
                onClick={() => setEnvironment('argus')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  environment === 'argus'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🛡️ Argus Safety Templates
              </button>
              <button
                type="button"
                onClick={() => setEnvironment('lsmv')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  environment === 'lsmv'
                    ? 'bg-background text-emerald-700 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                📖 LSMV Templates
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {environment === 'argus' ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  🛡️ Oracle Argus Safety Dedicated Scenarios
                </span>
                <span className="text-xs text-muted-foreground">
                  Click any template to populate inputs for Argus Safety
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <TemplateCard
                  badge="Argus Safety"
                  badgeColor="blue"
                  title="Argus Spontaneous AE Book-in"
                  description="MedWatch 3500A report intake, duplicate search, General/Patient/Products/Events tabs, and MedDRA auto-coding"
                  onClick={() => {
                    setEnvironment('argus');
                    setScenarioTitle('Argus Safety Spontaneous Adverse Event Intake via MedWatch 3500A');
                    setScenarioDescription(
                      'Capture spontaneous HCP report of severe adverse reaction, perform duplicate search, enter patient and suspect drug details, and auto-encode MedDRA.'
                    );
                    setPreconditions(
                      '1. Argus Safety database accessible\n2. User has Case Processor privileges\n3. MedDRA v27.0 dictionary active'
                    );
                    setExpectedOutcome(
                      'New Argus case successfully booked in and data entered with zero duplicate flags and correct MedDRA LLT/PT mapping.'
                    );
                    setAdditionalInstructions(
                      'Include 12-15 detailed steps covering initial book-in, duplicate detection, reporter tab, patient demographics, product details, MedDRA encoding, and case save.'
                    );
                  }}
                />
                <TemplateCard
                  badge="Argus Safety"
                  badgeColor="blue"
                  title="Blinded Clinical Trial Study Case"
                  description="Clinical trial adverse event intake with protocol configuration and masked investigational medicinal product"
                  onClick={() => {
                    setEnvironment('argus');
                    setScenarioTitle('Create Blinded Case for Clinical Trial AE');
                    setScenarioDescription(
                      'Verify that a user with Blinded Case Processor role can create a case where treatment information is masked.'
                    );
                    setPreconditions(
                      '1. User is logged in with Blinded Case Processor role\n2. Clinical Study protocol configured for double-blind maintenance\n3. Patient enrolled and eligible'
                    );
                    setExpectedOutcome(
                      'Case saved in Argus Safety with blinded status; Study Drug field displays masked value; unblinded access restricted.'
                    );
                    setAdditionalInstructions(
                      'Include 10-12 detailed steps covering study selection, patient ID entry, blind maintenance verification, and audit log inspection.'
                    );
                  }}
                />
                <TemplateCard
                  badge="Argus Safety"
                  badgeColor="blue"
                  title="MedDRA Auto-Coding & Hierarchy"
                  description="Verbatim symptom entry, MedDRA browser search, primary SOC selection, and LLT/PT hierarchy mapping"
                  onClick={() => {
                    setEnvironment('argus');
                    setScenarioTitle('Argus MedDRA Auto-Coding and Hierarchy Selection');
                    setScenarioDescription(
                      'Validate auto-encoding of verbatim adverse event term into MedDRA LLT, PT, and verification of primary SOC assignment.'
                    );
                    setPreconditions(
                      '1. Case form open on Events tab\n2. Active MedDRA version loaded\n3. Verbatim adverse event entered'
                    );
                    setExpectedOutcome(
                      'MedDRA coding engine resolves exact LLT match, displays full hierarchy path, and saves primary SOC correctly.'
                    );
                    setAdditionalInstructions(
                      'Include 10 detailed steps covering verbatim entry, auto-code trigger, manual MedDRA browser lookup, hierarchy confirmation, and case audit save.'
                    );
                  }}
                />
                <TemplateCard
                  badge="Argus Safety"
                  badgeColor="blue"
                  title="Medical Review & Causality"
                  description="Evaluate company listedness against CCDS, assign WHO-UMC causality score, and sign off as Medical Reviewer"
                  onClick={() => {
                    setEnvironment('argus');
                    setScenarioTitle('Argus Medical Review, Listedness & Causality Assessment');
                    setScenarioDescription(
                      'Verify physician medical review workflow including listedness comparison against Core Data Sheet and reporter vs company causality.'
                    );
                    setPreconditions(
                      '1. Case is in Medical Review routing status\n2. User has Medical Reviewer privileges\n3. Data entry and MedDRA coding completed'
                    );
                    setExpectedOutcome(
                      'Medical reviewer assessment recorded, listedness flagged appropriately, and case advanced to Quality Review.'
                    );
                    setAdditionalInstructions(
                      'Include 10-12 steps covering Analysis tab, Listedness determination, Causality matrix, medical narrative summary, and routing.'
                    );
                  }}
                />
                <TemplateCard
                  badge="Argus Safety"
                  badgeColor="blue"
                  title="21 CFR Part 11 Case Lock"
                  description="Run ICSR validation check, verify mandatory fields, authenticate electronic signature, and execute case lock"
                  onClick={() => {
                    setEnvironment('argus');
                    setScenarioTitle('Argus Safety 21 CFR Part 11 Electronic Signature and Case Lock');
                    setScenarioDescription(
                      'Verify validation engine enforces completeness checks and case lock locks all tabs requiring electronic signature authentication.'
                    );
                    setPreconditions(
                      '1. Case in QA Approved status\n2. All mandatory ICSR fields populated\n3. User has Case Lock privileges'
                    );
                    setExpectedOutcome(
                      'Case is locked, all case form fields become read-only, electronic signature recorded in audit log with timestamp.'
                    );
                    setAdditionalInstructions(
                      'Include 10 steps covering ICSR validation check, Case Lock dialog, password authentication, audit trail verification, and read-only field verification.'
                    );
                  }}
                />
                <TemplateCard
                  badge="Argus Safety"
                  badgeColor="blue"
                  title="Regulatory E2B(R3) Transmission"
                  description="Generate ICH E2B(R3) XML message, transmit via B2B gateway to FDA FAERS/EMA, and verify ACK receipt"
                  onClick={() => {
                    setEnvironment('argus');
                    setScenarioTitle('Submit E2B(R3) Regulatory Transmission to FDA FAERS');
                    setScenarioDescription(
                      'Verify electronic transmission of ICH E2B(R3) HL7 XML report to health authority gateway and parse MDN/ACK.'
                    );
                    setPreconditions(
                      '1. Case is locked\n2. Reporting destination configured for FDA FAERS\n3. B2B ESM gateway active'
                    );
                    setExpectedOutcome(
                      'E2B(R3) generation passes DTD/schema validation; transmission completes with ACK Code 01 (Accepted).'
                    );
                    setAdditionalInstructions(
                      'Include 10 steps covering Regulatory Reports tab, ICSR viewer, E2B generation, gateway transmission, and ACK status confirmation.'
                    );
                  }}
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  📖 LSMV (Literature Screening & Medical Valuation) Dedicated Scenarios
                </span>
                <span className="text-xs text-muted-foreground">
                  Click any template to populate inputs for LSMV
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <TemplateCard
                  badge="LSMV"
                  badgeColor="emerald"
                  title="Search Feeds Ingestion & Intake"
                  description="Ingest weekly PubMed/Embase bibliographic search feeds into the LSMV queue and assign screeners"
                  onClick={() => {
                    setEnvironment('lsmv');
                    setScenarioTitle('LSMV Automated Literature Search Feed Ingestion & Screening Queue Intake');
                    setScenarioDescription(
                      'Ingest automated bibliographic feeds from PubMed and Embase, generate unique citation tracking IDs, and assign triage batches to screeners.'
                    );
                    setPreconditions(
                      '1. LSMV database ingestion connector active\n2. Weekly literature search string configured\n3. User has LSMV Administrator role'
                    );
                    setExpectedOutcome(
                      'Search batch ingested with 100% record count reconciliation; unreviewed citations populated in screener worklists.'
                    );
                    setAdditionalInstructions(
                      'Include 10-12 steps covering search query feed run, citation import log, duplicate check against prior weeks, and worklist distribution.'
                    );
                  }}
                />
                <TemplateCard
                  badge="LSMV"
                  badgeColor="emerald"
                  title="4-Criteria ICSR Triage Screening"
                  description="Screen journal article title and abstract against 4 ICSR criteria: Reporter, Patient, Suspect Drug, Adverse Event"
                  onClick={() => {
                    setEnvironment('lsmv');
                    setScenarioTitle('LSMV Literature Screening & 4-Criteria ICSR Triage');
                    setScenarioDescription(
                      'Screen published medical journal article in LSMV, evaluate minimum 4 ICSR criteria, and categorize citation as Potential ICSR or Non-ICSR.'
                    );
                    setPreconditions(
                      '1. LSMV Literature Intake queue configured\n2. PubMed citation with full-text PDF indexed\n3. User has LSMV Literature Screener role'
                    );
                    setExpectedOutcome(
                      'Article triaged as Potential ICSR; 4 criteria checklist verified and logged in LSMV screening record.'
                    );
                    setAdditionalInstructions(
                      'Include 12-14 detailed steps covering literature triage queue, 4 ICSR criteria verification checklist, screening decision, and audit sign-off.'
                    );
                  }}
                />
                <TemplateCard
                  badge="LSMV"
                  badgeColor="emerald"
                  title="Duplicate Citation Screening"
                  description="Identify cross-database duplicates across PubMed and Embase using DOI, title similarity, and author matches"
                  onClick={() => {
                    setEnvironment('lsmv');
                    setScenarioTitle('LSMV Cross-Database Duplicate Citation Screening and De-Duplication');
                    setScenarioDescription(
                      'Identify and merge duplicate citations across PubMed and Embase using DOI matching, title fuzzy logic, and master citation designation.'
                    );
                    setPreconditions(
                      '1. LSMV triage batch loaded\n2. Identical study published in two indexed sources\n3. User has LSMV Screener role'
                    );
                    setExpectedOutcome(
                      'System flags duplicate pair with match confidence score; user links duplicate to primary master citation without loss of bibliographic notes.'
                    );
                    setAdditionalInstructions(
                      'Include 10 steps covering duplicate alert trigger, side-by-side metadata comparison, master selection, and audit trail record.'
                    );
                  }}
                />
                <TemplateCard
                  badge="LSMV"
                  badgeColor="emerald"
                  title="Full-Text PDF Retrieval & Annotations"
                  description="Retrieve full-text PDF article, annotate adverse event passages, off-label dosages, and medical history"
                  onClick={() => {
                    setEnvironment('lsmv');
                    setScenarioTitle('LSMV Full-Text Article PDF Retrieval and Adverse Event Text Annotation');
                    setScenarioDescription(
                      'Retrieve full-text publisher PDF for flagged abstract, attach document to LSMV record, and highlight clinical AE findings.'
                    );
                    setPreconditions(
                      '1. Citation triaged as Potential ICSR in LSMV\n2. Electronic journal access active\n3. Full-text PDF available'
                    );
                    setExpectedOutcome(
                      'Full-text PDF attached; adverse event excerpts highlighted and mapped to structured screening fields.'
                    );
                    setAdditionalInstructions(
                      'Include 10-12 steps covering PDF attachment, text annotation tool, extraction of patient age/gender, suspect drug dosage, and adverse event details.'
                    );
                  }}
                />
                <TemplateCard
                  badge="LSMV"
                  badgeColor="emerald"
                  title="Medical Valuation & Special Situations"
                  description="Physician valuation of off-label use, drug overdose, pregnancy exposure, and lack of therapeutic efficacy"
                  onClick={() => {
                    setEnvironment('lsmv');
                    setScenarioTitle('LSMV Medical Valuation of Special Situations and Off-Label Use');
                    setScenarioDescription(
                      'Conduct medical evaluator review in LSMV for complex literature cases, assessing off-label use, pregnancy, and benefit-risk impact.'
                    );
                    setPreconditions(
                      '1. Article triaged by primary screener\n2. Special situation flag present in article text\n3. User has LSMV Medical Evaluator role'
                    );
                    setExpectedOutcome(
                      'Medical assessment documented with clinical rationale, special situation classification, and recommendation for safety database intake.'
                    );
                    setAdditionalInstructions(
                      'Include 10 steps covering medical review queue, clinical valuation tab, special situation categorization, and medical concurrence sign-off.'
                    );
                  }}
                />
                <TemplateCard
                  badge="LSMV"
                  badgeColor="emerald"
                  title="QC Review & Safety DB Export"
                  description="Quality control dual-check, disposition confirmation, and automated XML/ICSR export to Oracle Argus Safety intake"
                  onClick={() => {
                    setEnvironment('lsmv');
                    setScenarioTitle('LSMV Quality Control Sign-Off and ICSR Export to Safety Database');
                    setScenarioDescription(
                      'Perform secondary QC audit on completed literature triage record, verify attachments, and execute export to downstream safety database.'
                    );
                    setPreconditions(
                      '1. Article passed primary screening and medical valuation\n2. User has LSMV QC Reviewer role\n3. Safety database interface configured'
                    );
                    setExpectedOutcome(
                      'QC disposition approved; ICSR payload with bibliographic metadata and full-text PDF successfully transmitted to safety database intake queue.'
                    );
                    setAdditionalInstructions(
                      'Include 10 steps covering QC worklist, reconciliation checklist, disposition approval, export trigger, and export transmission log verification.'
                    );
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateCard({
  title,
  description,
  badge,
  badgeColor = 'blue',
  onClick,
}: {
  title: string;
  description: string;
  badge?: string;
  badgeColor?: 'blue' | 'emerald';
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="p-4 border rounded-lg cursor-pointer hover:shadow-lg hover:border-primary transition-all flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{title}</h3>
          </div>
          {badge && (
            <span
              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                badgeColor === 'emerald'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="mt-3 pt-2 border-t border-border/50 text-[11px] font-medium text-primary flex items-center justify-between">
        <span>Use Template</span>
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}

