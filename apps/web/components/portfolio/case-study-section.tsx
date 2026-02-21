import { AnimateIn } from './animate-in';
import { SectionLabel } from './section-label';

interface CaseStudySectionProps {
  title: string;
  children: React.ReactNode;
}

export function CaseStudySection({ title, children }: CaseStudySectionProps) {
  return (
    <section className="mb-12">
      <AnimateIn>
        <SectionLabel label={title} />
        <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      </AnimateIn>
      <div>{children}</div>
    </section>
  );
}
