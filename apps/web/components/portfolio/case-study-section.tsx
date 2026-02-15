interface CaseStudySectionProps {
  title: string;
  children: React.ReactNode;
}

export function CaseStudySection({ title, children }: CaseStudySectionProps) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
