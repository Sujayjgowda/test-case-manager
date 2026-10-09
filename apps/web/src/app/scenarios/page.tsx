'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scenariosApi, modulesApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  Plus,
  Trash2,
  Zap,
  Loader2,
  ChevronRight,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ScenariosContent() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('moduleId');
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    moduleId: moduleId ? parseInt(moduleId) : undefined,
    title: '',
    description: '',
    priority: 'medium',
    preconditions: '',
    expectedOutcome: '',
  });
  const queryClient = useQueryClient();

  const { data: scenarios, isLoading } = useQuery({
    queryKey: ['scenarios', moduleId],
    queryFn: () =>
      scenariosApi.getAll(moduleId ? { moduleId: parseInt(moduleId) } : {}).then((res) => res.data),
  });

  const { data: modules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => modulesApi.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (!data.moduleId) throw new Error('Module is required');
      return scenariosApi.create({ ...data, moduleId: data.moduleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      setShowCreateForm(false);
      setFormData({
        moduleId: undefined,
        title: '',
        description: '',
        priority: 'medium',
        preconditions: '',
        expectedOutcome: '',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => scenariosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });

  const generateMutation = useMutation({
    mutationFn: (id: number) =>
      scenariosApi.generateTestCases(id, {
        options: {
          includeNegativeCases: true,
          includeEdgeCases: true,
          numberOfCases: 10,
        },
      }),
    onSuccess: (data, scenarioId) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      // Navigate to scenario detail page after generation starts
      router.push(`/scenarios/${scenarioId}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.moduleId) return;
    createMutation.mutate(formData);
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return 'destructive';
      case 'medium':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scenarios</h1>
          <p className="text-muted-foreground mt-1">Define test scenarios for your modules</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {showCreateForm ? 'Cancel' : 'New Scenario'}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Scenario</CardTitle>
            <CardDescription>Define a test scenario to generate test cases from</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Module</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.moduleId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, moduleId: parseInt(e.target.value) || undefined })
                    }
                    required
                  >
                    <option value="">Select a module</option>
                    {modules?.data?.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., User Login with Valid Credentials"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this scenario tests..."
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Preconditions</label>
                  <Textarea
                    value={formData.preconditions}
                    onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                    placeholder="What must be true before this test..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Expected Outcome</label>
                  <Textarea
                    value={formData.expectedOutcome}
                    onChange={(e) => setFormData({ ...formData, expectedOutcome: e.target.value })}
                    placeholder="What should happen after the test..."
                    rows={2}
                  />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Scenario'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : scenarios?.data && scenarios.data.length > 0 ? (
          scenarios.data.map((scenario: any) => (
            <Card key={scenario.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{scenario.title}</CardTitle>
                      <Badge variant={getPriorityVariant(scenario.priority)}>
                        {scenario.priority}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <ClipboardList className="w-3 h-3" />
                      {scenario.module?.name}
                      <ChevronRight className="w-3 h-3" />
                      {scenario._count?.testCases || 0} test cases
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {scenario.description && (
                  <p className="text-sm text-muted-foreground mb-4">{scenario.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link href={`/scenarios/${scenario.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateMutation.mutate(scenario.id)}
                      disabled={generateMutation.isPending}
                    >
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
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(scenario.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No scenarios yet</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first scenario
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ScenariosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading scenarios...</div>}>
      <ScenariosContent />
    </Suspense>
  );
}
