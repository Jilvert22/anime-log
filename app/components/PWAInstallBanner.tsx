'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { track } from '@vercel/analytics/react';

const BANNER_DISMISSED_DATE_KEY = 'pwa-banner-dismissed-date';

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, shouldShowBanner, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // ローカルストレージから非表示フラグを確認
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // shouldShowBannerがtrueで、インストール可能で、非表示にされていない場合のみ表示
    if (shouldShowBanner && isInstallable && !isInstalled && !dismissed) {
      // 少し遅延させて表示（UX向上）
      const timer = setTimeout(() => {
        setShowBanner(true);
        // バナー表示イベントを送信
        track('pwa_install_banner_shown');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowBanner, isInstallable, isInstalled]);

  const handleInstall = async () => {
    // インストールクリックイベントを送信
    track('pwa_install_clicked', { source: 'banner' });
    const success = await install();
    if (success) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    // 非表示クリックイベントを送信
    track('pwa_install_dismissed');
    setIsDismissed(true);
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
    // 非表示日時を記録（30日後に再表示するため）
    localStorage.setItem(BANNER_DISMISSED_DATE_KEY, new Date().toISOString());
  };

  // iOS用の手動インストール案内
  const handleIOSInstall = () => {
    // インストールクリックイベントを送信（iOS）
    track('pwa_install_clicked', { source: 'banner', platform: 'ios' });
    // iOSの場合はSafariの共有メニューから「ホーム画面に追加」を案内
    alert(
      'iOSの場合:\n' +
      '1. Safariの下部にある共有ボタン（□↑）をタップ\n' +
      '2. 「ホーム画面に追加」を選択\n' +
      '3. 「追加」をタップ'
    );
    handleDismiss();
  };

  if (!showBanner || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg animate-slide-up">
      <div className="max-w-md mx-auto">
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#e879d4] to-[#f09fe3] rounded-xl text-white">
          <div className="flex-shrink-0 text-3xl">📱</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">アプリとして使う</h3>
            <p className="text-sm opacity-90 mb-3">
              ホーム画面に追加でより快適に
            </p>
            <div className="flex gap-2">
              {isIOS ? (
                <button
                  onClick={handleIOSInstall}
                  className="flex-1 px-4 py-2 bg-white text-[#e879d4] rounded-lg font-bold hover:bg-gray-100 transition-colors text-sm"
                >
                  追加する
                </button>
              ) : (
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2 bg-white text-[#e879d4] rounded-lg font-bold hover:bg-gray-100 transition-colors text-sm"
                >
                  追加する
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors text-sm"
              >
                あとで
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
            aria-label="閉じる"
          >
            <span className="text-xl">×</span>
          </button>
        </div>
      </div>
    </div>
  );
}

