'use client';

import type { User } from '@supabase/supabase-js';

interface NavigationProps {
  activeTab: 'home' | 'discover' | 'collection' | 'profile';
  setActiveTab: (tab: 'home' | 'discover' | 'collection' | 'profile') => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
  user: User | null;
  userName: string;
  userIcon: string;
  setShowSettings: (show: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
}

export function Navigation({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  user,
  userName,
  userIcon,
  setShowSettings,
  setShowAuthModal,
}: NavigationProps) {
  return (
    <>
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10 lg:ml-[200px]">
        <div className="max-w-md md:max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 
            className="text-xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #e879d4 50%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            アニメログ
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            {user ? (
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {userIcon && (userIcon.startsWith('http://') || userIcon.startsWith('https://') || userIcon.startsWith('data:')) ? (
                  <img
                    src={userIcon}
                    alt="アイコン"
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const span = document.createElement('span');
                        span.className = 'text-2xl';
                        span.textContent = '👤';
                        parent.insertBefore(span, target);
                      }
                    }}
                  />
                ) : (
                  <span className="text-2xl">{userIcon || '👤'}</span>
                )}
                <span className="font-bold text-sm dark:text-white">{userName}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 rounded-lg bg-white text-[#e879d4] font-semibold text-sm hover:bg-white/90 hover:-translate-y-0.5 transition-all"
              >
                ログイン
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ボトムナビゲーション（スマホ・タブレット） */}
      <nav className="block lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-10">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-4">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
                activeTab === 'home'
                  ? 'text-[#e879d4] dark:text-[#e879d4]'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className={`text-2xl transition-transform ${activeTab === 'home' ? 'scale-110' : 'scale-100'}`}>
                📺
              </span>
              <span className="text-xs font-medium mt-1">ホーム</span>
            </button>
            
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
                activeTab === 'discover'
                  ? 'text-[#e879d4] dark:text-[#e879d4]'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className={`text-2xl transition-transform ${activeTab === 'discover' ? 'scale-110' : 'scale-100'}`}>
                📊
              </span>
              <span className="text-xs font-medium mt-1">統計</span>
            </button>
            
            <button
              onClick={() => setActiveTab('collection')}
              className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
                activeTab === 'collection'
                  ? 'text-[#e879d4] dark:text-[#e879d4]'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className={`text-2xl transition-transform ${activeTab === 'collection' ? 'scale-110' : 'scale-100'}`}>
                🏆
              </span>
              <span className="text-xs font-medium mt-1">コレクション</span>
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'text-[#e879d4] dark:text-[#e879d4]'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className={`text-2xl transition-transform ${activeTab === 'profile' ? 'scale-110' : 'scale-100'}`}>
                👤
              </span>
              <span className="text-xs font-medium mt-1">マイページ</span>
            </button>
          </div>
        </div>
      </nav>

      {/* サイドバーナビゲーション（PC） */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[200px] bg-white dark:bg-gray-800 border-r dark:border-gray-700 z-10 flex-col pt-20">
        <div className="flex flex-col gap-1 p-3">
          <button
            onClick={() => setActiveTab('home')}
            className={`relative flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${
              activeTab === 'home'
                ? 'text-[#e879d4] font-semibold border border-[#e879d4]/20'
                : 'text-gray-500 dark:text-gray-400 font-medium hover:bg-[#e879d4]/8 hover:text-[#e879d4]'
            }`}
            style={activeTab === 'home' ? { background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(232, 121, 212, 0.15) 100%)' } : undefined}
          >
            {activeTab === 'home' && (
              <span 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r"
                style={{
                  background: 'linear-gradient(180deg, #667eea 0%, #e879d4 100%)'
                }}
              />
            )}
            <span className="text-lg w-6 text-center">📺</span>
            <span>ホーム</span>
          </button>
          
          <button
            onClick={() => setActiveTab('discover')}
            className={`relative flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${
              activeTab === 'discover'
                ? 'text-[#e879d4] font-semibold border border-[#e879d4]/20'
                : 'text-gray-500 dark:text-gray-400 font-medium hover:bg-[#e879d4]/8 hover:text-[#e879d4]'
            }`}
            style={activeTab === 'discover' ? { background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(232, 121, 212, 0.15) 100%)' } : undefined}
          >
            {activeTab === 'discover' && (
              <span 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r"
                style={{
                  background: 'linear-gradient(180deg, #667eea 0%, #e879d4 100%)'
                }}
              />
            )}
            <span className="text-lg w-6 text-center">📊</span>
            <span>統計</span>
          </button>
          
          <button
            onClick={() => setActiveTab('collection')}
            className={`relative flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${
              activeTab === 'collection'
                ? 'text-[#e879d4] font-semibold border border-[#e879d4]/20'
                : 'text-gray-500 dark:text-gray-400 font-medium hover:bg-[#e879d4]/8 hover:text-[#e879d4]'
            }`}
            style={activeTab === 'collection' ? { background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(232, 121, 212, 0.15) 100%)' } : undefined}
          >
            {activeTab === 'collection' && (
              <span 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r"
                style={{
                  background: 'linear-gradient(180deg, #667eea 0%, #e879d4 100%)'
                }}
              />
            )}
            <span className="text-lg w-6 text-center">🏆</span>
            <span>コレクション</span>
          </button>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`relative flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'text-[#e879d4] font-semibold border border-[#e879d4]/20'
                : 'text-gray-500 dark:text-gray-400 font-medium hover:bg-[#e879d4]/8 hover:text-[#e879d4]'
            }`}
            style={activeTab === 'profile' ? { background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(232, 121, 212, 0.15) 100%)' } : undefined}
          >
            {activeTab === 'profile' && (
              <span 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r"
                style={{
                  background: 'linear-gradient(180deg, #667eea 0%, #e879d4 100%)'
                }}
              />
            )}
            <span className="text-lg w-6 text-center">👤</span>
            <span>マイページ</span>
          </button>
        </div>
      </nav>
    </>
  );
}

