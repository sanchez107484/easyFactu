'use client';

import { Switch } from '@/components/ui/switch';
import type { CookieConsent } from '@/lib/cookie-consent';

interface CookieCategory {
  key: keyof CookieConsent;
  title: string;
  description: string;
}

const OPTIONAL_CATEGORIES: CookieCategory[] = [
  {
    key: 'analytics',
    title: 'Análisis',
    description: 'Google Analytics: qué páginas se visitan y cómo se usa la web, para mejorarla.',
  },
  {
    key: 'ads',
    title: 'Publicidad',
    description:
      'Google Ads: saber si alguien llegó desde uno de nuestros anuncios y si se registró, para medir qué anuncios funcionan.',
  },
];

interface CookiePreferencesPanelProps {
  consent: CookieConsent;
  onChange: (consent: CookieConsent) => void;
}

export function CookiePreferencesPanel({ consent, onChange }: CookiePreferencesPanelProps) {
  return (
    <ul className="space-y-3 border-t pt-3">
      <li className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Técnicas</p>
          <p className="text-xs text-muted-foreground">
            Necesarias para iniciar sesión y que la web funcione. Siempre activas.
          </p>
        </div>
        <Switch checked disabled aria-label="Cookies técnicas, siempre activas" />
      </li>
      {OPTIONAL_CATEGORIES.map(({ key, title, description }) => (
        <li key={key} className="flex items-start justify-between gap-4">
          <label htmlFor={`cookie-${key}`} className="cursor-pointer">
            <span className="block text-sm font-medium">{title}</span>
            <span className="block text-xs text-muted-foreground">{description}</span>
          </label>
          <Switch
            id={`cookie-${key}`}
            checked={consent[key]}
            onCheckedChange={(checked) => onChange({ ...consent, [key]: checked })}
          />
        </li>
      ))}
    </ul>
  );
}
