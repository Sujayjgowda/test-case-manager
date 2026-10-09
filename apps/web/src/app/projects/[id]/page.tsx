import ProjectDetailClient from './project-detail-client';

export function generateStaticParams() {
  return Array.from({ length: 30 }, (_, i) => ({ id: String(i + 1) }));
}

export default function Page() {
  return <ProjectDetailClient />;
}
