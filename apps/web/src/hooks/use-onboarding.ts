'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tracks wizard progress only (steps completed in the current onboarding session).
// Banner visibility is driven by tenant.setupCompleted from the database.
// isBannerDismissed is intentionally NOT persisted — it resets on page reload so the
// banner keeps showing until setupCompleted is true in the DB.

interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  skippedSteps: number[];
  tenantId: string | null;
  isBannerDismissed: boolean;
  setStep: (step: number) => void;
  completeStep: (step: number) => void;
  skipStep: (step: number) => void;
  dismissBanner: () => void;
  setTenantId: (id: string) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      completedSteps: [],
      skippedSteps: [],
      tenantId: null,
      isBannerDismissed: false,
      setStep: (step) => set({ currentStep: step }),
      completeStep: (step) =>
        set((state) => ({
          completedSteps: [...new Set([...state.completedSteps, step])],
        })),
      skipStep: (step) =>
        set((state) => ({
          skippedSteps: [...new Set([...state.skippedSteps, step])],
        })),
      dismissBanner: () => set({ isBannerDismissed: true }),
      setTenantId: (id) => set({ tenantId: id }),
      resetOnboarding: () =>
        set({
          currentStep: 1,
          completedSteps: [],
          skippedSteps: [],
          isBannerDismissed: false,
        }),
    }),
    {
      name: 'onboarding-storage',
      version: 2,
      // Migration clears old persisted keys (isCompleted, isBannerDismissed) that
      // could prevent the SetupBanner from showing. setupCompleted is now the DB source of truth.
      migrate: (_oldState, _version) => ({
        currentStep: 1,
        completedSteps: [],
        skippedSteps: [],
        tenantId: null,
      }),
      // Only persist step progress — banner visibility is driven by tenant.setupCompleted in DB.
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        skippedSteps: state.skippedSteps,
        tenantId: state.tenantId,
      }),
    },
  ),
);
