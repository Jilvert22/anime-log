'use client';

import { useEffect } from 'react';

/**
 * Escキーでモーダルを閉じるための共通フック。
 * モーダルコンポーネント内で `useEscapeKey(onClose, show)` のように使う。
 * enabledがfalseの間はリスナーを張らない(非表示モーダルが反応しないように)。
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, enabled]);
}
