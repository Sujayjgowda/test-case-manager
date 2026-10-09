'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { scenariosApi } from '@/lib/api-client';
import { localStore, Project, Scenario } from '@/lib/local-store';
import { generateTestStepsAsync } from '@/lib/argus-lsmv-engine';
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
  BookmarkPlus,
  Settings,
  CheckCircle2,
  ExternalLink,
  X,
  Check,
} from 'lucide-react';
import Link from 'next/link';

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

  // Available Data from Store
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [availableScenarios, setAvailableScenarios] = useState<Scenario[]>([]);

  // Save Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveScenarioOption, setSaveScenarioOption] = useState<'existing' | 'new'>('existing');
  const [saveSelectedProjectId, setSaveSelectedProjectId] = useState<number>(1);
  const [saveSelectedScenarioId, setSaveSelectedScenarioId] = useState<number | undefined>();
  const [saveNewScenarioTitle, setSaveNewScenarioTitle] = useState('');
  const [saveTestCaseTitle, setSaveTestCaseTitle] = useState('');
  const [savePriority, setSavePriority] = useState('high');
  const [savedSuccessInfo, setSavedSuccessInfo] = useState<{
    id: number;
    title: string;
    scenarioTitle: string;
  } | null>(null);

  // AI Configuration State
  const [showAiSettingsModal, setShowAiSettingsModal] = useState(false);
  const [aiProvider, setAiProvider] = useState<'builtin' | 'gemini' | 'openai' | 'groq'>('builtin');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiKeySavedNotice, setAiKeySavedNotice] = useState(false);

  // Refresh available projects and scenarios from local store
  const refreshStoreData = () => {
    try {
      const projs = localStore.getProjects();
      const scens = localStore.getScenarios();
      setAvailableProjects(projs);
      setAvailableScenarios(scens);

      if (projs.length > 0 && !saveSelectedProjectId) {
        setSaveSelectedProjectId(projs[0].id);
      }
      if (scens.length > 0 && !saveSelectedScenarioId) {
        setSaveSelectedScenarioId(scens[0].id);
      }
    } catch (e) {
      console.warn('Failed to load local store data:', e);
    }
  };

  useEffect(() => {
    refreshStoreData();

    // Load AI config from localStorage
    try {
      const stored = localStorage.getItem('tcm_ai_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.provider) setAiProvider(parsed.provider);
        if (parsed.apiKey) setAiApiKey(parsed.apiKey);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveAiConfig = () => {
    try {
      localStorage.setItem(
        'tcm_ai_config',
        JSON.stringify({
          provider: aiProvider,
          apiKey: aiApiKey.trim(),
        })
      );
      setAiKeySavedNotice(true);
      setTimeout(() => {
        setAiKeySavedNotice(false);
        setShowAiSettingsModal(false);
      }, 900);
    } catch (e) {
      console.error(e);
    }
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Direct client-side AI Generation & Pharmacovigilance Calculation Engine
      // This automatically uses the configured live LLM (Gemini/OpenAI) if an API key is saved,
      // or executes the dynamic Pharmacovigilance Calculation Engine.
      try {
        const result = await generateTestStepsAsync({
          scenarioTitle,
          scenarioDescription,
          preconditions,
          expectedOutcome,
          additionalInstructions,
          environment,
          apiKey: aiApiKey || undefined,
          aiProvider,
        });

        if (result && result.steps && result.steps.length > 0) {
          return result;
        }
      } catch (err) {
        console.warn('Client engine encountered error, attempting API fallback:', err);
      }

      // Optional backend server fallback
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/ai/generate-test-steps`,
          {
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
          }
        );

        if (response.ok) {
          return await response.json();
        }
      } catch {
        // ignore
      }

      // Guaranteed fallback
      return localStore.generateTestSteps({
        scenarioTitle,
        scenarioDescription,
        preconditions,
        expectedOutcome,
        additionalInstructions,
        environment,
      });
    },
    onSuccess: (data: any) => {
      setRetryCountdown(null);
      setSavedSuccessInfo(null);

      if (data.steps && Array.isArray(data.steps)) {
        setGeneratedResult({
          title: data.title || scenarioTitle,
          description: data.description || scenarioDescription,
          preConditions: data.preConditions || preconditions,
          postConditions: data.postConditions || expectedOutcome,
          environment: data.environment || environment,
          steps: data.steps,
        });
        setSaveTestCaseTitle(data.title || scenarioTitle);
      } else if (data.testCases && data.testCases.length > 0) {
        setGeneratedResult({
          ...data.testCases[0],
          environment: data.environment || environment,
        });
        setSaveTestCaseTitle(data.testCases[0].title || scenarioTitle);
      }
    },
    onError: (error: Error) => {
      const match = error.message.match(/(\d+)s/);
      if (match && error.message.toLowerCase().includes('rate limit')) {
        const seconds = parseInt(match[1]) + 2;
        setRetryCountdown(seconds);
        if (retryTimerRef.current) clearInterval(retryTimerRef.current);
        retryTimerRef.current = setInterval(() => {
          setRetryCountdown((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(retryTimerRef.current!);
              retryTimerRef.current = null;
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
      ...generatedResult.steps.map((s) => [
        s.stepNumber,
        `"${s.description.replace(/"/g, '""')}"`,
        `"${s.expectedResult.replace(/"/g, '""')}"`,
      ]),
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
${generatedResult.steps
  .map(
    (s) => `### Step ${s.stepNumber}
- **Action:** ${s.description}
- **Expected Result:** ${s.expectedResult}
`
  )
  .join('\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenarioTitle.replace(/[^a-z0-9]/gi, '_')}_${isLsmv ? 'lsmv' : 'argus'}_test_steps.md`;
    a.click();
  };

  const handleSaveToProject = () => {
    if (!generatedResult) return;

    try {
      const saved = localStore.saveGeneratedTestCase({
        scenarioId: saveScenarioOption === 'existing' ? saveSelectedScenarioId : undefined,
        newScenarioTitle:
          saveScenarioOption === 'new'
            ? saveNewScenarioTitle || generatedResult.title
            : undefined,
        title: saveTestCaseTitle || generatedResult.title,
        description: generatedResult.description,
        preConditions: generatedResult.preConditions,
        postConditions: generatedResult.postConditions,
        priority: savePriority,
        steps: generatedResult.steps,
        environment: generatedResult.environment || environment,
      });

      // Find scenario title for confirmation banner
      let targetScenarioName = 'Selected Scenario';
      if (saveScenarioOption === 'existing' && saveSelectedScenarioId) {
        const sc = availableScenarios.find((s) => s.id === saveSelectedScenarioId);
        if (sc) targetScenarioName = sc.title;
      } else if (saveScenarioOption === 'new') {
        targetScenarioName = saveNewScenarioTitle || generatedResult.title;
      }

      setSavedSuccessInfo({
        id: saved.id,
        title: saved.title,
        scenarioTitle: targetScenarioName,
      });

      setShowSaveModal(false);
      refreshStoreData();
    } catch (err: any) {
      alert(`Failed to save test case: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Test Steps Generator</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Dynamically synthesize and calculate isolated test steps for Oracle Argus Safety or LSMV
          </p>
        </div>
        <div className="flex items-center gap-3">
          {aiProvider === 'builtin' ? (
            <Badge
              variant="outline"
              className="px-3 py-1 bg-primary/10 text-primary border-primary/30 text-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Pharmacovigilance Dynamic Engine
            </Badge>
          ) : (
            <Badge variant="success" className="px-3 py-1 text-xs flex items-center gap-1.5 shadow-sm">
              <Zap className="w-3.5 h-3.5" />
              Live AI ({aiProvider.toUpperCase()})
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAiSettingsModal(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Settings className="w-4 h-4" />
            AI Settings
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedSuccessInfo && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between flex-wrap gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-900">
                Test Case Saved Successfully!
              </p>
              <p className="text-xs text-emerald-700">
                &ldquo;{savedSuccessInfo.title}&rdquo; is now stored under &ldquo;{savedSuccessInfo.scenarioTitle}&rdquo;.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/test-cases/${savedSuccessInfo.id}`}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                View Test Case #{savedSuccessInfo.id} <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
            <Link href="/test-cases">
              <Button variant="outline" size="sm" className="text-xs">
                All Test Cases
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSavedSuccessInfo(null)}
              className="text-emerald-700 hover:text-emerald-900 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card className="shadow-sm">
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
              <label
                htmlFor="environment-select"
                className="block text-sm font-semibold text-foreground flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  Target Application Environment <span className="text-red-500">*</span>
                </span>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Isolated Steps
                </span>
              </label>
              <select
                id="environment-select"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as 'argus' | 'lsmv')}
                className="w-full h-11 px-3 py-2 bg-background border-2 border-primary/40 rounded-md text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="argus">🛡️ Oracle Argus Safety (Case Book-in, MedDRA, Case Lock, E2B-R3)</option>
                <option value="lsmv">
                  📖 LSMV (Literature Screening & Medical Valuation, ICSR Triage, PDF Review)
                </option>
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

            {/* Optional: Load from Saved Scenario */}
            {availableScenarios.length > 0 && (
              <div className="p-2.5 bg-muted/40 border rounded-lg space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Load Details from Saved Scenario (Optional)
                </label>
                <select
                  value={selectedScenarioId || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    if (id) {
                      const sc = availableScenarios.find((s) => s.id === id);
                      if (sc) {
                        setSelectedScenarioId(sc.id);
                        setScenarioTitle(sc.title);
                        setScenarioDescription(sc.description || '');
                        setPreconditions(sc.preconditions || '');
                        setExpectedOutcome(sc.expectedOutcome || '');
                        const isLsmv =
                          sc.title.toLowerCase().includes('lsmv') ||
                          (sc.description || '').toLowerCase().includes('lsmv') ||
                          sc.title.toLowerCase().includes('literature');
                        setEnvironment(isLsmv ? 'lsmv' : 'argus');
                      }
                    } else {
                      setSelectedScenarioId(undefined);
                    }
                  }}
                  className="w-full h-9 px-2.5 py-1 bg-background border rounded-md text-xs font-medium focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="">-- Choose an existing saved scenario to populate --</option>
                  {availableScenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.module?.project?.name || 'Project'})
                    </option>
                  ))}
                </select>
              </div>
            )}

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
              <label className="block text-sm font-medium mb-2">Scenario Description</label>
              <Textarea
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                placeholder={
                  environment === 'argus'
                    ? 'Describe Argus Safety case intake, suspect drug, reaction, MedDRA coding, case lock, or E2B reporting...'
                    : 'Describe LSMV literature search feed triage, duplicate screening, PDF review, or export...'
                }
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Preconditions</label>
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
              <label className="block text-sm font-medium mb-2">Expected Outcome</label>
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
              <label className="block text-sm font-medium mb-2">Additional Instructions for AI</label>
              <Textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="e.g., Include specific steps for anaphylaxis reaction, check WHO causality matrix, verify 21 CFR Part 11 password prompt..."
                rows={2}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !scenarioTitle.trim()}
              className="w-full text-base font-semibold shadow-sm"
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
              Dedicated test steps will be prepared strictly for{' '}
              <span className="font-semibold text-foreground">
                {environment === 'argus' ? 'Oracle Argus Safety' : 'LSMV'}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              Generated Test Steps
            </CardTitle>
            <CardDescription>
              Dynamically synthesized test steps with specific actions and expected results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generateMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-base font-medium text-foreground">
                  AI is calculating tailored test steps...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Synthesizing pharmacovigilance workflows for{' '}
                  {environment === 'argus' ? 'Oracle Argus Safety' : 'LSMV'}
                </p>
              </div>
            ) : generateMutation.isError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-red-600 text-2xl font-bold">✕</span>
                </div>
                <p className="text-red-600 font-semibold mb-2">Generation Failed</p>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  {(generateMutation.error as Error)?.message ||
                    'An unexpected error occurred during generation.'}
                </p>
              </div>
            ) : generatedResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="font-semibold">
                      {generatedResult.steps.length} Steps Generated
                    </Badge>
                    {generatedResult.environment === 'lsmv' ? (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                        📖 LSMV Isolated
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
                        🛡️ Oracle Argus Isolated
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                      onClick={() => {
                        setSaveTestCaseTitle(generatedResult.title);
                        setShowSaveModal(true);
                      }}
                    >
                      <BookmarkPlus className="w-4 h-4 mr-1.5" />
                      Save as Test Case
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopySteps}>
                      <Copy className="w-4 h-4 mr-1.5" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
                      <Download className="w-4 h-4 mr-1.5" />
                      Markdown
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-1.5" />
                      CSV
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {generatedResult.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-3.5 border rounded-lg hover:shadow-md transition-shadow bg-card"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              Action
                            </span>
                            <p className="text-sm font-medium mt-0.5 text-foreground">
                              {step.description}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                              Expected Result
                            </span>
                            <p className="text-xs mt-0.5 text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 p-2 rounded">
                              {step.expectedResult}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Case Metadata
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-muted-foreground font-medium">Title:</span>{' '}
                      <span className="font-semibold text-foreground">{generatedResult.title}</span>
                    </div>
                    {generatedResult.preConditions && (
                      <div>
                        <span className="text-muted-foreground font-medium">Preconditions:</span>{' '}
                        <span className="text-muted-foreground">{generatedResult.preConditions}</span>
                      </div>
                    )}
                    {generatedResult.postConditions && (
                      <div>
                        <span className="text-muted-foreground font-medium">Expected Outcome:</span>{' '}
                        <span className="text-muted-foreground">{generatedResult.postConditions}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckSquare className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Enter your scenario details and click generate</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Steps will be synthesized specifically for your scenario
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Templates */}
      <Card className="shadow-sm">
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

      {/* Save as Test Case Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-xl border max-w-lg w-full shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold">Save as Test Case</h3>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Save Destination
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveScenarioOption('existing')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                      saveScenarioOption === 'existing'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Add to Existing Scenario
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaveScenarioOption('new')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                      saveScenarioOption === 'new'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Create New Scenario
                  </button>
                </div>
              </div>

              {saveScenarioOption === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Select Target Scenario <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={saveSelectedScenarioId || ''}
                    onChange={(e) => setSaveSelectedScenarioId(parseInt(e.target.value) || undefined)}
                    className="w-full h-10 px-3 py-2 bg-background border rounded-md text-sm font-medium focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Choose Scenario --</option>
                    {availableScenarios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.module?.project?.name || 'Project'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Project <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={saveSelectedProjectId}
                      onChange={(e) => setSaveSelectedProjectId(parseInt(e.target.value))}
                      className="w-full h-10 px-3 py-2 bg-background border rounded-md text-sm font-medium focus:ring-2 focus:ring-primary"
                    >
                      {availableProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.key})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      New Scenario Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={saveNewScenarioTitle}
                      onChange={(e) => setSaveNewScenarioTitle(e.target.value)}
                      placeholder="e.g., Argus Spontaneous Ingestion Flow"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Test Case Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={saveTestCaseTitle}
                  onChange={(e) => setSaveTestCaseTitle(e.target.value)}
                  placeholder="Test Case Name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Priority</label>
                <select
                  value={savePriority}
                  onChange={(e) => setSavePriority(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-background border rounded-md text-sm font-medium focus:ring-2 focus:ring-primary"
                >
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Summary:</span> Will save{' '}
                <strong className="text-primary">{generatedResult?.steps.length || 0}</strong>{' '}
                steps with preconditions and postconditions.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setShowSaveModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveToProject}
                disabled={
                  !saveTestCaseTitle.trim() ||
                  (saveScenarioOption === 'existing' && !saveSelectedScenarioId) ||
                  (saveScenarioOption === 'new' && !saveNewScenarioTitle.trim())
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Confirm & Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Model Settings Modal */}
      {showAiSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-xl border max-w-md w-full shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">AI Engine Configuration</h3>
              </div>
              <button
                onClick={() => setShowAiSettingsModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  AI Model Provider
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) =>
                    setAiProvider(e.target.value as 'builtin' | 'gemini' | 'openai' | 'groq')
                  }
                  className="w-full h-10 px-3 py-2 bg-background border rounded-md text-sm font-medium focus:ring-2 focus:ring-primary"
                >
                  <option value="builtin">
                    ⚡ Built-in Pharmacovigilance Dynamic AI (Instant, No API Key Required)
                  </option>
                  <option value="gemini">🤖 Google Gemini (Gemini 2.0 Flash / 1.5 Flash)</option>
                  <option value="openai">🧠 OpenAI (GPT-4o-mini)</option>
                  <option value="groq">⚡ Groq (Llama 3.3 70B Versatile)</option>
                </select>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                  {aiProvider === 'builtin'
                    ? 'The Built-in engine uses clinical algorithms tailored for Oracle Argus Safety & LSMV without requiring external API keys.'
                    : `Provide your API key to enable live generation using cloud AI directly in the browser.`}
                </p>
              </div>

              {aiProvider !== 'builtin' && (
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {aiProvider.toUpperCase()} API Key <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder={`Paste your ${aiProvider.toUpperCase()} API Key here...`}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Keys are stored securely in your browser&apos;s localStorage and are never sent to third-party tracking servers.
                  </p>
                </div>
              )}

              {aiKeySavedNotice && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  AI Settings Saved Successfully!
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setShowAiSettingsModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveAiConfig}>Save Settings</Button>
            </div>
          </div>
        </div>
      )}
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
      className="p-4 border rounded-lg cursor-pointer hover:shadow-lg hover:border-primary transition-all flex flex-col justify-between group bg-card"
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
