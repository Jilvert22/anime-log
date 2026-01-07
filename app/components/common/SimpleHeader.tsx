'use client';

import Link from 'next/link';

export function SimpleHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* 左：ロゴ */}
        <Link href="/">
          <h1 
            className="text-xl font-bold tracking-tight cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #e879d4 50%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            アニメログ
          </h1>
        </Link>

        {/* 右側：CTAボタン */}
        <Link
          href="/"
          className="px-5 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-semibold text-base transition-colors"
        >
          今すぐ使う
        </Link>
      </div>
    </header>
  );
}

