'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testCasesApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  CheckSquare,
  Trash2,
  FileDown,
  Plus,
  ArrowUp,
  ArrowDown,
  Save,
  Download,
} from 'lucide-react';
import Link from 'next/link';

export default function TestCaseDetailPage() {
  const params = useParams();
  const testCaseId = parseInt(params.id as string);
  const [editing, setEditing] = useState(false);
  const [stepForm, setStepForm] = useState({ description: '', expectedResult: '' });
  const queryClient = useQueryClient();

  const { data: testCase, isLoading } = useQuery({
    queryKey: ['test-case', testCaseId],
    queryFn: () => testCasesApi.getById(testCaseId).then((res) => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      testCasesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-case', testCaseId] });
      setEditing(false);
    },
  });

  const addStepMutation = useMutation({
    mutationFn: ({ id, step }: { id: number; step: { description: string; expectedResult: string } }) =>
      testCasesApi.addStep(id, step),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-case', testCaseId] });
      setStepForm({ description: '', expectedResult: '' });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: ({ testCaseId, stepId }: { testCaseId: number; stepId: number }) =>
      testCasesApi.deleteStep(testCaseId, stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-case', testCaseId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => testCasesApi.delete(testCaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] });
      window.history.back();
    },
  });

  const handleExport = (format: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/export/test-cases/${testCaseId}/${format}`, '_blank');
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    addStepMutation.mutate({ id: testCaseId, step: stepForm });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!testCase) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Test case not found</h2>
        <Link href="/test-cases">
          <Button className="mt-4">Back to Test Cases</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
            <CheckSquare className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{testCase.title}</h1>
            <p className="text-muted-foreground">
              {testCase.scenario?.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              testCase.status === 'approved'
                ? 'success'
                : testCase.status === 'in_review'
                ? 'warning'
                : testCase.status === 'deprecated'
                ? 'destructive'
                : 'secondary'
            }
          >
            {testCase.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate()}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Test Case Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test Case Details</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div className="space-y-4">
              <Input
                value={testCase.title}
                onChange={(e) =>
                  updateMutation.mutate({ id: testCaseId, data: { title: e.target.value } })
                }
              />
              <Textarea
                value={testCase.description || ''}
                onChange={(e) =>
                  updateMutation.mutate({ id: testCaseId, data: { description: e.target.value } })
                }
                placeholder="Description"
                rows={3}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Textarea
                  value={testCase.preConditions || ''}
                  onChange={(e) =>
                    updateMutation.mutate({ id: testCaseId, data: { preConditions: e.target.value } })
                  }
                  placeholder="Pre-conditions"
                  rows={2}
                />
                <Textarea
                  value={testCase.postConditions || ''}
                  onChange={(e) =>
                    updateMutation.mutate({ id: testCaseId, data: { postConditions: e.target.value } })
                  }
                  placeholder="Post-conditions"
                  rows={2}
                />
              </div>
            </div>
          ) : (
            <>
              {testCase.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{testCase.description}</p>
                </div>
              )}
              {testCase.preConditions && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Pre-Conditions</h4>
                  <p className="text-muted-foreground">{testCase.preConditions}</p>
                </div>
              )}
              {testCase.postConditions && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Post-Conditions</h4>
                  <p className="text-muted-foreground">{testCase.postConditions}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Test Steps</CardTitle>
          <CardDescription>{testCase.steps?.length || 0} steps defined</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Step Form */}
          <form onSubmit={handleAddStep} className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Step Description</label>
                <Input
                  value={stepForm.description}
                  onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                  placeholder="What action to perform..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expected Result</label>
                <Input
                  value={stepForm.expectedResult}
                  onChange={(e) => setStepForm({ ...stepForm, expectedResult: e.target.value })}
                  placeholder="What should happen..."
                  required
                />
              </div>
            </div>
            <Button type="submit" size="sm" disabled={addStepMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </form>

          {/* Steps List */}
          {testCase.steps && testCase.steps.length > 0 ? (
            <div className="space-y-3">
              {testCase.steps.map((step: any, index: number) => (
                <div
                  key={step.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{step.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Expected:</span> {step.expectedResult}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteStepMutation.mutate({ testCaseId, stepId: step.id })}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No steps added yet. Add steps above to define your test procedure.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
