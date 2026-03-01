import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable empty/zero-state card for lists and tables.
 *
 * Usage:
 *   <EmptyState
 *     icon={FileText}
 *     title="Sin facturas"
 *     description="Crea tu primera factura para empezar."
 *     action={<Link href="..."><Button>Crear</Button></Link>}
 *   />
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
        )}
        {action && <div>{action}</div>}
      </CardContent>
    </Card>
  );
}

interface InlineEmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  colSpan?: number;
}

/**
 * Compact empty state for use as a <tr> inside a <tbody>.
 */
export function TableEmptyRow({
  icon: Icon,
  title,
  description,
  action,
  colSpan = 6,
}: InlineEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-14 px-6 text-center">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{title}</p>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  );
}
