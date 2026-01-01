'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAnimeData } from '../hooks/useAnimeData';
import { useAuth } from '../hooks/useAuth';

type AnimeDataContextType = ReturnType<typeof useAnimeData>;

const AnimeDataContext = createContext<AnimeDataContextType | null>(null);

export function AnimeDataProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const animeData = useAnimeData(user, isLoading);
  
  // valueをメモ化（setState関数はReactが保証する安定した参照のため依存配列から除外）
  const value = useMemo(() => animeData, [
    animeData.seasons,
    animeData.expandedSeasons,
    animeData.allAnimes,
    animeData.averageRating,
    animeData.totalRewatchCount,
  ]);
  
  return (
    <AnimeDataContext.Provider value={value}>
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

