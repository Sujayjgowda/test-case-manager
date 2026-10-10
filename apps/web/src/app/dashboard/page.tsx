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
  Bot,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  const { data: scenarios } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => scenariosApi.list(),
  });

  const { data: testCases } = useQuery({
    queryKey: ['test-cases'],
    queryFn: () => testCasesApi.list(),
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
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Scenarios',
      value: scenarioList.length,
      icon: ClipboardList,
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Test Cases',
      value: testCaseList.length,
      icon: CheckSquare,
      gradient: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-50',
    },
    {
      label: 'AI Generated',
      value: aiGeneratedCount,
      icon: Bot,
      gradient: 'from-indigo-500 to-blue-500',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your pharmacovigilance testing</p>
        </div>
        <Link href="/test-steps-generator">
          <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-200/50 font-bold">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Test Script
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-0 shadow-md ring-1 ring-gray-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{stat.label}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-4 h-4 bg-gradient-to-r ${stat.gradient} bg-clip-text`} style={{ color: 'transparent', WebkitBackgroundClip: 'text', backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Projects */}
      <Card className="border-0 shadow-md ring-1 ring-gray-100">
        <CardHeader>
          <CardTitle className="text-lg">Recent Projects</CardTitle>
          <CardDescription>Your latest pharmacovigilance test projects</CardDescription>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="text-center py-8 text-gray-400">Loading projects...</div>
          ) : projectList.length > 0 ? (
            <div className="space-y-3">
              {projectList.slice(0, 5).map((project: any) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-lg">
                      <FolderOpen className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{project.name}</h3>
                      <p className="text-xs text-gray-400">{project.key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        project.status === 'active'
                          ? 'success'
                          : project.status === 'archived'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="text-[10px]"
                    >
                      {project.status}
                    </Badge>
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-2xl inline-block mb-4">
                <FolderOpen className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium mb-1">No projects yet</p>
              <p className="text-xs text-gray-400 mb-4">
                Create your first project to start organizing test scenarios
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-5 md:grid-cols-3">
        <Link href="/test-steps-generator" className="group">
          <Card className="border-0 shadow-md ring-1 ring-gray-100 hover:shadow-xl hover:ring-indigo-200 transition-all h-full">
            <CardHeader>
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl w-fit mb-2 shadow-lg shadow-indigo-200/40 group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-base">AI Test Script Generator</CardTitle>
              <CardDescription className="text-xs">
                Generate complete test scripts with SambaNova AI
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/scenarios" className="group">
          <Card className="border-0 shadow-md ring-1 ring-gray-100 hover:shadow-xl hover:ring-emerald-200 transition-all h-full">
            <CardHeader>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl w-fit mb-2 shadow-lg shadow-emerald-200/40 group-hover:scale-110 transition-transform">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-base">View Scenarios</CardTitle>
              <CardDescription className="text-xs">
                Browse and manage test scenarios
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/test-cases" className="group">
          <Card className="border-0 shadow-md ring-1 ring-gray-100 hover:shadow-xl hover:ring-violet-200 transition-all h-full">
            <CardHeader>
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl w-fit mb-2 shadow-lg shadow-violet-200/40 group-hover:scale-110 transition-transform">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-base">Test Cases</CardTitle>
              <CardDescription className="text-xs">
                View all test cases and AI-generated scripts
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
