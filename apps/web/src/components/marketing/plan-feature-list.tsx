import { Check, X } from 'lucide-react';

interface PlanFeatureListProps {
  included: readonly string[];
  excluded?: readonly string[];
  className?: string;
}

/** Same layout as Ajustes → Plan: included features with a check, missing ones crossed out. */
export function PlanFeatureList({ included, excluded = [], className = '' }: PlanFeatureListProps) {
  return (
    <ul className={`space-y-1.5 ${className}`}>
      {included.map((feature) => (
        <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
          <span>{feature}</span>
        </li>
      ))}
      {excluded.map((feature) => (
        <li key={feature} className="flex items-start gap-2 text-sm text-slate-400">
          <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="sr-only">No incluye: </span>
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
}
