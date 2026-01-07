'use client';

import dynamic from 'next/dynamic';
import type { Anime, Season, FavoriteCharacter, SupabaseAnimeRow } from '../types';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/api';
import type { WatchlistItem } from '../lib/storage/types';
import { useModalContext } from '../contexts/ModalContext';
import { useUserProfileContext } from '../contexts/UserProfileContext';
import { useAnimeDataContext } from '../contexts/AnimeDataContext';
import { useAnimeReviews } from '../hooks/useAnimeReviews';
import { useCollection } from '../hooks/useCollection';
import { supabase } from '../lib/supabase';

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

interface HomeModalsProps {
  selectedAnime: Anime | null;
  setSelectedAnime: (anime: Anime | null) => void;
  user: User | null;
  handleLogout: () => void;
  extractSeriesName: (title: string) => string;
  getSeasonName: {
    (season: string): string;
    (year: number, quarter: number): string;
  };
  animeToSupabase: (anime: Anime, seasonName: string, userId: string) => SupabaseAnimeRow;
  showSeasonEndModal: boolean;
  previousSeasonItems: WatchlistItem[];
  handleMoveToBacklog: () => Promise<void>;
  handleDeletePreviousSeason: () => Promise<void>;
  handleKeepPreviousSeason: () => Promise<void>;
  onReviewPosted: () => Promise<void>;
  currentStep?: number | null;
  isActive?: boolean;
  skipOnboarding?: () => void;
  count: number;
  handleCharacterSave: (character: FavoriteCharacter) => void;
  handleCharacterClose: () => void;
}

export function HomeModals({
  selectedAnime,
  setSelectedAnime,
  user,
  handleLogout,
  extractSeriesName,
  getSeasonName,
  animeToSupabase,
  showSeasonEndModal,
  previousSeasonItems,
  handleMoveToBacklog,
  handleDeletePreviousSeason,
  handleKeepPreviousSeason,
  onReviewPosted,
  currentStep,
  isActive,
  skipOnboarding,
  count,
  handleCharacterSave,
  handleCharacterClose,
}: HomeModalsProps) {
  const { modals, actions, formStates } = useModalContext();
  const {
    userName,
    userIcon,
    userHandle,
    userOtakuType,
    favoriteAnimeIds,
    setFavoriteAnimeIds,
    profile,
    avatarPublicUrl,
    saveProfile,
  } = useUserProfileContext();
  const {
    allAnimes,
    seasons,
    setSeasons,
    expandedSeasons,
    setExpandedSeasons,
    averageRating,
    totalRewatchCount,
  } = useAnimeDataContext();
  const {
    favoriteCharacters,
    setFavoriteCharacters,
  } = useCollection();
  
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

  // TODO: SNS機能実装時にuseSocialを有効化
  // 現在はダミー値を使用（フォロー/フォロワー機能は未実装）
  // 実装時は以下のコメントを外し、useSocialフックを使用してください：
  // import { useSocial } from '../hooks/useSocial';
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
  const showUserProfileModal = false;
  const selectedUserProfile: UserProfile | null = null;
  const selectedUserAnimes: Anime[] = [];
  const userFollowStatus: { [key: string]: boolean } = {};
  const showFollowListModal = false;
  const followListType: 'following' | 'followers' = 'following';
  const followListUsers: UserProfile[] = [];
  
  // ダミーのセッター関数（SNS機能未実装時）
  const setFollowListType = (_value: 'following' | 'followers') => {
    // SNS機能実装時に実装
  };
  const setFollowListUsers = (_value: UserProfile[]) => {
    // SNS機能実装時に実装
  };
  
  const handleCloseUserProfileModal = () => {
    // SNS機能実装時に削除
  };

  const handleCloseFollowListModal = () => {
    // SNS機能実装時に削除
  };

  const handleViewUserProfile = async () => {
    // SNS機能実装時に実装
  };

  const handleToggleFollow = async () => {
    // SNS機能実装時に実装
  };

  return (
    <>
      <AddAnimeFormModal
        show={modals.showAddForm}
        onClose={actions.closeAddForm}
        seasons={seasons}
        setSeasons={setSeasons}
        expandedSeasons={expandedSeasons}
        setExpandedSeasons={setExpandedSeasons}
        user={user}
        extractSeriesName={extractSeriesName}
        getSeasonName={getSeasonName}
        animeToSupabase={animeToSupabase}
      />

      <ReviewModal
        show={modals.showReviewModal}
        onClose={actions.closeReviewModal}
        selectedAnime={selectedAnime}
        user={user}
        userName={userName}
        userIcon={userIcon}
        onReviewPosted={onReviewPosted}
      />

      <SettingsModal
        show={modals.showSettings}
        onClose={actions.closeSettings}
        profile={profile}
        avatarPublicUrl={avatarPublicUrl}
        saveProfile={saveProfile}
        user={user}
        handleLogout={handleLogout}
      />

      <FavoriteAnimeModal
        show={modals.showFavoriteAnimeModal}
        onClose={actions.closeFavoriteAnimeModal}
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

      <AuthModal
        show={modals.showAuthModal}
        onClose={actions.closeAuthModal}
        onAuthSuccess={() => {
          // 認証成功後の処理（必要に応じて）
        }}
      />

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
          setShowReviewModal={modals.setShowReviewModal}
          setShowSongModal={modals.setShowSongModal}
        />
      )}

      <AddCharacterModal
        show={modals.showAddCharacterModal}
        onClose={handleCharacterClose}
        allAnimes={allAnimes}
        editingCharacter={formStates.editingCharacter}
        onSave={handleCharacterSave}
      />

      <AddQuoteModal
        show={modals.showAddQuoteModal}
        onClose={actions.closeAddQuoteModal}
        allAnimes={allAnimes}
        seasons={seasons}
        setSeasons={setSeasons}
        user={user}
        editingQuote={formStates.editingQuote}
        onSave={actions.saveAddQuoteModal}
      />

      <SongModal
        show={modals.showSongModal}
        onClose={actions.closeSongModal}
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
        show={modals.showDNAModal}
        onClose={() => {
          actions.closeDNAModal();
          // Step 4のオンボーディング中にモーダルを閉じた場合は完了扱い
          if (currentStep === 4 && isActive && skipOnboarding) {
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
    </>
  );
}

