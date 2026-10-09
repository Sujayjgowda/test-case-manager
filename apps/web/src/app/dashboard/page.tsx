'use client';

import { useQuery } from '@tanstack/react-query';
import { projectsApi, scenariosApi, testCasesApi } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FolderOpen,
  ClipboardList,
  CheckSquare,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll().then((res) => res.data),
  });

  const { data: scenarios } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => scenariosApi.getAll().then((res) => res.data),
  });

  const { data: testCases } = useQuery({
    queryKey: ['test-cases'],
    queryFn: () => testCasesApi.getAll().then((res) => res.data),
  });

  const projectList = Array.isArray(projects) ? projects : projects?.data || [];
  const scenarioList = Array.isArray(scenarios) ? scenarios : scenarios?.data || [];
  const testCaseList = Array.isArray(testCases) ? testCases : testCases?.data || [];
  const aiGeneratedCount = testCaseList.filter((tc: any) => tc.aiGenerated).length;

  const stats = [
    {
      label: 'Total Projects',
      value: projectList.length,
      icon: FolderOpen,
      color: 'text-blue-500',
    },
    {
      label: 'Active Scenarios',
      value: scenarioList.length,
      icon: ClipboardList,
      color: 'text-green-500',
    },
    {
      label: 'Test Cases',
      value: testCaseList.length,
      icon: CheckSquare,
      color: 'text-purple-500',
    },
    {
      label: 'AI Generated',
      value: aiGeneratedCount,
      icon: TrendingUp,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your testing activities</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your latest projects and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : projectList.length > 0 ? (
            <div className="space-y-4">
              {projectList.map((project: any) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FolderOpen className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
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
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Link href="/projects/new">
                <Button>Create your first project</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/scenarios/new">
            <CardHeader>
              <ClipboardList className="w-8 h-8 text-green-500 mb-2" />
              <CardTitle>New Scenario</CardTitle>
              <CardDescription>Create a new test scenario</CardDescription>
            </CardHeader>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/test-cases/new">
            <CardHeader>
              <CheckSquare className="w-8 h-8 text-purple-500 mb-2" />
              <CardTitle>New Test Case</CardTitle>
              <CardDescription>Manually create a test case</CardDescription>
            </CardHeader>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/projects">
            <CardHeader>
              <FolderOpen className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle>Browse Projects</CardTitle>
              <CardDescription>View all your projects</CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
