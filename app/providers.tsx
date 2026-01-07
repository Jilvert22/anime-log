'use client';

import { ReactNode } from 'react';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { AnimeDataProvider } from './contexts/AnimeDataContext';
import { OnboardingProvider } from './contexts/OnboardingContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProfileProvider>
      <AnimeDataProvider>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </AnimeDataProvider>
    </UserProfileProvider>
  );
}

