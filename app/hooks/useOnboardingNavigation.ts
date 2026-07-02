'use client';

import { useEffect } from 'react';
import { useOnboardingContext } from '../contexts/OnboardingContext';

/**
 * オンボーディングステップに応じてタブを自動切り替えするフック
 *
 * 注意: useTabs() は呼び出し元ごとに独立した useState を返すため、
 * このフック内で直接呼ぶと画面とは別のタブ状態を切り替えてしまい、
 * ターゲット要素が現れずオンボーディングが固まる。
 * 必ず HomeClient が描画に使っている実際のタブ状態を引数で受け取ること。
 */
export function useOnboardingNavigation({
  activeTab,
  setActiveTab,
  setHomeSubTab,
}: {
  activeTab: 'home' | 'mypage';
  setActiveTab: (tab: 'home' | 'mypage') => void;
  setHomeSubTab: (tab: 'seasons' | 'series' | 'gallery' | 'watchlist' | 'current-season') => void;
}) {
  const { currentStep, isActive, isCompleted, startOnboarding } = useOnboardingContext();

  // 初回訪問時にオンボーディングを自動開始
  useEffect(() => {
    if (!isCompleted && !isActive) {
      // 少し遅延して開始（ページ読み込み完了後）
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, isActive, startOnboarding]);

  // オンボーディングステップに応じてタブを切り替え
  useEffect(() => {
    if (!isActive || !currentStep) return;

    // Step 2: 積みアニメタブに切り替え
    if (currentStep === 2) {
      // まずホームタブに切り替え（まだの場合）
      if (activeTab !== 'home') {
        setActiveTab('home');
        // タブ切り替えを待ってからサブタブを切り替え
        setTimeout(() => {
          setHomeSubTab('watchlist');
        }, 300);
      } else {
        // 既にホームタブの場合はすぐにサブタブを切り替え
        setHomeSubTab('watchlist');
      }
    }

    // Step 3: 来期視聴予定タブに切り替え
    if (currentStep === 3) {
      // まずホームタブに切り替え（まだの場合）
      if (activeTab !== 'home') {
        setActiveTab('home');
        // タブ切り替えを待ってからサブタブを切り替え
        setTimeout(() => {
          setHomeSubTab('current-season');
        }, 300);
      } else {
        // 既にホームタブの場合はすぐにサブタブを切り替え
        setHomeSubTab('current-season');
      }
    }

    // Step 4: マイページタブに切り替え
    if (currentStep === 4) {
      if (activeTab !== 'mypage') {
        setActiveTab('mypage');
      }
    }
  }, [currentStep, isActive, activeTab, setActiveTab, setHomeSubTab]);
}
