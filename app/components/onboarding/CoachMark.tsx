'use client';

import { useEffect, useRef, useState } from 'react';

interface CoachMarkProps {
  targetSelector: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  title: string;
  description: string;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  showPrevious?: boolean;
  showSkip?: boolean;
  isLastStep?: boolean;
}

export function CoachMark({
  targetSelector,
  position = 'bottom',
  title,
  description,
  onNext,
  onPrevious,
  onSkip,
  showPrevious = false,
  showSkip = true,
  isLastStep = false,
}: CoachMarkProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [coachMarkStyle, setCoachMarkStyle] = useState<React.CSSProperties>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  // ターゲット要素の位置を取得して更新
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10; // 最大10回リトライ（約2秒）
    const retryInterval = 200; // 200msごとにリトライ

    const updatePosition = () => {
      const target = document.querySelector(targetSelector);
      if (!target) {
        // ターゲットが見つからない場合はリトライ
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updatePosition, retryInterval);
          return;
        }
        // 最大リトライ回数に達した場合は中央に表示
        setCoachMarkStyle({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
        });
        setTargetRect(null);
        return;
      }

      // ターゲットが見つかったらリトライカウントをリセット
      retryCount = 0;

      // 要素が表示されているか確認（display: none や visibility: hidden でないか）
      const computedStyle = window.getComputedStyle(target);
      if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        // 非表示の場合は少し待ってから再試行
        setTimeout(updatePosition, retryInterval);
        return;
      }

      // ターゲットが画面外の場合はスクロール
      // モバイルでも確実に画面内に表示されるように、block: 'center' を使用
      // モバイルブラウザのアドレスバーを考慮して、少し余裕を持たせる
      const rectBeforeScroll = target.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      
      target.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center', 
        inline: 'center' 
      });

      // モバイルの場合、さらに少し上にスクロールしてアドレスバーを考慮
      if (isMobile && rectBeforeScroll.top < 100) {
        setTimeout(() => {
          window.scrollBy({
            top: -50, // 少し上にスクロール
            behavior: 'smooth'
          });
        }, 100);
      }

      // スクロールアニメーション完了後、さらに少し待ってから位置を取得
      setTimeout(() => {
        const rect = target.getBoundingClientRect();
        
        // 要素が画面内にあるか確認
        const isInViewport = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        // 画面外の場合は再度スクロール
        if (!isInViewport) {
          target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center', 
            inline: 'center' 
          });
          setTimeout(() => {
            const newRect = target.getBoundingClientRect();
            setTargetRect(newRect);
            updateCoachMarkPosition(newRect);
          }, 500);
        } else {
          setTargetRect(rect);
          updateCoachMarkPosition(rect);
        }
      }, 500); // スクロールアニメーション完了を待つ
    };

    const updateCoachMarkPosition = (rect: DOMRect) => {
      // 吹き出しの位置を計算
      const gap = 12;
      let top = 0;
      let left = 0;
      let shouldCenter = false;

      switch (position) {
        case 'top':
          top = rect.top - gap;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          // ターゲット要素が画面の上部にある場合（top < 200px）、コーチマークを画面の見やすい位置に表示
          if (rect.top < 200) {
            // 画面の中央より少し上に表示
            top = window.innerHeight * 0.4;
            left = window.innerWidth / 2;
            shouldCenter = true;
          } else {
            top = rect.bottom + gap;
            // ターゲット要素が左端にある場合（left < 100px）、コーチマークを中央寄りに表示
            if (rect.left < 100) {
              left = Math.max(rect.left + rect.width / 2, 200); // 最低200px右に
            } else {
              left = rect.left + rect.width / 2;
            }
          }
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - gap;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + gap;
          break;
        case 'center':
          top = rect.top + rect.height / 2;
          left = rect.left + rect.width / 2;
          shouldCenter = true;
          break;
      }

      setCoachMarkStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        transform: shouldCenter
          ? 'translate(-50%, -50%)' 
          : position === 'left' || position === 'right'
          ? 'translateY(-50%)'
          : 'translateX(-50%)',
        zIndex: 10000,
      });
    };

    // 初回実行
    updatePosition();

    // リサイズやスクロール時に位置を更新
    const handleResize = () => {
      const target = document.querySelector(targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        updateCoachMarkPosition(rect);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [targetSelector, position]);

  if (!targetRect && position !== 'center') {
    return null;
  }

  return (
    <>
      {/* ハイライトオーバーレイ */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 4px #e879d4',
            pointerEvents: 'none',
            zIndex: 9999,
            transition: 'all 0.3s ease',
          }}
        />
      )}

      {/* 吹き出し */}
      <div
        ref={overlayRef}
        style={coachMarkStyle}
        className="coach-mark-tooltip"
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm"
          style={{
            border: '2px solid #e879d4',
          }}
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {description}
          </p>

          {/* ボタン */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {showPrevious && onPrevious && (
                <button
                  onClick={onPrevious}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  戻る
                </button>
              )}
              {showSkip && onSkip && (
                <button
                  onClick={onSkip}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  スキップ
                </button>
              )}
            </div>
            {onNext && (
              <button
                onClick={onNext}
                className="px-6 py-2 text-sm font-bold text-white bg-[#e879d4] rounded-lg hover:bg-[#d45dbf] transition-colors"
              >
                {isLastStep ? '完了' : '次へ'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

