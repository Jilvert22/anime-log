'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Anime } from '../../types';
import { supabase } from '../../lib/supabase';

export function ReviewModal({
  show,
  onClose,
  selectedAnime,
  user,
  userName,
  userIcon,
  onReviewPosted,
}: {
  show: boolean;
  onClose: () => void;
  selectedAnime: Anime | null;
  user: User | null;
  userName: string;
  userIcon: string;
  onReviewPosted: () => Promise<void>;
}) {
  const [reviewMode, setReviewMode] = useState<'overall' | 'episode'>('overall');
  const [newReviewContent, setNewReviewContent] = useState('');
  const [newReviewContainsSpoiler, setNewReviewContainsSpoiler] = useState(false);
  const [newReviewEpisodeNumber, setNewReviewEpisodeNumber] = useState<number | undefined>(undefined);

  if (!show || !selectedAnime) return null;

  const handleSubmit = async () => {
    if (!newReviewContent.trim() || !user || !selectedAnime) return;
    
    if (reviewMode === 'episode' && !newReviewEpisodeNumber) {
      alert('話数を入力してください');
      return;
    }

    try {
      // アニメのUUIDを取得
      const { data: animeData, error: animeError } = await supabase
        .from('animes')
        .select('id')
        .eq('id', selectedAnime.id)
        .eq('user_id', user.id)
        .single();
      
      if (animeError || !animeData) {
        console.error('Failed to find anime:', animeError);
        return;
      }
      
      const animeUuid = animeData.id;
      
      // 感想を投稿
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          anime_id: animeUuid,
          user_id: user.id,
          user_name: userName,
          user_icon: userIcon,
          type: reviewMode,
          episode_number: reviewMode === 'episode' ? newReviewEpisodeNumber : null,
          content: newReviewContent.trim(),
          contains_spoiler: newReviewContainsSpoiler,
        })
        .select()
        .single();
      
      if (reviewError) throw reviewError;
      
      // 感想を再読み込み
      await onReviewPosted();
      
      // モーダルを閉じる
      onClose();
      setNewReviewContent('');
      setNewReviewContainsSpoiler(false);
      setNewReviewEpisodeNumber(undefined);
      setReviewMode('overall');
    } catch (error) {
      console.error('Failed to post review:', error);
      alert('感想の投稿に失敗しました');
    }
  };

  const handleClose = () => {
    onClose();
    setNewReviewContent('');
    setNewReviewContainsSpoiler(false);
    setNewReviewEpisodeNumber(undefined);
    setReviewMode('overall');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm lg:max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 dark:text-white">感想を投稿</h2>
        
        {/* モード切り替え */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setReviewMode('overall');
              setNewReviewEpisodeNumber(undefined);
            }}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              reviewMode === 'overall'
                ? 'bg-[#ffc2d1] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            全体感想
          </button>
          <button
            onClick={() => setReviewMode('episode')}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              reviewMode === 'episode'
                ? 'bg-[#ffc2d1] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            話数感想
          </button>
        </div>

        {/* 話数選択（話数感想の場合） */}
        {reviewMode === 'episode' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              話数
            </label>
            <input
              type="number"
              min="1"
              value={newReviewEpisodeNumber || ''}
              onChange={(e) => setNewReviewEpisodeNumber(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
              placeholder="例: 1"
            />
          </div>
        )}

        {/* 感想本文 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            感想
          </label>
          <textarea
            value={newReviewContent}
            onChange={(e) => setNewReviewContent(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white min-h-[120px]"
            placeholder="感想を入力してください..."
          />
        </div>

        {/* ネタバレチェック */}
        <div className="mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newReviewContainsSpoiler}
              onChange={(e) => setNewReviewContainsSpoiler(e.target.checked)}
              className="w-4 h-4 text-[#ffc2d1] rounded focus:ring-[#ffc2d1]"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              ネタバレを含む
            </span>
          </label>
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newReviewContent.trim() || (reviewMode === 'episode' && !newReviewEpisodeNumber)}
            className="flex-1 bg-[#ffc2d1] text-white py-3 rounded-xl font-bold hover:bg-[#ffb07c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            投稿
          </button>
        </div>
      </div>
    </div>
  );
}
