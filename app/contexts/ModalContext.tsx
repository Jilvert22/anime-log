'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useModals } from '../hooks/useModals';
import { useModalActions } from '../hooks/useModalActions';
import { useFormStates } from '../hooks/useFormStates';
import { useAnimeDataContext } from './AnimeDataContext';
import type { Anime } from '../types';

type ModalContextType = {
  modals: ReturnType<typeof useModals>;
  actions: ReturnType<typeof useModalActions>;
  formStates: ReturnType<typeof useFormStates>;
};

const ModalContext = createContext<ModalContextType | null>(null);

interface ModalProviderProps {
  children: ReactNode;
  setSelectedAnime: (anime: Anime | null) => void;
}

export function ModalProvider({ children, setSelectedAnime }: ModalProviderProps) {
  const modals = useModals();
  const formStates = useFormStates();
  const { allAnimes } = useAnimeDataContext();
  
  const actions = useModalActions({
    setShowAddForm: modals.setShowAddForm,
    setShowReviewModal: modals.setShowReviewModal,
    setShowSettings: modals.setShowSettings,
    setShowFavoriteAnimeModal: modals.setShowFavoriteAnimeModal,
    setShowAuthModal: modals.setShowAuthModal,
    setShowAddQuoteModal: modals.setShowAddQuoteModal,
    setShowSongModal: modals.setShowSongModal,
    setShowDNAModal: modals.setShowDNAModal,
    setEditingQuote: formStates.setEditingQuote,
    setSelectedAnime,
    allAnimes,
  });
  
  // valueをメモ化（setState関数はReactが保証する安定した参照のため依存配列から除外）
  const value = useMemo(() => ({
    modals,
    actions,
    formStates,
  }), [modals, actions, formStates]);
  
  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within ModalProvider');
  }
  return context;
}

