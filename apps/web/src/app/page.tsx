import Link from 'next/link';
import { ArrowRight, CheckSquare, Zap, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">Test Case Manager</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/dashboard">
              <Button>
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Automate Test Case Writing with{' '}
            <span className="text-primary">AI-Powered</span> Intelligence
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform your test scenarios into comprehensive test cases automatically.
            Save time, improve coverage, and maintain consistency across your testing efforts.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={Zap}
            title="AI Generation"
            description="Automatically generate test cases from scenarios using advanced AI"
          />
          <FeatureCard
            icon={FileText}
            title="Scenario Management"
            description="Organize and manage test scenarios by projects and modules"
          />
          <FeatureCard
            icon={CheckSquare}
            title="Test Case Tracking"
            description="Track test cases through draft, review, and approval workflows"
          />
          <FeatureCard
            icon={Shield}
            title="Multiple Exports"
            description="Export to JSON, Markdown, PDF, or Excel formats"
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="bg-primary rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your testing?</h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Start automating your test case writing today and save hours of manual work.
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary">
              Get Started Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
