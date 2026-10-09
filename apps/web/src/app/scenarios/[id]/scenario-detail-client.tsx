'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, scenariosApi, testCasesApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  Zap,
  CheckSquare,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function ScenarioDetailClient() {
  const params = useParams();
  const scenarioId = parseInt(params.id as string);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const queryClient = useQueryClient();

  const { data: scenario, isLoading } = useQuery({
    queryKey: ['scenario', scenarioId],
    queryFn: () => scenariosApi.getById(scenarioId).then((res) => res.data),
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { prompt?: string; options?: Record<string, unknown> }) => {
      const res = await scenariosApi.generateTestCases(scenarioId, data);
      const jobId = res.data?.jobId;
      if (jobId) {
        // Poll until completion or timeout
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          try {
            const statusRes = await api.get(`/ai/generation/${jobId}`);
            if (statusRes.data?.status === 'completed' || statusRes.data?.status === 'failed') {
              break;
            }
          } catch {
            // Ignore polling errors
          }
        }
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenario', scenarioId] });
      setShowAiPanel(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => scenariosApi.delete(scenarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      window.history.back();
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      prompt: generationPrompt || undefined,
      options: {
        includeNegativeCases: true,
        includeEdgeCases: true,
        numberOfCases: 10,
      },
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!scenario) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Scenario not found</h2>
        <Link href="/scenarios">
          <Button className="mt-4">Back to Scenarios</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scenario Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{scenario.title}</h1>
            <p className="text-muted-foreground">
              {scenario.module?.name} • {scenario.module?.project?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              scenario.priority === 'high' || scenario.priority === 'critical'
                ? 'destructive'
                : scenario.priority === 'medium'
                ? 'warning'
                : 'secondary'
            }
          >
            {scenario.priority}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setShowAiPanel(!showAiPanel)}>
            <Zap className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate()}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Scenario Details */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scenario.description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">{scenario.description}</p>
            </div>
          )}
          {scenario.preconditions && (
            <div>
              <h4 className="text-sm font-medium mb-2">Preconditions</h4>
              <p className="text-muted-foreground">{scenario.preconditions}</p>
            </div>
          )}
          {scenario.expectedOutcome && (
            <div>
              <h4 className="text-sm font-medium mb-2">Expected Outcome</h4>
              <p className="text-muted-foreground">{scenario.expectedOutcome}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Generation Panel */}
      {showAiPanel && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Test Case Generation
            </CardTitle>
            <CardDescription>
              Generate comprehensive test cases automatically using AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Instructions (optional)
              </label>
              <Textarea
                value={generationPrompt}
                onChange={(e) => setGenerationPrompt(e.target.value)}
                placeholder="e.g., Focus on edge cases and error scenarios..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Test Cases
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                This will create ~10 test cases based on the scenario
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Cases List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test Cases</CardTitle>
              <CardDescription>
                {scenario.testCases?.length || 0} test cases in this scenario
              </CardDescription>
            </div>
            <Link href={`/test-cases/new?scenarioId=${scenarioId}`}>
              <Button size="sm">
                <CheckSquare className="w-4 h-4 mr-2" />
                New Test Case
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {scenario.testCases && scenario.testCases.length > 0 ? (
            <div className="space-y-3">
              {scenario.testCases.map((tc: any) => (
                <div
                  key={tc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tc.aiGenerated ? 'bg-purple-100' : 'bg-blue-100'
                      }`}
                    >
                      <CheckSquare
                        className={`w-5 h-5 ${
                          tc.aiGenerated ? 'text-purple-600' : 'text-blue-600'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{tc.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tc._count?.steps || 0} steps{' '}
                        {tc.aiGenerated && (
                          <span className="ml-2 text-purple-600">• AI Generated</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Link href={`/test-cases/${tc.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No test cases yet</p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={() => setShowAiPanel(true)}>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate with AI
                </Button>
                <Link href={`/test-cases/new?scenarioId=${scenarioId}`}>
                  <Button>Create Manually</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
