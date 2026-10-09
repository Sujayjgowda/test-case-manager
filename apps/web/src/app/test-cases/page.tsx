'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testCasesApi, scenariosApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Trash2, FileDown, Search } from 'lucide-react';
import Link from 'next/link';

export default function TestCasesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    scenarioId: undefined as number | undefined,
    title: '',
    description: '',
    priority: 'medium',
    preConditions: '',
    postConditions: '',
  });
  const queryClient = useQueryClient();

  const { data: testCases, isLoading } = useQuery({
    queryKey: ['test-cases'],
    queryFn: () => testCasesApi.getAll().then((res) => res.data),
  });

  const { data: scenarios } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => scenariosApi.getAll({ limit: 100 }).then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (!data.scenarioId) throw new Error('Scenario is required');
      return testCasesApi.create({ ...data, scenarioId: data.scenarioId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] });
      setShowCreateForm(false);
      setFormData({
        scenarioId: undefined,
        title: '',
        description: '',
        priority: 'medium',
        preConditions: '',
        postConditions: '',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => testCasesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.scenarioId) return;
    createMutation.mutate(formData);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'in_review':
        return 'warning';
      case 'deprecated':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const filteredCases = testCases?.data?.filter((tc: any) =>
    tc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Cases</h1>
          <p className="text-muted-foreground mt-1">Manage and organize your test cases</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {showCreateForm ? 'Cancel' : 'New Test Case'}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Test Case</CardTitle>
            <CardDescription>Add a test case manually or link to a scenario</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Scenario</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.scenarioId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, scenarioId: parseInt(e.target.value) || undefined })
                  }
                  required
                >
                  <option value="">Select a scenario</option>
                  {scenarios?.data?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Verify login with valid credentials"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this test case validates..."
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Pre-Conditions</label>
                  <Textarea
                    value={formData.preConditions}
                    onChange={(e) => setFormData({ ...formData, preConditions: e.target.value })}
                    placeholder="What must be true before this test..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Post-Conditions</label>
                  <Textarea
                    value={formData.postConditions}
                    onChange={(e) => setFormData({ ...formData, postConditions: e.target.value })}
                    placeholder="Expected state after test..."
                    rows={2}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Test Case'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search test cases..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredCases && filteredCases.length > 0 ? (
          filteredCases.map((tc: any) => (
            <Card key={tc.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{tc.title}</CardTitle>
                      <Badge variant={getStatusVariant(tc.status)}>{tc.status}</Badge>
                      {tc.aiGenerated && (
                        <Badge variant="outline" className="text-purple-600 border-purple-600">
                          AI Generated
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <CheckSquare className="w-3 h-3" />
                      {tc.scenario?.title}
                      <span>•</span>
                      {tc._count?.steps || 0} steps
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tc.description && (
                  <p className="text-sm text-muted-foreground mb-4">{tc.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link href={`/test-cases/${tc.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                      <FileDown className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(tc.id)}
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
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No test cases yet</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first test case
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
