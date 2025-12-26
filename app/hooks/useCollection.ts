'use client';

import { useState, useEffect } from 'react';
import type { EvangelistList, FavoriteCharacter, VoiceActor } from '../types';

export function useCollection() {
  const [evangelistLists, setEvangelistLists] = useState<EvangelistList[]>([]);
  const [favoriteCharacters, setFavoriteCharacters] = useState<FavoriteCharacter[]>([]);
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([]);

  // localStorageから初期値を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLists = localStorage.getItem('evangelistLists');
      const savedCharacters = localStorage.getItem('favoriteCharacters');
      const savedVoiceActors = localStorage.getItem('voiceActors');
      
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
      
      // 声優を読み込む
      if (savedVoiceActors) {
        try {
          const parsedVoiceActors = JSON.parse(savedVoiceActors);
          setVoiceActors(parsedVoiceActors);
        } catch (e) {
          console.error('Failed to parse voice actors', e);
          setVoiceActors([]);
        }
      } else {
        setVoiceActors([]);
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

  // 声優をlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined' && voiceActors.length > 0) {
      localStorage.setItem('voiceActors', JSON.stringify(voiceActors));
    }
  }, [voiceActors]);

  return {
    evangelistLists,
    setEvangelistLists,
    favoriteCharacters,
    setFavoriteCharacters,
    voiceActors,
    setVoiceActors,
  };
}

