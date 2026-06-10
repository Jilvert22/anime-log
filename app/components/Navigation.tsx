'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { onAuthStateChange } from '../lib/api';
import type { User } from '@supabase/supabase-js';
import { useOnboardingContext } from '../contexts/OnboardingContext';

interface NavigationProps {
  activeTab: 'home' | 'mypage';
  setActiveTab: (tab: 'home' | 'mypage') => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
  user: User | null;
  userName: string;
  userIcon: string | null;
  onOpenSettingsModal: () => void;
  setShowAuthModal: (show: boolean) => void;
}

export function Navigation({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  user: userProp,
  userName,
  userIcon,
  onOpenSettingsModal,
  setShowAuthModal,
}: NavigationProps) {
  // 認証状態をローカルでも監視して、確実に更新されるようにする
  const [user, setUser] = useState<User | null>(userProp);

  useEffect(() => {
    // プロップから受け取ったuserを同期
    setUser(userProp);
  }, [userProp]);

  useEffect(() => {
    // 認証状態の変化を監視（初期レンダリング後に実行してメインスレッドをブロックしない）
    let unsubscribe: (() => void) | undefined;
    
    const timeoutId = setTimeout(() => {
      if (!supabase) {
        console.warn('[Navigation] Supabaseクライアントが利用できません');
        return;
      }
      
      unsubscribe = onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
    }, 0); // 次のイベントループで実行

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="h-full max-w-7xl mx-auto px-4 relative flex items-center">
        {/* 左：ロゴ */}
        <h1 
          className="hidden sm:block text-xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #e879d4 50%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          アニメログ
        </h1>

        {/* 中央：セグメントコントロール（PC/モバイル共通） */}
        <div className="static sm:absolute sm:left-1/2 sm:-translate-x-1/2">
          <SegmentControl 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
        </div>

        {/* 右側：使い方ガイド + ダークモード + プロフィール */}
        <div className="flex items-center gap-1 sm:gap-0 ml-auto">
          {/* 使い方ガイドボタン */}
          <GuideButton />
          
          {/* ダークモードトグル */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-2 py-1 sm:px-5 sm:py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center shrink-0"
            title={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
          >
            <span className="text-base">{isDarkMode ? '☀️' : '🌙'}</span>
          </button>

          {/* プロフィール → クリックでSettingsModal */}
          {user ? (
            <button
              onClick={onOpenSettingsModal}
              className="flex items-center gap-2 pl-2 pr-5 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {userIcon && (userIcon.startsWith('http://') || userIcon.startsWith('https://') || userIcon.startsWith('data:')) ? (
                <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
                  <img
                    src={userIcon}
                    alt="プロフィール"
                    className="w-full h-full rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('span')) {
                        const span = document.createElement('span');
                        span.className = 'text-base absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700';
                        span.textContent = '👤';
                        parent.appendChild(span);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <span className="text-base">👤</span>
                </div>
              )}
              <span className="text-base hidden sm:inline font-bold dark:text-white">{userName}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-5 py-2 rounded-lg bg-white text-[#e879d4] font-semibold text-base hover:bg-white/90 hover:-translate-y-0.5 transition-all"
            >
              ログイン
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ========== 使い方ガイドボタン ==========
function GuideButton() {
  const { startOnboarding, isActive } = useOnboardingContext();

  const handleClick = () => {
    if (!isActive) {
      startOnboarding();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="px-2 py-1 sm:px-5 sm:py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center shrink-0"
      title="使い方ガイド"
    >
      <span className="text-base">❓</span>
    </button>
  );
}

// ========== セグメントコントロール ==========
interface SegmentControlProps {
  activeTab: 'home' | 'mypage';
  setActiveTab: (tab: 'home' | 'mypage') => void;
}

function SegmentControl({ activeTab, setActiveTab }: SegmentControlProps) {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1">
      <button
        onClick={() => setActiveTab('home')}
        className={`px-2 py-1 sm:px-5 sm:py-2 text-xs sm:text-base font-medium rounded-full transition-all duration-200 ${
          activeTab === 'home'
            ? 'bg-white dark:bg-gray-700 text-[#e879d4] shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        ホーム
      </button>
      <button
        onClick={() => setActiveTab('mypage')}
        className={`px-2 py-1 sm:px-5 sm:py-2 text-xs sm:text-base font-medium rounded-full transition-all duration-200 ${
          activeTab === 'mypage'
            ? 'bg-white dark:bg-gray-700 text-[#e879d4] shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        マイページ
      </button>
    </div>
  );
}
