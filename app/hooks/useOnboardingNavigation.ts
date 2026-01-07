'use client';

import { useEffect } from 'react';
import { useOnboardingContext } from '../contexts/OnboardingContext';
import { useTabs } from './useTabs';

/**
 * オンボーディングステップに応じてタブを自動切り替えするフック
 */
export function useOnboardingNavigation() {
  const {
    currentStep,
    isActive,
    isCompleted,
    startOnboarding,
  } = useOnboardingContext();
  
  const {
    activeTab,
    setActiveTab,
    homeSubTab,
    setHomeSubTab,
  } = useTabs();

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

