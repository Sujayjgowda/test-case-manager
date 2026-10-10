import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Zap,
  FileText,
  Shield,
  CheckCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <nav className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl shadow-lg shadow-indigo-200">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent">
              Test Case Manager
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" className="font-medium">
                Dashboard
              </Button>
            </Link>
            <Link href="/test-steps-generator">
              <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-200">
                Generate Test Scripts
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by SambaNova AI
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            Generate Test Scripts{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              Automatically
            </span>{' '}
            with AI
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Transform your pharmacovigilance test scenarios into comprehensive, regulatory-compliant
            test scripts. Built for{' '}
            <span className="font-semibold text-gray-700">Oracle Argus Safety</span> and{' '}
            <span className="font-semibold text-gray-700">LSMV</span>.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/test-steps-generator">
              <Button
                size="lg"
                className="h-13 px-8 text-base font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-xl shadow-indigo-200/50"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Generating
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-13 px-8 text-base font-bold">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
          Everything You Need for Pharma Testing
        </h2>
        <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
          SambaNova AI generates domain-specific test scripts with regulatory compliance built in.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={Bot}
            title="SambaNova AI Engine"
            description="Generate complete test scripts using SambaNova's LLama 3.3 70B model — no manual writing needed"
            gradient="from-indigo-500 to-blue-500"
          />
          <FeatureCard
            icon={Shield}
            title="Oracle Argus Safety"
            description="Book-in, MedDRA coding, Case Lock, 21 CFR Part 11, E2B(R3) regulatory submissions"
            gradient="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            icon={BookOpen}
            title="LSMV Literature"
            description="PubMed/Embase ingestion, 4-criteria ICSR triage, PDF review, QC audit & safety DB export"
            gradient="from-emerald-500 to-teal-500"
          />
          <FeatureCard
            icon={FileText}
            title="Export Anywhere"
            description="Download test scripts as CSV, Markdown, or JSON. Copy to clipboard with one click"
            gradient="from-violet-500 to-purple-500"
          />
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-14 text-gray-900">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
          <StepCard
            number="1"
            title="Describe Your Scenario"
            description="Enter your test scenario details or pick a quick template for Oracle Argus Safety or LSMV."
          />
          <StepCard
            number="2"
            title="AI Generates the Script"
            description="SambaNova AI creates 10-15 detailed, regulatory-compliant test steps with expected results."
          />
          <StepCard
            number="3"
            title="Export & Execute"
            description="Copy, export to CSV/Markdown/JSON, or save to your project for tracking and management."
          />
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 rounded-3xl p-14 text-center text-white shadow-2xl shadow-indigo-200/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Ready to automate your test scripts?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Stop writing test cases manually. Let SambaNova AI generate comprehensive,
              pharma-compliant test scripts in seconds.
            </p>
            <Link href="/test-steps-generator">
              <Button
                size="lg"
                variant="secondary"
                className="h-13 px-10 text-base font-bold shadow-xl"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
      <div
        className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl flex items-center justify-center font-extrabold text-xl mx-auto mb-4 shadow-lg shadow-indigo-200/50">
        {number}
      </div>
      <h3 className="text-lg font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
