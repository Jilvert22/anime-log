'use client';

import { AlertCircle, RotateCw } from 'lucide-react';

/**
 * データ取得失敗時に表示する共通のエラー状態 + 再試行UI。
 * ネットワークや Supabase の一時的な失敗で画面が黙って空になるのを防ぐ。
 */
export function ErrorState({
  message = 'データの読み込みに失敗しました',
  description = '通信環境をご確認のうえ、もう一度お試しください。',
  onRetry,
}: {
  message?: string;
  description?: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center"
    >
      <AlertCircle className="w-12 h-12 text-red-400" aria-hidden />
      <div>
        <p className="text-base font-bold text-gray-800 dark:text-gray-100">{message}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#e879d4] text-white font-bold hover:bg-[#d45dbf] transition-colors"
      >
        <RotateCw className="w-4 h-4" aria-hidden />
        再試行
      </button>
    </div>
  );
}
