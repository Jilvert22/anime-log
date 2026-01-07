'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../lib/supabase';
import type { 
  Season, 
  Anime
} from '../types';
import type { UserProfile } from '../lib/api';
import { HomeTab } from './tabs/HomeTab';
import { Navigation } from './Navigation';
import { PWAInstallBanner } from './PWAInstallBanner';

// モーダルを動的インポート（初期バンドルサイズの削減）
const ReviewModal = dynamic(() => import('./modals/ReviewModal').then(mod => ({ default: mod.ReviewModal })), {
  ssr: false,
});

const SettingsModal = dynamic(() => import('./modals/SettingsModal').then(mod => ({ default: mod.SettingsModal })), {
  ssr: false,
});

const AuthModal = dynamic(() => import('./modals/AuthModal').then(mod => ({ default: mod.AuthModal })), {
  ssr: false,
});

const FavoriteAnimeModal = dynamic(() => import('./modals/FavoriteAnimeModal').then(mod => ({ default: mod.FavoriteAnimeModal })), {
  ssr: false,
});

const AddAnimeFormModal = dynamic(() => import('./modals/AddAnimeFormModal').then(mod => ({ default: mod.AddAnimeFormModal })), {
  ssr: false,
});

const AnimeDetailModal = dynamic(() => import('./modals/AnimeDetailModal').then(mod => ({ default: mod.AnimeDetailModal })), {
  ssr: false,
});

// 頻繁に使わないモーダルを動的インポート
const MyPageTab = dynamic(() => import('./tabs/MyPageTab'), {
  ssr: false,
  loading: () => <div className="animate-pulse text-center py-8">読み込み中...</div>,
});

const SongModal = dynamic(() => import('./modals/SongModal').then(mod => ({ default: mod.SongModal })), {
  ssr: false,
});

const UserProfileModal = dynamic(() => import('./modals/UserProfileModal').then(mod => ({ default: mod.UserProfileModal })), {
  ssr: false,
});

const FollowListModal = dynamic(() => import('./modals/FollowListModal').then(mod => ({ default: mod.FollowListModal })), {
  ssr: false,
});

const AddCharacterModal = dynamic(() => import('./modals/AddCharacterModal').then(mod => ({ default: mod.AddCharacterModal })), {
  ssr: false,
});

const AddQuoteModal = dynamic(() => import('./modals/AddQuoteModal').then(mod => ({ default: mod.AddQuoteModal })), {
  ssr: false,
});

const DNAModal = dynamic(() => import('./modals/DNAModal').then(mod => ({ default: mod.DNAModal })), {
  ssr: false,
});

const SeasonEndModal = dynamic(() => import('./modals/SeasonEndModal').then(mod => ({ default: mod.SeasonEndModal })), {
  ssr: false,
});
import { useAnimeReviews } from '../hooks/useAnimeReviews';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { useUserProfileContext } from '../contexts/UserProfileContext';
import { useAnimeDataContext } from '../contexts/AnimeDataContext';
import { useModals } from '../hooks/useModals';
import { useFormStates } from '../hooks/useFormStates';
import { useModalActions } from '../hooks/useModalActions';
import { useCollection } from '../hooks/useCollection';
import { useTabs } from '../hooks/useTabs';
import { useDarkMode } from '../hooks/useDarkMode';
import { useCountAnimation } from '../hooks/useCountAnimation';
import { useModalHandlers } from '../hooks/useModalHandlers';
import { animeToSupabase, supabaseToAnime, extractSeriesName, getSeasonName, shouldShowSeasonStartModal, markSeasonChecked } from '../utils/helpers';
import type { WatchlistItem } from '../lib/storage/types';
import { useStorage } from '../hooks/useStorage';
import { ModalProvider, useModalContext } from '../contexts/ModalContext';
import { OnboardingOverlay } from './onboarding/OnboardingOverlay';
import { useOnboardingContext } from '../contexts/OnboardingContext';

