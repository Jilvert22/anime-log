'use client';

import { useEffect, useState } from 'react';
import { useOnboardingContext } from '../../contexts/OnboardingContext';
import { CoachMark } from './CoachMark';

const ONBOARDING_STEPS = [
  {
    step: 1,
    targetSelector: '[data-onboarding="step-1"]',
    position: 'bottom' as const,
    title: 'アニメを追加しよう',
    description: '「+ アニメを追加」ボタンから、クール別にアニメを検索・追加できます。',
  },
  {
    step: 2,
    targetSelector: '[data-onboarding="step-2"]',
    position: 'bottom' as const,
    title: '積みアニメを管理',
    description: '「+ 積みアニメを追加」ボタンから、見たいアニメを積みアニメリストに追加できます。',
  },
  {
    step: 3,
    targetSelector: '[data-onboarding="step-3"]',
    position: 'bottom' as const,
    title: '今期・来期を管理',
    description: '「来期視聴予定」タブから、今期・来期の視聴予定アニメを管理できます。',
  },
  {
    step: 4,
    targetSelector: '[data-onboarding="step-4"]',
    position: 'bottom' as const,
    title: '最推し作品を設定',
    description: 'DNAカードの「最推し作品」エリアをタップして、あなたの最推し作品を設定しましょう。',
  },
];

export function OnboardingOverlay() {
  const {
    currentStep,
    isActive,
    nextStep,
    previousStep,
    skipOnboarding,
  } = useOnboardingContext();

  // タブ切り替えはHomeClientで処理されるため、ここでは何もしない

  if (!isActive || !currentStep) {
    return null;
  }

  const stepConfig = ONBOARDING_STEPS.find((s) => s.step === currentStep);
  if (!stepConfig) {
    return null;
  }

  const isLastStep = currentStep === 4;
  const showPrevious = currentStep > 1;

  return (
    <>
      {/* オーバーレイ（ターゲット以外を暗くする） */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          pointerEvents: 'auto',
        }}
        onClick={(e) => {
          // オーバーレイクリック時は何もしない（スキップを防ぐ）
          e.stopPropagation();
        }}
      />

      {/* コーチマーク */}
      <CoachMark
        targetSelector={stepConfig.targetSelector}
        position={stepConfig.position}
        title={stepConfig.title}
        description={stepConfig.description}
        onNext={nextStep}
        onPrevious={showPrevious ? previousStep : undefined}
        onSkip={skipOnboarding}
        showPrevious={showPrevious}
        showSkip={true}
        isLastStep={isLastStep}
      />
    </>
  );
}

