'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { scenariosApi } from '@/lib/api-client';
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
  steps: GeneratedStep[];
}

export default function TestStepsGeneratorPage() {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate-test-steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioTitle,
          scenarioDescription,
          preconditions,
          expectedOutcome,
          additionalInstructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Generation failed (${response.status})`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setRetryCountdown(null);
      // The /ai/generate-test-steps endpoint returns { title, description, preConditions, postConditions, steps }
      if (data.steps && Array.isArray(data.steps)) {
        setGeneratedResult({
          title: data.title || scenarioTitle,
          description: data.description || scenarioDescription,
          preConditions: data.preConditions || preconditions,
          postConditions: data.postConditions || expectedOutcome,
          steps: data.steps,
        });
      } else if (data.testCases && data.testCases.length > 0) {
        setGeneratedResult(data.testCases[0]);
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
      ...generatedResult.steps.map((s) => [s.stepNumber, s.description, s.expectedResult]),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Test Steps Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate detailed test steps from your test scenarios using AI
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
              Enter your test scenario details or select an existing scenario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Scenario Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={scenarioTitle}
                onChange={(e) => setScenarioTitle(e.target.value)}
                placeholder="e.g., Create Blinded Case for Clinical Trial AE"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Scenario Description
              </label>
              <Textarea
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                placeholder="Describe what this scenario tests..."
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
                placeholder="What must be true before this test (e.g., User is logged in, System is configured)..."
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
                placeholder="What should happen after the test is completed..."
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
                placeholder="e.g., Include 10-15 detailed steps, Focus on data entry validation, Include error scenarios..."
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
                  Generating Test Steps...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Test Steps with AI
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Takes about 30-60 seconds to generate comprehensive test steps
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
                <div className="flex items-center justify-between">
                  <Badge variant="success">
                    {generatedResult.steps.length} Steps Generated
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopySteps}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
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
          <CardTitle>Quick Templates</CardTitle>
          <CardDescription>
            Start with a pre-defined template and customize it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <TemplateCard
              title="Blinded Case Creation"
              description="Generate steps for creating a blinded clinical trial case"
              onClick={() => {
                setScenarioTitle('Create Blinded Case for Clinical Trial AE');
                setScenarioDescription(
                  'Verify that a user with Blinded Case Processor role can create a case where treatment information is hidden'
                );
                setPreconditions(
                  '1. User is logged in with Blinded Case Processor role\n2. Study is configured for blind maintenance\n3. Patient meets eligibility for AE reporting'
                );
                setExpectedOutcome(
                  'Case is saved with blinded status; Treatment field shows masked value'
                );
                setAdditionalInstructions(
                  'Include 10-12 detailed steps covering navigation, data entry, product section, and verification. Include step to compare blinded vs unblinded view.'
                );
              }}
            />
            <TemplateCard
              title="Emergency Unblinding"
              description="Generate steps for emergency unblinding workflow"
              onClick={() => {
                setScenarioTitle('Emergency Unblinding Request Workflow');
                setScenarioDescription(
                  'Verify emergency unblinding process with proper authorization and documentation'
                );
                setPreconditions(
                  '1. Blinded SAE case exists\n2. Investigator requests emergency unblinding\n3. User has unblinding authorization'
                );
                setExpectedOutcome(
                  'Unblinding performed with audit trail; Notification sent; SAE timeline triggered'
                );
                setAdditionalInstructions(
                  'Include 10 steps covering request initiation, authorization, unblinding action, audit trail verification, and notification confirmation.'
                );
              }}
            />
            <TemplateCard
              title="Regulatory Submission"
              description="Generate steps for E2B submission to health authority"
              onClick={() => {
                setScenarioTitle('Submit E2B R3 to FDA FAERS Gateway');
                setScenarioDescription(
                  'Verify electronic submission of ICH E2B R3 message to FDA FAERS'
                );
                setPreconditions(
                  '1. Case is ready for FDA submission\n2. Gateway credentials configured\n3. Case meets FDA reporting criteria'
                );
                setExpectedOutcome(
                  'Message transmitted successfully; ACK received and stored in case'
                );
                setAdditionalInstructions(
                  'Include 8-10 steps covering case selection, submission initiation, gateway communication, ACK receipt, and verification.'
                );
              }}
            />
            <TemplateCard
              title="Medical Review"
              description="Generate steps for medical assessment workflow"
              onClick={() => {
                setScenarioTitle('Perform Medical Review of AE Case');
                setScenarioDescription(
                  'Verify medical reviewer can evaluate case completeness and accuracy'
                );
                setPreconditions(
                  '1. Case is in Medical Review status\n2. User has Medical Reviewer role\n3. All data entry is complete'
                );
                setExpectedOutcome(
                  'Medical reviewer can approve, reject, or request additional information'
                );
                setAdditionalInstructions(
                  'Include steps for case review, causality assessment, seriousness determination, and approval workflow.'
                );
              }}
            />
            <TemplateCard
              title="Duplicate Detection"
              description="Generate steps for duplicate case checking"
              onClick={() => {
                setScenarioTitle('Validate Duplicate Case Detection');
                setScenarioDescription(
                  'Verify system identifies potential duplicate cases during intake'
                );
                setPreconditions(
                  'Similar case already exists in database with matching patient and event details'
                );
                setExpectedOutcome(
                  'System displays potential duplicates with match score for reviewer assessment'
                );
                setAdditionalInstructions(
                  'Include steps for case creation, duplicate check trigger, match review, and decision (link or reject).'
                );
              }}
            />
            <TemplateCard
              title="Safety Report Generation"
              description="Generate steps for generating blinded safety reports"
              onClick={() => {
                setScenarioTitle('Generate Blinded Safety Report');
                setScenarioDescription(
                  'Verify generation of safety report with treatment groups masked'
                );
                setPreconditions(
                  '1. Blinded cases exist in study\n2. User has Blinded Reporter role\n3. Report template configured for blinded output'
                );
                setExpectedOutcome(
                  'Report shows Treatment A/B without revealing actual allocation'
                );
                setAdditionalInstructions(
                  'Include 10 steps covering report selection, parameter configuration, generation, review, and blinding verification.'
                );
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="p-4 border rounded-lg cursor-pointer hover:shadow-lg hover:border-primary transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <Plus className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
