'use client';

import { useEffect } from 'react';
import type { HomeSubTab } from '../types';
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
  setHomeSubTab: (tab: HomeSubTab) => void;
}) {
  const { currentStep, isActive } = useOnboardingContext();

  // 初回は QuickStart から実際の登録へ案内する。機能ツアーはヘルプから任意で開始。

  // オンボーディングステップに応じてタブを切り替え
  useEffect(() => {
    if (!isActive || !currentStep) return;

    if (currentStep === 1) setHomeSubTab('seasons');
    if (currentStep === 2) setHomeSubTab('watchlist');
    if (currentStep === 3) setHomeSubTab('current-season');
    if (currentStep === 4 && activeTab !== 'mypage') setActiveTab('mypage');
  }, [currentStep, isActive, activeTab, setActiveTab, setHomeSubTab]);
}
