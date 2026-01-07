'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStorage } from './useStorage';
import { shouldShowSeasonStartModal, markSeasonChecked } from '../utils/helpers';
import type { WatchlistItem } from '../lib/storage/types';

export function useSeasonManagement(isLoading: boolean) {
  const storage = useStorage();
  const [showSeasonEndModal, setShowSeasonEndModal] = useState(false);
  const [previousSeasonItems, setPreviousSeasonItems] = useState<WatchlistItem[]>([]);

  // 今期の視聴予定アニメを積みアニメに移動
  const handleMoveToBacklog = useCallback(async () => {
    if (previousSeasonItems.length === 0) return;

    try {
      for (const item of previousSeasonItems) {
        await storage.updateWatchlistItem(item.anilist_id, {
          status: null,
          season_year: null,
          season: null,
        });
      }
      markSeasonChecked(); // 確認済みとしてマーク
      setShowSeasonEndModal(false);
      setPreviousSeasonItems([]);
    } catch (error) {
      console.error('積みアニメへの移動に失敗しました:', error);
      alert('積みアニメへの移動に失敗しました');
    }
  }, [storage, previousSeasonItems]);

  // 今期の視聴予定アニメを削除
  const handleDeletePreviousSeason = useCallback(async () => {
    if (previousSeasonItems.length === 0) return;

    try {
      for (const item of previousSeasonItems) {
        await storage.removeFromWatchlist(item.anilist_id);
      }
      markSeasonChecked(); // 確認済みとしてマーク
      setShowSeasonEndModal(false);
      setPreviousSeasonItems([]);
    } catch (error) {
      console.error('削除に失敗しました:', error);
      alert('削除に失敗しました');
    }
  }, [storage, previousSeasonItems]);

  // 視聴中に移行
  const handleKeepPreviousSeason = useCallback(async () => {
    if (previousSeasonItems.length === 0) return;
    
    try {
      // 各アイテムのステータスをwatchingに変更
      for (const item of previousSeasonItems) {
        if (item.anilist_id) {
          await storage.updateWatchlistItem(item.anilist_id, { status: 'watching' });
        }
      }
      markSeasonChecked(); // 確認済みとしてマーク
      // 状態更新を次のイベントループで実行して、Reactの再レンダリングサイクルを避ける
      setTimeout(() => {
        setShowSeasonEndModal(false);
        setPreviousSeasonItems([]);
      }, 0);
    } catch (error) {
      console.error('視聴中への移行に失敗しました:', error);
      alert('視聴中への移行に失敗しました');
      // エラー時もモーダルを閉じる
      setTimeout(() => {
        setShowSeasonEndModal(false);
      }, 0);
    }
  }, [storage, previousSeasonItems]);

  // シーズン開始時のチェック（アプリ起動時）
  // 「来期」が「今期」になった時点で、視聴予定（planned）のアニメをチェック
  // メインスレッドをブロックしないように遅延実行
  useEffect(() => {
    // 初期レンダリング後に実行（メインスレッドのブロッキングを回避）
    const timeoutId = setTimeout(() => {
      const checkSeasonStart = async () => {
        if (isLoading) return;
        
        // 既に今シーズンの確認済みフラグがある場合はスキップ
        if (!shouldShowSeasonStartModal()) {
          return;
        }
        
        try {
          const items = await storage.getCurrentSeasonWatchlist('planned');
          if (items.length > 0) {
            setPreviousSeasonItems(items);
            setShowSeasonEndModal(true);
          } else {
            // 視聴予定アニメがなくても確認済みとしてマーク
            markSeasonChecked();
          }
        } catch (error) {
          console.error('シーズン開始チェックに失敗しました:', error);
        }
      };

      checkSeasonStart();
    }, 100); // 100ms遅延して実行

    return () => clearTimeout(timeoutId);
  }, [storage, isLoading]);

  return {
    showSeasonEndModal,
    previousSeasonItems,
    handleMoveToBacklog,
    handleDeletePreviousSeason,
    handleKeepPreviousSeason,
  };
}

