'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../lib/supabase';
import type { Anime } from '../types';
import { HomeTab } from './tabs/HomeTab';
import { Navigation } from './Navigation';
import { PWAInstallBanner } from './PWAInstallBanner';
import { ErrorState } from './common/ErrorState';

// 頻繁に使わないモーダルを動的インポート
const MyPageTab = dynamic(() => import('./tabs/MyPageTab'), {
  ssr: false,
  loading: () => <div className="animate-pulse text-center py-8">読み込み中...</div>,
});
import { useAuth } from '../hooks/useAuth';
import { useUserProfileContext } from '../contexts/UserProfileContext';
import { useAnimeDataContext } from '../contexts/AnimeDataContext';
import { useTabs } from '../hooks/useTabs';
import { useDarkMode } from '../hooks/useDarkMode';
import { useCountAnimation } from '../hooks/useCountAnimation';
import { useModalHandlers } from '../hooks/useModalHandlers';
import { useCollection } from '../hooks/useCollection';
import {
  animeToSupabase,
  supabaseToAnime,
  extractSeriesName,
  getSeasonName,
} from '../utils/helpers';
import { useSeasonManagement } from '../hooks/useSeasonManagement';
import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';
import { ModalProvider, useModalContext } from '../contexts/ModalContext';
import { OnboardingOverlay } from './onboarding/OnboardingOverlay';
import { useOnboardingContext } from '../contexts/OnboardingContext';
import { HomeModals } from './HomeModals';
import { QuickStart } from './onboarding/QuickStart';
import { downloadText, recordsToJson } from '../lib/records/export';
import { useFeedback } from '../contexts/FeedbackContext';

// Server Componentで取得した初期データを受け取る場合はここに Props 型を追加する

