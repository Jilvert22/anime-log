'use client';

import { useCallback } from 'react';

interface UseModalActionsProps {
  // useModalsから取得したセッター
  setShowAddForm: (show: boolean) => void;
  setShowReviewModal: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowFavoriteAnimeModal: (show: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  setShowAddQuoteModal: (show: boolean) => void;
  setShowSongModal: (show: boolean) => void;
  setShowDNAModal: (show: boolean) => void;
  // useFormStatesから取得したセッター
  setEditingQuote: (quote: { animeId: number; quoteIndex: number } | null) => void;
  // HomeClientで直接管理されている状態のセッター
  setSelectedAnime: (anime: any | null) => void;
  // その他の依存関係
  allAnimes?: any[];
}

export function useModalActions({
  setShowAddForm,
  setShowReviewModal,
  setShowSettings,
  setShowFavoriteAnimeModal,
  setShowAuthModal,
  setShowAddQuoteModal,
  setShowSongModal,
  setShowDNAModal,
  setEditingQuote,
  setSelectedAnime,
  allAnimes = [],
}: UseModalActionsProps) {
  // アニメ追加フォーム
  const openAddForm = useCallback(() => {
    setShowAddForm(true);
  }, [setShowAddForm]);

  const closeAddForm = useCallback(() => {
    setShowAddForm(false);
  }, [setShowAddForm]);

  // レビューモーダル
  const closeReviewModal = useCallback(() => {
    setShowReviewModal(false);
  }, [setShowReviewModal]);

  // 設定モーダル
  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, [setShowSettings]);

  // お気に入りアニメモーダル
  const closeFavoriteAnimeModal = useCallback(() => {
    setShowFavoriteAnimeModal(false);
  }, [setShowFavoriteAnimeModal]);

  // 認証モーダル
  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, [setShowAuthModal]);

  // 名言追加モーダル
  const openAddQuoteModal = useCallback(() => {
    setEditingQuote(null);
    setShowAddQuoteModal(true);
  }, [setEditingQuote, setShowAddQuoteModal]);

  const closeAddQuoteModal = useCallback(() => {
    setShowAddQuoteModal(false);
    setEditingQuote(null);
  }, [setShowAddQuoteModal, setEditingQuote]);

  const saveAddQuoteModal = useCallback(() => {
    setShowAddQuoteModal(false);
    setEditingQuote(null);
  }, [setShowAddQuoteModal, setEditingQuote]);

  const editQuote = useCallback((animeId: number, quoteIndex: number) => {
    const anime = allAnimes.find(a => a.id === animeId);
    if (anime?.quotes?.[quoteIndex]) {
      setEditingQuote({ animeId, quoteIndex });
      setShowAddQuoteModal(true);
    }
  }, [allAnimes, setEditingQuote, setShowAddQuoteModal]);

  // 楽曲モーダル
  const closeSongModal = useCallback(() => {
    setShowSongModal(false);
    setSelectedAnime(null);
  }, [setShowSongModal, setSelectedAnime]);

  // DNAモーダル
  const closeDNAModal = useCallback(() => {
    setShowDNAModal(false);
  }, [setShowDNAModal]);

  return {
    // アニメ追加フォーム
    openAddForm,
    closeAddForm,
    // レビューモーダル
    closeReviewModal,
    // 設定モーダル
    closeSettings,
    // お気に入りアニメモーダル
    closeFavoriteAnimeModal,
    // 認証モーダル
    closeAuthModal,
    // 名言追加モーダル
    openAddQuoteModal,
    closeAddQuoteModal,
    saveAddQuoteModal,
    editQuote,
    // 楽曲モーダル
    closeSongModal,
    // DNAモーダル
    closeDNAModal,
  };
}

