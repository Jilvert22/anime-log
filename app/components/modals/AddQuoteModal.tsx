'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Anime, Season } from '../../types';
import { supabase } from '../../lib/supabase';

export function AddQuoteModal({
  show,
  onClose,
  allAnimes,
  seasons,
  setSeasons,
  user,
  editingQuote,
  onSave,
}: {
  show: boolean;
  onClose: () => void;
  allAnimes: Anime[];
  seasons: Season[];
  setSeasons: (seasons: Season[]) => void;
  user: User | null;
  editingQuote: { animeId: number; quoteIndex: number } | null;
  onSave: () => void;
}) {
  const [newQuoteAnimeId, setNewQuoteAnimeId] = useState<number | null>(null);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteCharacter, setNewQuoteCharacter] = useState('');

  useEffect(() => {
    if (editingQuote) {
      const anime = allAnimes.find(a => a.id === editingQuote.animeId);
      if (anime && anime.quotes && anime.quotes[editingQuote.quoteIndex]) {
        const quote = anime.quotes[editingQuote.quoteIndex];
        setNewQuoteText(quote.text);
        setNewQuoteCharacter(quote.character || '');
      }
    } else {
      setNewQuoteAnimeId(null);
      setNewQuoteText('');
      setNewQuoteCharacter('');
    }
  }, [editingQuote, allAnimes, show]);

  if (!show) return null;

  const handleSave = async () => {
    const animeId = editingQuote ? editingQuote.animeId : newQuoteAnimeId;
    if (newQuoteText.trim() && animeId) {
      const anime = allAnimes.find(a => a.id === animeId);
      if (anime) {
        if (editingQuote) {
          // 編集
          const updatedQuotes = [...(anime.quotes || [])];
          updatedQuotes[editingQuote.quoteIndex] = {
            text: newQuoteText.trim(),
            character: newQuoteCharacter.trim() || undefined,
          };
          
          const updatedSeasons = seasons.map(season => ({
            ...season,
            animes: season.animes.map(a =>
              a.id === animeId
                ? { ...a, quotes: updatedQuotes }
                : a
            ),
          }));
          
          // Supabaseを更新（ログイン時のみ）
          if (user) {
            try {
              const { error } = await supabase
                .from('animes')
                .update({ quotes: updatedQuotes })
                .eq('id', animeId)
                .eq('user_id', user.id);
              
              if (error) throw error;
            } catch (error) {
              console.error('Failed to update quote in Supabase:', error);
            }
          }
          
          setSeasons(updatedSeasons);
        } else {
          // 新規追加
          const newQuotes = [...(anime.quotes || []), {
            text: newQuoteText.trim(),
            character: newQuoteCharacter.trim() || undefined,
          }];
          
          const updatedSeasons = seasons.map(season => ({
            ...season,
            animes: season.animes.map(a =>
              a.id === animeId
                ? { ...a, quotes: newQuotes }
                : a
            ),
          }));
          
          // Supabaseを更新（ログイン時のみ）
          if (user) {
            try {
              const { error } = await supabase
                .from('animes')
                .update({ quotes: newQuotes })
                .eq('id', animeId)
                .eq('user_id', user.id);
              
              if (error) throw error;
            } catch (error) {
              console.error('Failed to add quote to Supabase:', error);
            }
          }
          
          setSeasons(updatedSeasons);
        }
        
        onSave();
        onClose();
      }
    }
  };

  const handleClose = () => {
    onClose();
    setNewQuoteAnimeId(null);
    setNewQuoteText('');
    setNewQuoteCharacter('');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm lg:max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          {editingQuote ? '名言を編集' : '名言を追加'}
        </h2>
        
        {/* アニメ選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            アニメ
          </label>
          <select
            value={editingQuote ? editingQuote.animeId : (newQuoteAnimeId || '')}
            onChange={(e) => {
              if (editingQuote) {
                // 編集時は変更不可
                return;
              } else {
                setNewQuoteAnimeId(Number(e.target.value) || null);
              }
            }}
            disabled={!!editingQuote}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
          >
            <option value="">選択してください</option>
            {allAnimes.map((anime) => (
              <option key={anime.id} value={anime.id}>
                {anime.title}
              </option>
            ))}
          </select>
        </div>

        {/* セリフ入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            セリフ
          </label>
          <textarea
            value={newQuoteText}
            onChange={(e) => setNewQuoteText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
            placeholder="名言を入力"
            rows={3}
          />
        </div>

        {/* キャラクター名入力 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            キャラクター名（任意）
          </label>
          <input
            type="text"
            value={newQuoteCharacter}
            onChange={(e) => setNewQuoteCharacter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
            placeholder="キャラクター名"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!newQuoteText.trim() || (!editingQuote && !newQuoteAnimeId)}
            className="flex-1 bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {editingQuote ? '更新' : '追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
