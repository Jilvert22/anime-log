'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
      <Link 
        href="/terms" 
        className="hover:text-[#e879d4] dark:hover:text-[#e879d4] transition-colors font-mixed"
      >
        利用規約
      </Link>
      <span className="mx-2">|</span>
      <Link 
        href="/privacy" 
        className="hover:text-[#e879d4] dark:hover:text-[#e879d4] transition-colors font-mixed"
      >
        プライバシーポリシー
      </Link>
    </footer>
  );
}

