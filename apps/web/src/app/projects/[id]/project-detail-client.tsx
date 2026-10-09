'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, modulesApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FolderOpen,
  Plus,
  Trash2,
  ChevronRight,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ProjectDetailClient() {
  const params = useParams();
  const projectId = parseInt(params.id as string);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleData, setModuleData] = useState({ name: '', description: '' });
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId).then((res) => res.data),
  });

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['modules', projectId],
    queryFn: () => projectsApi.getModules(projectId).then((res) => res.data),
  });

  const createModuleMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      projectsApi.createModule(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', projectId] });
      setShowModuleForm(false);
      setModuleData({ name: '', description: '' });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id: number) => modulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', projectId] });
    },
  });

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    createModuleMutation.mutate(moduleData);
  };

  if (projectLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Link href="/projects">
          <Button className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.key}</p>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
        </div>
        <Badge
          variant={
            project.status === 'active'
              ? 'success'
              : project.status === 'archived'
              ? 'secondary'
              : 'outline'
          }
        >
          {project.status}
        </Badge>
      </div>

      {/* Modules Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Modules</CardTitle>
              <CardDescription>Organize your scenarios into modules</CardDescription>
            </div>
            <Button onClick={() => setShowModuleForm(!showModuleForm)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showModuleForm && (
            <form onSubmit={handleCreateModule} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Module Name</label>
                  <Input
                    value={moduleData.name}
                    onChange={(e) =>
                      setModuleData({ ...moduleData, name: e.target.value })
                    }
                    placeholder="e.g., Authentication"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input
                    value={moduleData.description}
                    onChange={(e) =>
                      setModuleData({ ...moduleData, description: e.target.value })
                    }
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" disabled={createModuleMutation.isPending}>
                {createModuleMutation.isPending ? 'Creating...' : 'Create Module'}
              </Button>
            </form>
          )}

          {modulesLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading modules...</div>
          ) : modules && modules.length > 0 ? (
            <div className="space-y-3">
              {modules.map((module: any) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{module.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {module._count?.scenarios || 0} scenarios
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/scenarios?moduleId=${module.id}`}>
                      <Button variant="ghost" size="sm">
                        View Scenarios
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteModuleMutation.mutate(module.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No modules yet</p>
              <Button
                variant="link"
                onClick={() => setShowModuleForm(true)}
                className="mt-2"
              >
                Create your first module
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
