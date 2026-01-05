'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

type Props = {
  onUpdate: () => Promise<void>;
  lastUpdated?: string | null;
  size?: 'sm' | 'md';
};

export function StreamingUpdateButton({ onUpdate, lastUpdated, size = 'sm' }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      await onUpdate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新に失敗しました';
      setError(errorMessage);
      console.error('配信情報の更新に失敗:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {lastUpdated && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            最終更新: {formatDate(lastUpdated)}
          </span>
        )}
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className={`${sizeClasses} flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? '更新中...' : '配信情報を更新'}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

