import ScenarioDetailClient from './scenario-detail-client';

export function generateStaticParams() {
  return Array.from({ length: 60 }, (_, i) => ({ id: String(i + 1) }));
}

export default function Page() {
  return <ScenarioDetailClient />;
}
