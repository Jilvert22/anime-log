'use client';

import { ReactNode } from 'react';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { AnimeDataProvider } from './contexts/AnimeDataContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { FeedbackProvider } from './contexts/FeedbackContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FeedbackProvider>
      <UserProfileProvider>
        <AnimeDataProvider>
          <OnboardingProvider>
            {children}
          </OnboardingProvider>
        </AnimeDataProvider>
      </UserProfileProvider>
    </FeedbackProvider>
  );
}

