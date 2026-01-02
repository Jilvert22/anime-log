'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
      <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1">
        <Link 
          href="/terms" 
          className="hover:text-[#e879d4] dark:hover:text-[#e879d4] transition-colors font-mixed"
        >
          利用規約
        </Link>
        <span>|</span>
        <Link 
          href="/privacy" 
          className="hover:text-[#e879d4] dark:hover:text-[#e879d4] transition-colors font-mixed"
        >
          プライバシーポリシー
        </Link>
        <span>|</span>
        <span className="font-mixed">
          データ提供:{' '}
          <a
            href="https://anilist.co"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#e879d4] dark:hover:text-[#e879d4] transition-colors"
          >
            AniList
          </a>
          ,{' '}
          <a
            href="https://annict.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#e879d4] dark:hover:text-[#e879d4] transition-colors"
          >
            Annict
          </a>
        </span>
      </div>
    </footer>
  );
}


