'use client';

import { useState, useEffect } from 'react';
import type { AnimeId } from '../types';

export function useFavoriteAnime() {
  // localStorage には二重実態の id が入り得る（ログイン作品=UUID 文字列 / 合成=number）
  const [favoriteAnimeIds, setFavoriteAnimeIds] = useState<AnimeId[]>([]);

  // localStorageからfavoriteAnimeIdsを読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favoriteAnimeIds');
      if (saved) {
        try {
          setFavoriteAnimeIds(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse favoriteAnimeIds', e);
        }
      }
    }
  }, []);

  // favoriteAnimeIdsをlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('favoriteAnimeIds', JSON.stringify(favoriteAnimeIds));
    }
  }, [favoriteAnimeIds]);

  return {
    favoriteAnimeIds,
    setFavoriteAnimeIds,
  };
}
