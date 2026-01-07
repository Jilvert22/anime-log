'use client';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* オフラインアイコン */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-8.486 8.486a9 9 0 010-12.728m3.536 3.536a4 4 0 010 5.656M12 12h.01"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          オフラインです
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          インターネット接続がありません。
          <br />
          接続が回復したら自動的に復帰します。
        </p>

        {/* キャッシュ済みデータへの案内 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            <strong>オフラインでもできること:</strong>
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• 過去に閲覧したアニメ情報の確認</li>
            <li>• キャッシュ済みの画像表示</li>
          </ul>
        </div>

        {/* アクション */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-[#e879d4] text-white rounded-lg hover:bg-[#d169c4] transition-colors"
          >
            再読み込み
          </button>

          <Link
            href="/"
            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

