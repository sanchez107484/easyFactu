'use client';

import { CheckCircle2 } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface OnboardingStepsProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export function OnboardingSteps({ steps, currentStep, completedSteps }: OnboardingStepsProps) {
  return (
    <nav aria-label="Progreso del onboarding">
      <ol className="flex items-start justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.number);
          const isCurrent = currentStep === step.number;

          return (
            <li key={step.number} className="flex flex-1 items-start">
              <div className="flex flex-col items-center gap-2">
                {isCompleted ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                    <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                ) : isCurrent ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background">
                    <span className="text-sm font-semibold text-primary">{step.number}</span>
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-muted bg-background">
                    <span className="text-sm text-muted-foreground">{step.number}</span>
                  </div>
                )}

                <div className="hidden text-center sm:block">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent
                        ? 'text-primary'
                        : isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-2 mt-5 h-0.5 flex-1 ${isCompleted ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
