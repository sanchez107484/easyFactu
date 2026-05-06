import { brandConfig } from '@easyfactura/brand-config';

interface LegalPageWrapperProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageWrapper({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalPageWrapperProps) {
  return (
    <main className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 border-b border-neutral-200 pb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-600">
            {brandConfig.app.name} · Información legal
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {title}
          </h1>
          {subtitle && <p className="mt-3 text-base text-neutral-500">{subtitle}</p>}
          <p className="mt-4 text-sm text-neutral-400">Última actualización: {lastUpdated}</p>
        </div>

        <div className="space-y-10">{children}</div>
      </div>
    </main>
  );
}
