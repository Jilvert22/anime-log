'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useOnboarding, type OnboardingStep } from '../hooks/useOnboarding';

interface OnboardingContextValue {
  currentStep: OnboardingStep | null;
  isActive: boolean;
  isCompleted: boolean;
  startOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const onboarding = useOnboarding();

  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within OnboardingProvider');
  }
  return context;
}

