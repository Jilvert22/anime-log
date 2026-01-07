'use client';

import { useState, useEffect } from 'react';
import { track } from '@vercel/analytics/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const VISIT_COUNT_KEY = 'pwa-visit-count';
const FIRST_VISIT_DATE_KEY = 'pwa-first-visit-date';
const BANNER_DISMISSED_DATE_KEY = 'pwa-banner-dismissed-date';
const MIN_VISIT_COUNT = 3;
const DAYS_BEFORE_REPEAT = 30;

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [shouldShowBanner, setShouldShowBanner] = useState(false);

  useEffect(() => {
    // iOS判定
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // スタンドアロンモード（既にインストール済み）判定
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    // 訪問回数をカウント
    const updateVisitCount = () => {
      try {
        const visitCountStr = localStorage.getItem(VISIT_COUNT_KEY);
        const visitCount = visitCountStr ? Number.parseInt(visitCountStr, 10) : 0;
        const newCount = visitCount + 1;
        localStorage.setItem(VISIT_COUNT_KEY, String(newCount));

        // 初回訪問日を記録
        if (!localStorage.getItem(FIRST_VISIT_DATE_KEY)) {
          localStorage.setItem(FIRST_VISIT_DATE_KEY, new Date().toISOString());
        }

        // バナー表示条件をチェック
        const firstVisitDateStr = localStorage.getItem(FIRST_VISIT_DATE_KEY);
        const dismissedDateStr = localStorage.getItem(BANNER_DISMISSED_DATE_KEY);
        
        if (firstVisitDateStr) {
          const firstVisitDate = new Date(firstVisitDateStr);
          const now = new Date();
          const daysSinceFirstVisit = Math.floor(
            (now.getTime() - firstVisitDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          // 30日以上経過しているかチェック
          const daysSinceDismissed = dismissedDateStr
            ? Math.floor((now.getTime() - new Date(dismissedDateStr).getTime()) / (1000 * 60 * 60 * 24))
            : Infinity;

          // 条件: 3回目以降 + 未インストール + 30日経過 + 最後の非表示から30日経過
          if (
            newCount >= MIN_VISIT_COUNT &&
            !standalone &&
            daysSinceFirstVisit >= DAYS_BEFORE_REPEAT &&
            daysSinceDismissed >= DAYS_BEFORE_REPEAT
          ) {
            setShouldShowBanner(true);
          }
        }
      } catch (error) {
        console.error('訪問回数の更新に失敗しました:', error);
      }
    };

    updateVisitCount();

    // beforeinstallpromptイベントをキャッチ
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // appinstalledイベント（インストール完了時）
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShouldShowBanner(false);
      // インストール成功イベントを送信
      track('pwa_install_success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('PWAインストールエラー:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    shouldShowBanner,
    install,
  };
}