// 内側のコンポーネント（ModalProvider内でuseModalContextを使用）
function HomeClientInner() {
  const { showToast } = useFeedback();
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  // オンボーディング管理
  const { currentStep, isActive, skipOnboarding } = useOnboardingContext();

  // 認証管理をカスタムフックで管理
  const { user, isLoading, handleLogout: logout } = useAuth();

  // シーズン管理をカスタムフックで管理
  const {
    showSeasonEndModal,
    previousSeasonItems,
    handleMoveToBacklog,
    handleDeletePreviousSeason,
    handleKeepPreviousSeason,
  } = useSeasonManagement(isLoading);

  // ダークモード管理をカスタムフックで管理
  const { isDarkMode, setIsDarkMode } = useDarkMode();

  // ユーザープロフィール管理をContextから取得（UserProfileProvider内の状態を共有）
  const {
    profile,
    avatarPublicUrl,
    saveProfile,
    saveOtakuType,
    userName,
    userIcon,
    userOtakuType,
    favoriteAnimeIds,
    setFavoriteAnimeIds,
    myProfile,
    isProfilePublic,
    userBio,
    userHandle,
  } = useUserProfileContext();

  // タブ状態管理をカスタムフックで管理
  const { activeTab, setActiveTab, homeSubTab, setHomeSubTab } = useTabs();

  // オンボーディングナビゲーション（タブ自動切り替え）
  // 画面の描画に使っている実タブ状態を渡す(独立コピーを切り替えると固まる)
  useOnboardingNavigation({ activeTab, setActiveTab, setHomeSubTab });

  // コレクション関連をカスタムフックで管理
  const { favoriteCharacters, setFavoriteCharacters } = useCollection();

  // アニメデータ管理をContextから取得
  const {
    seasons,
    setSeasons,
    expandedSeasons,
    setExpandedSeasons,
    allAnimes,
    averageRating,
    totalRewatchCount,
    loadError,
    reloadAnimeData,
    isAnimeDataReady,
    saveError,
    retrySave,
  } = useAnimeDataContext();

  // カウントアニメーションをカスタムフックで管理
  const count = useCountAnimation(allAnimes.length);

  // モーダル管理をuseModalContextに統一（ModalProvider内なので使用可能）
  const { modals, actions, formStates } = useModalContext();

  // モーダルハンドラー
  const {
    handleCharacterSave,
    handleCharacterClose,
    handleOpenAddCharacterModal,
    handleEditCharacter,
  } = useModalHandlers({
    favoriteCharacters,
    setFavoriteCharacters,
    editingCharacter: formStates.editingCharacter,
    setEditingCharacter: formStates.setEditingCharacter,
    setShowAddCharacterModal: modals.setShowAddCharacterModal,
  });

  // ログアウト処理
  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // Step 4はマイページのDNAカードを直接表示するため、モーダルは不要

  return (
    <div className="min-h-screen bg-[#fef6f0] dark:bg-gray-900">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        user={user}
        userName={userName}
        userIcon={userIcon}
        onOpenSettingsModal={() => modals.setShowSettings(true)}
        setShowAuthModal={modals.setShowAuthModal}
      />

      {/* メインコンテンツ */}
      <main className="pt-20 max-w-md md:max-w-6xl mx-auto px-4 py-6">
        {saveError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
          >
            <p>端末に記録を保存できませんでした。画面の記録はまだ保存されていません。</p>
            <button type="button" onClick={retrySave} className="mt-2 underline">
              保存を再試行
            </button>
            <button
              type="button"
              className="mt-2 ml-4 underline"
              onClick={() => {
                try {
                  downloadText(
                    recordsToJson(seasons, []),
                    'animelog-unsaved-records.json',
                    'application/json'
                  );
                } catch {
                  showToast('未保存の記録を書き出せませんでした', 'error');
                }
              }}
            >
              未保存の視聴記録を書き出す
            </button>
          </div>
        )}
        {loadError ? (
          <ErrorState message="アニメデータの読み込みに失敗しました" onRetry={reloadAnimeData} />
        ) : (
          <>
            {activeTab === 'home' && isAnimeDataReady && !isLoading && (
              <QuickStart
                count={allAnimes.length}
                onAdd={() => {
                  skipOnboarding();
                  setHomeSubTab('seasons');
                  actions.openAddForm();
                }}
                onViewCard={() => setActiveTab('mypage')}
              />
            )}
            {activeTab === 'home' && (
              <HomeTab
                homeSubTab={homeSubTab}
                setHomeSubTab={setHomeSubTab}
                expandedYears={expandedYears}
                setExpandedYears={setExpandedYears}
                onOpenAddForm={actions.openAddForm}
                setSelectedAnime={setSelectedAnime}
                user={user}
                extractSeriesName={extractSeriesName}
                getSeasonName={getSeasonName}
                supabaseToAnime={supabaseToAnime}
              />
            )}

            {activeTab === 'mypage' && (
              <MyPageTab
                allAnimes={allAnimes}
                seasons={seasons}
                averageRating={averageRating}
                favoriteCharacters={favoriteCharacters}
                setFavoriteCharacters={setFavoriteCharacters}
                setSeasons={setSeasons}
                user={user}
                supabaseClient={supabase}
                setSelectedAnime={setSelectedAnime}
                handleLogout={handleLogout}
              />
            )}
          </>
        )}
      </main>

      <HomeModals
        selectedAnime={selectedAnime}
        setSelectedAnime={setSelectedAnime}
        user={user}
        handleLogout={handleLogout}
        extractSeriesName={extractSeriesName}
        getSeasonName={getSeasonName}
        animeToSupabase={animeToSupabase}
        showSeasonEndModal={showSeasonEndModal}
        previousSeasonItems={previousSeasonItems}
        handleMoveToBacklog={handleMoveToBacklog}
        handleDeletePreviousSeason={handleDeletePreviousSeason}
        handleKeepPreviousSeason={handleKeepPreviousSeason}
        currentStep={currentStep ?? undefined}
        isActive={isActive}
        skipOnboarding={skipOnboarding}
        count={count}
        handleCharacterSave={handleCharacterSave}
        handleCharacterClose={handleCharacterClose}
      />

      {/* PWAインストールバナー */}
      <PWAInstallBanner />

      {/* オンボーディングオーバーレイ */}
      <OnboardingOverlay />
    </div>
  );
}

// 外側のコンポーネント（ModalProviderでラップ）
export default function HomeClient() {
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  return (
    <ModalProvider setSelectedAnime={setSelectedAnime}>
      <HomeClientInner />
    </ModalProvider>
  );
}
