'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../lib/supabase';
import type { Anime } from '../types';
import { HomeTab } from './tabs/HomeTab';
import { Navigation } from './Navigation';
import { PWAInstallBanner } from './PWAInstallBanner';

// 頻繁に使わないモーダルを動的インポート
const MyPageTab = dynamic(() => import('./tabs/MyPageTab'), {
  ssr: false,
  loading: () => <div className="animate-pulse text-center py-8">読み込み中...</div>,
});
import { useAnimeReviews } from '../hooks/useAnimeReviews';
import { useAuth } from '../hooks/useAuth';
import { useUserProfileContext } from '../contexts/UserProfileContext';
import { useAnimeDataContext } from '../contexts/AnimeDataContext';
import { useTabs } from '../hooks/useTabs';
import { useDarkMode } from '../hooks/useDarkMode';
import { useCountAnimation } from '../hooks/useCountAnimation';
import { useModalHandlers } from '../hooks/useModalHandlers';
import { useCollection } from '../hooks/useCollection';
import { animeToSupabase, supabaseToAnime, extractSeriesName, getSeasonName } from '../utils/helpers';
import { useSeasonManagement } from '../hooks/useSeasonManagement';
import { useOnboardingNavigation } from '../hooks/useOnboardingNavigation';
import { ModalProvider, useModalContext } from '../contexts/ModalContext';
import { OnboardingOverlay } from './onboarding/OnboardingOverlay';
import { useOnboardingContext } from '../contexts/OnboardingContext';
import { HomeModals } from './HomeModals';


interface HomeClientProps {
  // Server Componentで取得した初期データがあればここに追加
}

// 内側のコンポーネント（ModalProvider内でuseModalContextを使用）
function HomeClientInner() {
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  
  // オンボーディング管理
  const {
    currentStep,
    isActive,
    skipOnboarding,
  } = useOnboardingContext();
  
  // オンボーディングナビゲーション（タブ自動切り替え）
  useOnboardingNavigation();
  
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
  const {
    activeTab,
    setActiveTab,
    homeSubTab,
    setHomeSubTab,
  } = useTabs();
  
  // コレクション関連をカスタムフックで管理
  const {
    favoriteCharacters,
    setFavoriteCharacters,
  } = useCollection();
  
  // アニメデータ管理をContextから取得
  const {
    seasons,
    setSeasons,
    expandedSeasons,
    setExpandedSeasons,
    allAnimes,
    averageRating,
    totalRewatchCount,
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
  
  // レビュー関連の状態をカスタムフックで管理
  const {
    loadReviews,
  } = useAnimeReviews(user);

  // ログアウト処理
  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleReviewPosted = useCallback(async () => {
    if (selectedAnime) {
      await loadReviews(selectedAnime.id);
    }
  }, [selectedAnime, loadReviews]);

  // アニメが選択されたときに感想を読み込む
  useEffect(() => {
    if (selectedAnime) {
      loadReviews(selectedAnime.id);
    }
  }, [selectedAnime?.id, loadReviews]);

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
            animeToSupabase={animeToSupabase}
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
        onReviewPosted={handleReviewPosted}
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
export default function HomeClient({}: HomeClientProps) {
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  return (
    <ModalProvider setSelectedAnime={setSelectedAnime}>
      <HomeClientInner />
    </ModalProvider>
  );
}

