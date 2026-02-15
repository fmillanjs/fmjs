import type { Metadata } from 'next';
import { CaseStudySection } from '@/components/portfolio/case-study-section';

export const metadata: Metadata = { title: 'TeamFlow Case Study' };

export default function TeamFlowCaseStudy() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-4 text-4xl font-bold">TeamFlow</h1>
      <p className="mb-12 text-xl text-gray-600 dark:text-gray-400">A production-ready work management SaaS</p>
      <CaseStudySection title="Overview">
        <p>TeamFlow demonstrates full-stack engineering skills.</p>
      </CaseStudySection>
    </div>
  );
}
