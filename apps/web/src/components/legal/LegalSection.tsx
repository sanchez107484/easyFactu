interface LegalSectionProps {
  number: string;
  heading: string;
  children: React.ReactNode;
}

export function LegalSection({ number, heading, children }: LegalSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        <span className="mr-2 text-blue-600">{number}</span>
        {heading}
      </h2>
      <div className="space-y-3 text-sm leading-7 text-slate-600">{children}</div>
    </section>
  );
}
