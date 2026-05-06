'use client';

import { useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Al menos una mayúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Al menos un número', test: (p) => /[0-9]/.test(p) },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return 0;
    return requirements.filter((req) => req.test(password)).length;
  }, [password]);

  const strengthLabel = useMemo(() => {
    if (strength === 0) return '';
    if (strength === 1) return 'Débil';
    if (strength === 2) return 'Media';
    return 'Fuerte';
  }, [strength]);

  const strengthColor = useMemo(() => {
    if (strength === 1) return 'bg-rectificativa-500';
    if (strength === 2) return 'bg-proforma-500';
    if (strength === 3) return 'bg-secondary-500';
    return 'bg-muted';
  }, [strength]);

  if (!password) return null;

  return (
    <div className="mt-3 space-y-3">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Seguridad de la contraseña</span>
          <span
            className={`font-medium ${
              strength === 3
                ? 'text-secondary-600'
                : strength === 2
                  ? 'text-proforma-600'
                  : 'text-rectificativa-600'
            }`}
          >
            {strengthLabel}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map((level) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                strength >= level ? strengthColor : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        {requirements.map((req) => {
          const passed = req.test(password);
          return (
            <div
              key={req.label}
              className={`flex items-center gap-2 text-xs ${
                passed ? 'text-secondary-600' : 'text-muted-foreground'
              }`}
            >
              {passed ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {req.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
