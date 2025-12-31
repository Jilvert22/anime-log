'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAnimeData } from '../hooks/useAnimeData';
import { useAuth } from '../hooks/useAuth';

type AnimeDataContextType = ReturnType<typeof useAnimeData>;

const AnimeDataContext = createContext<AnimeDataContextType | null>(null);

export function AnimeDataProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const animeData = useAnimeData(user, isLoading);
  return (
    <AnimeDataContext.Provider value={animeData}>
      {children}
    </AnimeDataContext.Provider>
  );
}

export function useAnimeDataContext() {
  const context = useContext(AnimeDataContext);
  if (!context) {
    throw new Error('useAnimeDataContext must be used within AnimeDataProvider');
  }
  return context;
}

