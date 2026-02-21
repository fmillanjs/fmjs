interface SectionLabelProps {
  label: string;
}

export function SectionLabel({ label }: SectionLabelProps) {
  return (
    <div
      className="font-mono text-xs text-[var(--matrix-green)] tracking-widest uppercase mb-2"
      aria-hidden="true"
    >
      {'>'} {label.toUpperCase().replace(/\s+/g, '_')}
    </div>
  );
}