// FavoriteAnimeModalを表示する内部コンポーネント（ModalContextを使用）
function FavoriteAnimeModalWrapper({
  allAnimes,
  favoriteAnimeIds,
  setFavoriteAnimeIds,
}: {
  allAnimes: Anime[];
  favoriteAnimeIds: number[];
  setFavoriteAnimeIds: (ids: number[]) => void;
}) {
  const { modals, actions } = useModalContext();
  
  return (
    <FavoriteAnimeModal
      show={modals.showFavoriteAnimeModal}
      onClose={actions.closeFavoriteAnimeModal}
      allAnimes={allAnimes}
      favoriteAnimeIds={favoriteAnimeIds}
      setFavoriteAnimeIds={setFavoriteAnimeIds}
    />
  );
}

interface HomeClientProps {
  // Server Componentで取得した初期データがあればここに追加
}

export default function HomeClient({}: HomeClientProps) {
  const storage = useStorage();
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [showSeasonEndModal, setShowSeasonEndModal] = useState(false);
  const [previousSeasonItems, setPreviousSeasonItems] = useState<WatchlistItem[]>([]);
  
  // オンボーディング管理
  const {
    currentStep,
    isActive,
    isCompleted,
    startOnboarding,
    nextStep,
    skipOnboarding,
  } = useOnboardingContext();
  
  // 認証管理をカスタムフックで管理
  const { user, isLoading, handleLogout: logout } = useAuth();
  
  // ダークモード管理をカスタムフックで管理
  const { isDarkMode, setIsDarkMode } = useDarkMode();
  
  // ユーザープロフィール管理をContextから取得（UserProfileProvider内の状態を共有）
  const {
    profile,
    loading: profileLoading,
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
  
  // モーダル状態管理（HomeClient内でまだ使用中）
  // MyPageTab等ではuseModalContextを使用
  const {
    showSettings,
    setShowSettings,
    showAddForm,
    setShowAddForm,
    showDNAModal,
    setShowDNAModal,
    showAuthModal,
    setShowAuthModal,
    showAddCharacterModal,
    setShowAddCharacterModal,
    showAddQuoteModal,
    setShowAddQuoteModal,
    showSongModal,
    setShowSongModal,
    showReviewModal,
    setShowReviewModal,
  } = useModals();
  
  // フォーム状態管理
  const {
    editingCharacter,
    setEditingCharacter,
    characterFilter,
    setCharacterFilter,
    editingQuote,
    setEditingQuote,
    quoteSearchQuery,
    setQuoteSearchQuery,
    quoteFilterType,
    setQuoteFilterType,
    selectedAnimeForFilter,
    setSelectedAnimeForFilter,
  } = useFormStates();
  
  // モーダルハンドラー
  const {
    handleCharacterSave,
    handleCharacterClose,
    handleOpenAddCharacterModal,
    handleEditCharacter,
  } = useModalHandlers({
    favoriteCharacters,
    setFavoriteCharacters,
    editingCharacter,
    setEditingCharacter,
    setShowAddCharacterModal,
  });
  
  // モーダルアクション
  const {
    openAddForm,
    closeAddForm,
    closeReviewModal,
    closeSettings,
    closeAuthModal,
    openAddQuoteModal,
    closeAddQuoteModal,
    saveAddQuoteModal,
    editQuote,
    closeSongModal,
    closeDNAModal,
  } = useModalActions({
    setShowAddForm,
    setShowReviewModal,
    setShowSettings,
    setShowFavoriteAnimeModal: () => {}, // ModalContextで管理されるため、ここでは空関数
    setShowAuthModal,
    setShowAddQuoteModal,
    setShowSongModal,
    setShowDNAModal,
    setEditingQuote,
    setSelectedAnime,
    allAnimes,
  });
  
  // TODO: SNS機能実装時にuseSocialを有効化
  // 現在はダミー値を使用（フォロー/フォロワー機能は未実装）
  // 実装時は以下のコメントを外し、useSocialフックを使用してください：
  // const {
  //   userSearchQuery,
  //   setUserSearchQuery,
  //   searchedUsers,
  //   isSearchingUsers,
  //   selectedUserProfile,
  //   setSelectedUserProfile,
  //   selectedUserAnimes,
  //   setSelectedUserAnimes,
  //   showUserProfileModal,
  //   setShowUserProfileModal,
  //   userFollowStatus,
  //   setUserFollowStatus,
  //   followCounts,
  //   setFollowCounts,
  //   showFollowListModal,
  //   setShowFollowListModal,
  //   followListType,
  //   setFollowListType,
  //   followListUsers,
  //   setFollowListUsers,
  //   handleUserSearch,
  //   handleViewUserProfile,
  //   handleToggleFollow,
  // } = useSocial(user);
  
  // ダミー値（SNS機能未実装時のプレースホルダー）
  const userSearchQuery = '';
  const setUserSearchQuery = () => {};
  const searchedUsers: UserProfile[] = [];
  const isSearchingUsers = false;
  const selectedUserProfile: UserProfile | null = null;
  const setSelectedUserProfile = () => {};
  const selectedUserAnimes: Anime[] = [];
  const setSelectedUserAnimes = () => {};
  const showUserProfileModal = false;
  const setShowUserProfileModal = (_value: boolean) => {};
  const userFollowStatus: { [key: string]: boolean } = {};
  const setUserFollowStatus = (_value: { [key: string]: boolean }) => {};
  const followCounts = { following: 0, followers: 0 };
  const setFollowCounts = (_value: { following: number; followers: number }) => {};
  const showFollowListModal = false;
  const setShowFollowListModal = (_value: boolean) => {};
  const followListType: 'following' | 'followers' = 'following';
  const setFollowListType = (_value: 'following' | 'followers') => {};
  const followListUsers: UserProfile[] = [];
  const setFollowListUsers = (_value: UserProfile[]) => {};
  const handleUserSearch = async () => {};
  const handleViewUserProfile = async () => {};
  const handleToggleFollow = async () => {};
  
  // レビュー関連の状態をカスタムフックで管理
  const {
    animeReviews,
    loadingReviews,
    reviewFilter,
    setReviewFilter,
    reviewSort,
    setReviewSort,
    userSpoilerHidden,
    setUserSpoilerHidden,
    expandedSpoilerReviews,
    setExpandedSpoilerReviews,
    loadReviews,
  } = useAnimeReviews(user);

  // ログアウト処理
  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // ダミーのモーダルハンドラ（SNS機能未実装のため）
  const handleCloseUserProfileModal = useCallback(() => {
    setShowUserProfileModal(false);
  }, []);

  const handleCloseFollowListModal = useCallback(() => {
    setShowFollowListModal(false);
  }, []);

  const handleReviewPosted = useCallback(async () => {
    if (selectedAnime) {
      await loadReviews(selectedAnime.id);
    }
  }, [selectedAnime, loadReviews]);
  
  // 今期の視聴予定アニメを積みアニメに移動
  const handleMoveToBacklog = useCallback(async () => {
    if (previousSeasonItems.length === 0) return;

    try {
      for (const item of previousSeasonItems) {
        await storage.updateWatchlistItem(item.anilist_id, {
          status: null,
          season_year: null,
          season: null,
        });
      }
      markSeasonChecked(); // 確認済みとしてマーク
      setShowSeasonEndModal(false);
      setPreviousSeasonItems([]);
    } catch (error) {
      console.error('積みアニメへの移動に失敗しました:', error);
      alert('積みアニメへの移動に失敗しました');
    }
  }, [storage, previousSeasonItems]);

  // 今期の視聴予定アニメを削除
  const handleDeletePreviousSeason = useCallback(async () => {
    if (previousSeasonItems.length === 0) return;

    try {
      for (const item of previousSeasonItems) {
        await storage.removeFromWatchlist(item.anilist_id);
      }
      markSeasonChecked(); // 確認済みとしてマーク
      setShowSeasonEndModal(false);
      setPreviousSeasonItems([]);
    } catch (error) {
      console.error('削除に失敗しました:', error);
      alert('削除に失敗しました');
    }
  }, [storage, previousSeasonItems]);

  // 視聴中に移行
  const handleKeepPreviousSeason = useCallback(async () => {
    if (previousSeasonItems.length === 0) return;
    
    try {
      // 各アイテムのステータスをwatchingに変更
      for (const item of previousSeasonItems) {
        if (item.anilist_id) {
          await storage.updateWatchlistItem(item.anilist_id, { status: 'watching' });
        }
      }
      markSeasonChecked(); // 確認済みとしてマーク
      // 状態更新を次のイベントループで実行して、Reactの再レンダリングサイクルを避ける
      setTimeout(() => {
        setShowSeasonEndModal(false);
        setPreviousSeasonItems([]);
      }, 0);
    } catch (error) {
      console.error('視聴中への移行に失敗しました:', error);
      alert('視聴中への移行に失敗しました');
      // エラー時もモーダルを閉じる
      setTimeout(() => {
        setShowSeasonEndModal(false);
      }, 0);
    }
  }, [storage, previousSeasonItems]);

  // シーズン開始時のチェック（アプリ起動時）
  // 「来期」が「今期」になった時点で、視聴予定（planned）のアニメをチェック
  // メインスレッドをブロックしないように遅延実行
  useEffect(() => {
    // 初期レンダリング後に実行（メインスレッドのブロッキングを回避）
    const timeoutId = setTimeout(() => {
      const checkSeasonStart = async () => {
        if (isLoading) return;
        
        // 既に今シーズンの確認済みフラグがある場合はスキップ
        if (!shouldShowSeasonStartModal()) {
          return;
        }
        
        try {
          const items = await storage.getCurrentSeasonWatchlist('planned');
          if (items.length > 0) {
            setPreviousSeasonItems(items);
            setShowSeasonEndModal(true);
          } else {
            // 視聴予定アニメがなくても確認済みとしてマーク
            markSeasonChecked();
          }
        } catch (error) {
          console.error('シーズン開始チェックに失敗しました:', error);
        }
      };

      checkSeasonStart();
    }, 100); // 100ms遅延して実行

    return () => clearTimeout(timeoutId);
  }, [storage, isLoading]);

  // アニメが選択されたときに感想を読み込む
  useEffect(() => {
    if (selectedAnime) {
      loadReviews(selectedAnime.id);
    }
  }, [selectedAnime?.id, loadReviews]);

  // 初回訪問時にオンボーディングを自動開始
  useEffect(() => {
    if (!isLoading && !isCompleted && !isActive) {
      // 少し遅延して開始（ページ読み込み完了後）
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isCompleted, isActive, startOnboarding]);

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
  }, [currentStep, isActive, activeTab, setActiveTab, setHomeSubTab, showDNAModal]);

  // Step 4はマイページのDNAカードを直接表示するため、モーダルは不要

  return (
    <ModalProvider setSelectedAnime={setSelectedAnime}>
      <div className="min-h-screen bg-[#fef6f0] dark:bg-gray-900">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        user={user}
        userName={userName}
        userIcon={userIcon}
        onOpenSettingsModal={() => setShowSettings(true)}
        setShowAuthModal={setShowAuthModal}
      />

      {/* メインコンテンツ */}
      <main className="pt-20 max-w-md md:max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'home' && (
          <HomeTab
            homeSubTab={homeSubTab}
            setHomeSubTab={setHomeSubTab}
            expandedYears={expandedYears}
            setExpandedYears={setExpandedYears}
            onOpenAddForm={openAddForm}
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

      <AddAnimeFormModal
        show={showAddForm}
        onClose={closeAddForm}
        seasons={seasons}
        setSeasons={setSeasons}
        expandedSeasons={expandedSeasons}
        setExpandedSeasons={setExpandedSeasons}
        user={user}
        extractSeriesName={extractSeriesName}
        getSeasonName={getSeasonName}
        animeToSupabase={animeToSupabase}
      />

      {/* 感想投稿モーダル */}
      <ReviewModal
        show={showReviewModal}
        onClose={closeReviewModal}
        selectedAnime={selectedAnime}
        user={user}
        userName={userName}
        userIcon={userIcon}
        onReviewPosted={handleReviewPosted}
      />

      <SettingsModal
        show={showSettings}
        onClose={closeSettings}
        profile={profile}
        avatarPublicUrl={avatarPublicUrl}
        saveProfile={saveProfile}
        user={user}
        handleLogout={handleLogout}
      />

      <FavoriteAnimeModalWrapper
        allAnimes={allAnimes}
        favoriteAnimeIds={favoriteAnimeIds}
        setFavoriteAnimeIds={setFavoriteAnimeIds}
      />

      <UserProfileModal
        show={showUserProfileModal}
        onClose={handleCloseUserProfileModal}
        selectedUserProfile={selectedUserProfile}
        selectedUserAnimes={selectedUserAnimes}
        user={user}
        userFollowStatus={userFollowStatus}
        onToggleFollow={handleToggleFollow}
        onAnimeClick={setSelectedAnime}
      />

      <FollowListModal
        show={showFollowListModal}
        onClose={handleCloseFollowListModal}
        user={user}
        followListType={followListType}
        setFollowListType={setFollowListType}
        followListUsers={followListUsers}
        setFollowListUsers={setFollowListUsers}
        userFollowStatus={userFollowStatus}
        onViewUserProfile={handleViewUserProfile}
        onToggleFollow={handleToggleFollow}
      />

      {/* 認証モーダル */}
      <AuthModal
        show={showAuthModal}
        onClose={closeAuthModal}
        onAuthSuccess={() => {
          // 認証成功後の処理（必要に応じて）
        }}
      />

      {/* アニメ詳細モーダル */}
      {selectedAnime && (
        <AnimeDetailModal
          selectedAnime={selectedAnime}
          setSelectedAnime={setSelectedAnime}
          seasons={seasons}
          setSeasons={setSeasons}
          user={user}
          supabase={supabase}
          animeReviews={animeReviews}
          loadingReviews={loadingReviews}
          loadReviews={loadReviews}
          reviewFilter={reviewFilter}
          setReviewFilter={setReviewFilter}
          reviewSort={reviewSort}
          setReviewSort={setReviewSort}
          userSpoilerHidden={userSpoilerHidden}
          setUserSpoilerHidden={setUserSpoilerHidden}
          expandedSpoilerReviews={expandedSpoilerReviews}
          setExpandedSpoilerReviews={setExpandedSpoilerReviews}
          setShowReviewModal={setShowReviewModal}
          setShowSongModal={setShowSongModal}
        />
      )}

      <AddCharacterModal
        show={showAddCharacterModal}
        onClose={handleCharacterClose}
        allAnimes={allAnimes}
        editingCharacter={editingCharacter}
        onSave={handleCharacterSave}
      />

      <AddQuoteModal
        show={showAddQuoteModal}
        onClose={closeAddQuoteModal}
        allAnimes={allAnimes}
        seasons={seasons}
        setSeasons={setSeasons}
        user={user}
        editingQuote={editingQuote}
        onSave={saveAddQuoteModal}
      />

      <SongModal
        show={showSongModal}
        onClose={closeSongModal}
        selectedAnime={selectedAnime}
        setSelectedAnime={setSelectedAnime}
        allAnimes={allAnimes}
        seasons={seasons}
        setSeasons={setSeasons}
        user={user}
        initialSongType={null}
        initialSongTitle=""
        initialSongArtist=""
      />

      <DNAModal
        show={showDNAModal}
        onClose={() => {
          closeDNAModal();
          // Step 4のオンボーディング中にモーダルを閉じた場合は完了扱い
          if (currentStep === 4 && isActive) {
            skipOnboarding();
          }
        }}
        allAnimes={allAnimes}
        favoriteAnimeIds={favoriteAnimeIds}
        count={count}
        averageRating={averageRating}
        totalRewatchCount={totalRewatchCount}
        userName={userName}
        userIcon={userIcon}
        userHandle={userHandle}
        userOtakuType={userOtakuType}
      />

      {showSeasonEndModal && (
        <SeasonEndModal
          items={previousSeasonItems}
          onMoveToBacklog={handleMoveToBacklog}
          onDelete={handleDeletePreviousSeason}
          onKeep={handleKeepPreviousSeason}
        />
      )}

      {/* PWAインストールバナー */}
      <PWAInstallBanner />

      {/* オンボーディングオーバーレイ */}
      <OnboardingOverlay />

      </div>
    </ModalProvider>
  );
}

