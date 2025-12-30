'use client';

import { useState } from 'react';
import type { WatchlistItem } from '../../lib/storage/types';
import { markSeasonChecked } from '../../utils/helpers';

export function SeasonEndModal({
  items,
  onMoveToBacklog,
  onDelete,
  onKeep,
}: {
  items: WatchlistItem[];
  onMoveToBacklog: () => void;
  onDelete: () => void;
  onKeep: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMoveToBacklog = async () => {
    setIsProcessing(true);
    try {
      await onMoveToBacklog();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await onDelete();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          今期が始まりました！
        </h2>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          視聴予定のアニメが{items.length}件あります。どうしますか？
        </p>

        <div className="max-h-60 overflow-y-auto mb-4 space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
            >
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {item.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ステータス: 視聴予定
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={async () => {
              // 視聴中に移行
              setIsProcessing(true);
              try {
                // 各アイテムのステータスをwatchingに変更
                const { useStorage } = await import('../../hooks/useStorage');
                const storage = useStorage();
                for (const item of items) {
                  if (item.anilist_id) {
                    await storage.updateWatchlistItem(item.anilist_id, { status: 'watching' });
                  }
                }
                markSeasonChecked(); // 確認済みとしてマーク
                onKeep(); // モーダルを閉じる
              } catch (error) {
                console.error('Failed to update to watching:', error);
                alert('視聴中への移行に失敗しました');
              } finally {
                setIsProcessing(false);
              }
            }}
            disabled={isProcessing}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isProcessing ? '処理中...' : '視聴中に移行'}
          </button>
          <button
            onClick={handleMoveToBacklog}
            disabled={isProcessing}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isProcessing ? '処理中...' : '積みアニメに移動'}
          </button>
          <button
            onClick={handleDelete}
            disabled={isProcessing}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isProcessing ? '処理中...' : '削除'}
          </button>
        </div>
      </div>
    </div>
  );
}

