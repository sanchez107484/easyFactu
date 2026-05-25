import Link from 'next/link';
import { Users, Package, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const IMPORT_OPTIONS = [
  {
    href: '/dashboard/importar/clientes',
    icon: Users,
    title: 'Clientes',
    description:
      'Importa tu directorio de clientes. Descarga la plantilla Excel, rellénala con los datos de tus clientes y súbela para importarlos automáticamente.',
    available: true,
    color: 'bg-blue-50 dark:bg-blue-950/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    href: '/dashboard/importar/productos',
    icon: Package,
    title: 'Productos y servicios',
    description:
      'Importa tu catálogo de productos y servicios. Descarga la plantilla Excel, rellénala con tu catálogo y súbela para importarlo automáticamente.',
    available: true,
    color: 'bg-emerald-50 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    href: '#',
    icon: FileText,
    title: 'Facturas',
    description: 'Próximamente podrás importar facturas históricas emitidas desde otro programa.',
    available: false,
    color: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
];

export default function ImportarPage() {
  return (
    <div className="space-y-8 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar datos</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Selecciona qué datos quieres importar. Descarga la plantilla Excel, rellénala con tus
          datos y súbela para que los importemos automáticamente.
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-xl border bg-muted/40 p-5">
        <h2 className="text-sm font-semibold mb-3">¿Cómo funciona?</h2>
        <ol className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          {[
            { step: '1', text: 'Descarga la plantilla Excel preparada para ti' },
            { step: '2', text: 'Rellena tus datos respetando el formato de la plantilla' },
            { step: '3', text: 'Sube el archivo y revisa la vista previa' },
            { step: '4', text: 'Confirma la importación de las filas válidas' },
          ].map(({ step, text }) => (
            <li key={step} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {step}
              </span>
              {text}
            </li>
          ))}
        </ol>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {IMPORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const card = (
            <Card
              className={cn(
                'h-full transition-all duration-200',
                option.available
                  ? 'hover:shadow-md hover:border-primary/50 group-hover:border-primary/50'
                  : 'opacity-55 cursor-not-allowed',
              )}
            >
              <CardContent className="flex flex-col gap-4 p-6 h-full">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      option.color,
                    )}
                  >
                    <Icon className={cn('h-5 w-5', option.iconColor)} />
                  </div>
                  {option.available ? (
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Próximamente
                    </Badge>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{option.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                </div>
              </CardContent>
            </Card>
          );

          if (!option.available) return <div key={option.title}>{card}</div>;

          return (
            <Link key={option.title} href={option.href} className="group">
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
