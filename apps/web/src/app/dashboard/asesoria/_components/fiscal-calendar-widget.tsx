'use client';

import { CalendarDays, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FiscalDeadline {
  model: string;
  description: string;
  dueDate: Date;
  type: 'quarterly' | 'annual';
}

function getUpcomingDeadlines(): FiscalDeadline[] {
  const now = new Date();
  const year = now.getFullYear();

  const deadlines: FiscalDeadline[] = [
    // Q1 (ene-mar)
    { model: 'Mod. 303', description: 'IVA 1T', dueDate: new Date(year, 3, 20), type: 'quarterly' },
    {
      model: 'Mod. 130',
      description: 'IRPF fraccionado 1T',
      dueDate: new Date(year, 3, 20),
      type: 'quarterly',
    },
    {
      model: 'Mod. 115',
      description: 'Retenciones arrendamiento 1T',
      dueDate: new Date(year, 3, 20),
      type: 'quarterly',
    },
    // Q2 (abr-jun)
    { model: 'Mod. 303', description: 'IVA 2T', dueDate: new Date(year, 6, 20), type: 'quarterly' },
    {
      model: 'Mod. 130',
      description: 'IRPF fraccionado 2T',
      dueDate: new Date(year, 6, 20),
      type: 'quarterly',
    },
    {
      model: 'Mod. 115',
      description: 'Retenciones arrendamiento 2T',
      dueDate: new Date(year, 6, 20),
      type: 'quarterly',
    },
    // Q3 (jul-sep)
    { model: 'Mod. 303', description: 'IVA 3T', dueDate: new Date(year, 9, 20), type: 'quarterly' },
    {
      model: 'Mod. 130',
      description: 'IRPF fraccionado 3T',
      dueDate: new Date(year, 9, 20),
      type: 'quarterly',
    },
    {
      model: 'Mod. 115',
      description: 'Retenciones arrendamiento 3T',
      dueDate: new Date(year, 9, 20),
      type: 'quarterly',
    },
    // Q4 (oct-dic) — vence en enero del año siguiente
    {
      model: 'Mod. 303',
      description: 'IVA 4T',
      dueDate: new Date(year + 1, 0, 30),
      type: 'quarterly',
    },
    {
      model: 'Mod. 130',
      description: 'IRPF fraccionado 4T',
      dueDate: new Date(year + 1, 0, 30),
      type: 'quarterly',
    },
    {
      model: 'Mod. 115',
      description: 'Retenciones arrendamiento 4T',
      dueDate: new Date(year + 1, 0, 30),
      type: 'quarterly',
    },
    // Anuales
    {
      model: 'Mod. 390',
      description: 'Resumen anual IVA',
      dueDate: new Date(year + 1, 0, 30),
      type: 'annual',
    },
    {
      model: 'Mod. 347',
      description: 'Operaciones con terceros',
      dueDate: new Date(year + 1, 1, 28),
      type: 'annual',
    },
  ];

  const upcoming = deadlines
    .filter((d) => d.dueDate >= now)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Devolver las dos primeras fechas distintas
  const groups: FiscalDeadline[][] = [];
  let lastDateKey: string | null = null;

  for (const d of upcoming) {
    const key = d.dueDate.toISOString().slice(0, 10);
    if (key !== lastDateKey) {
      if (groups.length >= 2) break;
      groups.push([d]);
      lastDateKey = key;
    } else {
      groups[groups.length - 1].push(d);
    }
  }

  return groups.flat();
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function FiscalCalendarWidget() {
  const deadlines = getUpcomingDeadlines();

  const dateGroups = new Map<string, FiscalDeadline[]>();
  for (const d of deadlines) {
    const key = d.dueDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    if (!dateGroups.has(key)) dateGroups.set(key, []);
    dateGroups.get(key)!.push(d);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Calendario fiscal</h3>
      </div>

      <div className="space-y-4">
        {[...dateGroups.entries()].map(([dateLabel, items]) => {
          const daysUntil = getDaysUntil(items[0].dueDate);
          const isUrgent = daysUntil <= 15;
          const isWarning = daysUntil > 15 && daysUntil <= 30;

          return (
            <div key={dateLabel}>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">{dateLabel}</p>
                <div
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    isUrgent
                      ? 'bg-destructive/10 text-destructive'
                      : isWarning
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `${daysUntil} días`}
                </div>
              </div>

              <div className="space-y-1">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-block rounded px-1.5 py-0.5 text-[10px] font-bold',
                        item.type === 'annual'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
                      )}
                    >
                      {item.model}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
