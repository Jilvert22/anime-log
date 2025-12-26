'use client';

import { useState, useEffect } from 'react';
import type { EvangelistList, FavoriteCharacter } from '../types';

export function useCollection() {
  const [evangelistLists, setEvangelistLists] = useState<EvangelistList[]>([]);
  const [favoriteCharacters, setFavoriteCharacters] = useState<FavoriteCharacter[]>([]);

  // localStorageから初期値を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLists = localStorage.getItem('evangelistLists');
      const savedCharacters = localStorage.getItem('favoriteCharacters');
      
      // 布教リストを読み込む
      if (savedLists) {
        try {
          const parsedLists = JSON.parse(savedLists);
          // Date型に変換
          const listsWithDates = parsedLists.map((list: any) => ({
            ...list,
            createdAt: new Date(list.createdAt),
          }));
          setEvangelistLists(listsWithDates);
        } catch (e) {
          console.error('Failed to parse evangelist lists', e);
        }
      }
      
      // 推しキャラを読み込む
      if (savedCharacters) {
        try {
          const parsedCharacters = JSON.parse(savedCharacters);
          // サンプルデータを検出（IDが1-3のキャラクターが含まれている場合）
          const hasSampleData = parsedCharacters.some((char: FavoriteCharacter) =>
            char.id >= 1 && char.id <= 3
          );
          
          if (hasSampleData) {
            // サンプルデータが含まれている場合はlocalStorageをクリア
            localStorage.removeItem('favoriteCharacters');
            setFavoriteCharacters([]);
          } else {
            setFavoriteCharacters(parsedCharacters);
          }
        } catch (e) {
          console.error('Failed to parse favorite characters', e);
          // エラーの場合は空の配列を使用
          setFavoriteCharacters([]);
        }
      } else {
        // 保存データがない場合は空の配列を使用
        setFavoriteCharacters([]);
      }
    }
  }, []);

  // 布教リストをlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('evangelistLists', JSON.stringify(evangelistLists));
    }
  }, [evangelistLists]);

  // 推しキャラをlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined' && favoriteCharacters.length > 0) {
      localStorage.setItem('favoriteCharacters', JSON.stringify(favoriteCharacters));
    }
  }, [favoriteCharacters]);

  return {
    evangelistLists,
    setEvangelistLists,
    favoriteCharacters,
    setFavoriteCharacters,
  };
}

