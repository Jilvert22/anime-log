'use client';

import { ReactNode } from 'react';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { AnimeDataProvider } from './contexts/AnimeDataContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProfileProvider>
      <AnimeDataProvider>
        {children}
      </AnimeDataProvider>
    </UserProfileProvider>
  );
}

