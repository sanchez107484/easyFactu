'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface SetupStepperProps {
  steps: Step[];
  currentStep: number;
}

export function SetupStepper({ steps, currentStep }: SetupStepperProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex  items-center justify-between">
        {steps.map((step, index) => {
          const isCurrentStep = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex flex-col items-center',
                index !== steps.length - 1 && 'flex-1',
              )}
            >
              {/* Connector line */}
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-[calc(50%+1.5rem)] right-[calc(-50%+1.5rem)] top-5 h-0.5',
                    isCompleted ? 'bg-primary-600' : 'bg-gray-200',
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step indicator */}
              <div className="relative flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                    isCompleted && 'border-primary-600 bg-primary-600 text-white',
                    isCurrentStep && 'border-primary-600 bg-white text-primary-600',
                    isUpcoming && 'border-gray-300 bg-white text-gray-500',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrentStep || isCompleted ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
