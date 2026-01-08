'use client';

import { useState, useEffect, useCallback } from 'react';

export type OnboardingStep = 1 | 2 | 3 | 4;

interface OnboardingState {
  currentStep: OnboardingStep | null;
  isActive: boolean;
  isCompleted: boolean;
}

const ONBOARDING_STORAGE_KEY = 'onboarding-completed';
const ONBOARDING_STEP_KEY = 'onboarding-current-step';

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    currentStep: null,
    isActive: false,
    isCompleted: false,
  });

  // 初期化時にlocalStorageから状態を読み込む
  useEffect(() => {
    // テストモードの場合はオンボーディングを無効化
    const isTestMode = typeof window !== 'undefined' && (window as any).__TEST_MODE__;
    if (isTestMode) {
      setState({
        currentStep: null,
        isActive: false,
        isCompleted: true,
      });
      return;
    }

    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
    const currentStep = savedStep ? (Number.parseInt(savedStep, 10) as OnboardingStep) : null;

    setState({
      currentStep: completed ? null : (currentStep || 1),
      isActive: !completed && currentStep !== null,
      isCompleted: completed,
    });
  }, []);

  // オンボーディングを開始
  const startOnboarding = useCallback(() => {
    setState({
      currentStep: 1,
      isActive: true,
      isCompleted: false,
    });
    localStorage.setItem(ONBOARDING_STEP_KEY, '1');
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }, []);

  // 次のステップに進む
  const nextStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep === null) return prev;

      const nextStepNumber = (prev.currentStep + 1) as OnboardingStep;
      
      if (nextStepNumber > 4) {
        // すべてのステップが完了
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        localStorage.removeItem(ONBOARDING_STEP_KEY);
        return {
          currentStep: null,
          isActive: false,
          isCompleted: true,
        };
      }

      localStorage.setItem(ONBOARDING_STEP_KEY, String(nextStepNumber));
      return {
        ...prev,
        currentStep: nextStepNumber,
      };
    });
  }, []);

  // 前のステップに戻る
  const previousStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep === null || prev.currentStep <= 1) return prev;

      const prevStepNumber = (prev.currentStep - 1) as OnboardingStep;
      localStorage.setItem(ONBOARDING_STEP_KEY, String(prevStepNumber));
      return {
        ...prev,
        currentStep: prevStepNumber,
      };
    });
  }, []);

  // オンボーディングをスキップ（完了としてマーク）
  const skipOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setState({
      currentStep: null,
      isActive: false,
      isCompleted: true,
    });
  }, []);

  // オンボーディングをリセット（再開可能にする）
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setState({
      currentStep: null,
      isActive: false,
      isCompleted: false,
    });
  }, []);

  // テストモードの場合は常にオンボーディングを無効化
  const isTestMode = typeof window !== 'undefined' && (window as any).__TEST_MODE__;
  
  return {
    currentStep: isTestMode ? null : state.currentStep,
    isActive: isTestMode ? false : state.isActive,
    isCompleted: isTestMode ? true : state.isCompleted,
    startOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
    resetOnboarding,
  };
}

