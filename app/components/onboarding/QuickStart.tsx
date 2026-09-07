'use client';

import { useState } from 'react';

export function QuickStart({
  count,
  onAdd,
  onViewCard,
}: {
  count: number;
  onAdd: () => void;
  onViewCard: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || count > 3) return null;
  return (
    <section
      aria-label="はじめの記録"
      className="mb-5 rounded-2xl bg-white dark:bg-gray-800 border border-fuchsia-200 dark:border-fuchsia-900 p-5"
    >
      <div className="flex justify-between items-start gap-3">
        <h2 className="font-bold text-lg dark:text-white">
          {count >= 3 ? 'あなたの作品棚ができました' : '好きな作品を3つ、選んでみましょう'}
        </h2>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="はじめの記録の案内を閉じる"
          className="p-2 text-gray-500"
        >
          ×
        </button>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
        {count >= 3
          ? 'マイページで好みの傾向やDNAカードを見られます。'
          : `まずは1作品から。検索して複数の作品をまとめて追加できます。現在${count}作品。`}
      </p>
      <button
        type="button"
        onClick={count >= 3 ? onViewCard : onAdd}
        className="mt-4 px-4 py-3 rounded-xl bg-fuchsia-700 text-white font-medium"
      >
        {count >= 3 ? 'DNAカードを見てみる' : '好きな作品を選ぶ'}
      </button>
    </section>
  );
}
