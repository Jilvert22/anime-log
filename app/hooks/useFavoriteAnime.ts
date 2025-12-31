'use client';

import { useState, useEffect } from 'react';

export function useFavoriteAnime() {
  const [favoriteAnimeIds, setFavoriteAnimeIds] = useState<number[]>([]);

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

