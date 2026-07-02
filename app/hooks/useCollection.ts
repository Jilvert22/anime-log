'use client';

import { useState, useEffect, useRef } from 'react';
import type { FavoriteCharacter } from '../types';

// localStorageから読み込むヘルパー
function loadFromStorage<T>(key: string, transform?: (data: T) => T): T | null {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return transform ? transform(parsed) : parsed;
  } catch (e) {
    console.error(`Failed to parse ${key}:`, e);
    return null;
  }
}

// localStorageに保存するヘルパー
function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useCollection() {
  const [favoriteCharacters, setFavoriteCharacters] = useState<FavoriteCharacter[]>([]);

  // 初回読み込み完了フラグ
  const isInitialized = useRef(false);

  // localStorageから初期値を読み込む
  useEffect(() => {
    // 推しキャラを読み込む
    const characters = loadFromStorage<FavoriteCharacter[]>('favoriteCharacters');
    if (characters) {
      // サンプルデータを検出（IDが1-3のキャラクター）
      const hasSampleData = characters.some((char) => char.id >= 1 && char.id <= 3);
      if (hasSampleData) {
        localStorage.removeItem('favoriteCharacters');
      } else {
        setFavoriteCharacters(characters);
      }
    }

    isInitialized.current = true;
  }, []);

  // 推しキャラをlocalStorageに保存
  useEffect(() => {
    if (isInitialized.current && favoriteCharacters.length > 0) {
      saveToStorage('favoriteCharacters', favoriteCharacters);
    }
  }, [favoriteCharacters]);

  return {
    favoriteCharacters,
    setFavoriteCharacters,
  };
}
