'use client';

import { useState } from 'react';
import type { FavoriteCharacter } from '../types';

export function useFormStates() {
  // キャラクター関連のフォーム状態
  const [editingCharacter, setEditingCharacter] = useState<FavoriteCharacter | null>(null);
  const [characterFilter, setCharacterFilter] = useState<string | null>(null);

  // 名言関連のフォーム状態
  const [editingQuote, setEditingQuote] = useState<{ animeId: number; quoteIndex: number } | null>(null);
  const [quoteSearchQuery, setQuoteSearchQuery] = useState('');
  const [quoteFilterType, setQuoteFilterType] = useState<'all' | 'anime' | 'character'>('all');
  const [selectedAnimeForFilter, setSelectedAnimeForFilter] = useState<number | null>(null);

  return {
    // キャラクター関連
    editingCharacter,
    setEditingCharacter,
    characterFilter,
    setCharacterFilter,
    // 名言関連
    editingQuote,
    setEditingQuote,
    quoteSearchQuery,
    setQuoteSearchQuery,
    quoteFilterType,
    setQuoteFilterType,
    selectedAnimeForFilter,
    setSelectedAnimeForFilter,
  };
}

