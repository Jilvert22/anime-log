'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import type { 
  Season, 
  Anime
} from './types';
import { HomeTab } from './components/tabs/HomeTab';
import MyPageTab from './components/tabs/MyPageTab';
import { ReviewModal } from './components/modals/ReviewModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { AuthModal } from './components/modals/AuthModal';
import { FavoriteAnimeModal } from './components/modals/FavoriteAnimeModal';
import { SongModal } from './components/modals/SongModal';
import { UserProfileModal } from './components/modals/UserProfileModal';
import { FollowListModal } from './components/modals/FollowListModal';
import { AddCharacterModal } from './components/modals/AddCharacterModal';
import { AddQuoteModal } from './components/modals/AddQuoteModal';
import { DNAModal } from './components/modals/DNAModal';
import { AddAnimeFormModal } from './components/modals/AddAnimeFormModal';
import { AnimeDetailModal } from './components/modals/AnimeDetailModal';
import { SeasonEndModal } from './components/modals/SeasonEndModal';
import { Navigation } from './components/Navigation';
import { useAnimeReviews } from './hooks/useAnimeReviews';
import { useAuth } from './hooks/useAuth';
import { useUserProfile } from './hooks/useUserProfile';
import { useAnimeData } from './hooks/useAnimeData';
// import { useSocial } from './hooks/useSocial'; // 一時無効化
import { useModals } from './hooks/useModals';
import { useCollection } from './hooks/useCollection';
import { useFormStates } from './hooks/useFormStates';
import { useTabs } from './hooks/useTabs';
import { useDarkMode } from './hooks/useDarkMode';
import { useCountAnimation } from './hooks/useCountAnimation';
import { useModalHandlers } from './hooks/useModalHandlers';
import { animeToSupabase, supabaseToAnime, extractSeriesName, getSeasonName, shouldShowSeasonStartModal, markSeasonChecked } from './utils/helpers';
import { getCurrentSeasonPlannedWatchlist, updateWatchlistItem, removeFromWatchlist, type WatchlistItem } from './lib/supabase';

  // メインページ
export default function Home() {
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [showSeasonEndModal, setShowSeasonEndModal] = useState(false);
  const [previousSeasonItems, setPreviousSeasonItems] = useState<WatchlistItem[]>([]);
  
  // モーダル状態管理をカスタムフックで管理
  const {
    showSettings,
    setShowSettings,
    showFavoriteAnimeModal,
    setShowFavoriteAnimeModal,
    showAddForm,
    setShowAddForm,
    showDNAModal,
    setShowDNAModal,
    showShareModal,
    setShowShareModal,
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
  
  // 認証管理をカスタムフックで管理
  const { user, isLoading, handleLogout: logout } = useAuth();
  
  // ダークモード管理をカスタムフックで管理
  const { isDarkMode, setIsDarkMode } = useDarkMode();
  
  // ユーザープロフィール管理をカスタムフックで管理
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
  } = useUserProfile();
  
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
  
  // アニメデータ管理をカスタムフックで管理
  const {
    seasons,
    setSeasons,
    expandedSeasons: oldExpandedSeasons,
    setExpandedSeasons: setOldExpandedSeasons,
    allAnimes,
    averageRating,
    totalRewatchCount,
  } = useAnimeData(user, isLoading);
  
  // カウントアニメーションをカスタムフックで管理
  const count = useCountAnimation(allAnimes.length);
  
  // フォーム状態管理をカスタムフックで管理
  const {
    newCharacterName,
    setNewCharacterName,
    newCharacterAnimeId,
    setNewCharacterAnimeId,
    newCharacterImage,
    setNewCharacterImage,
    newCharacterCategory,
    setNewCharacterCategory,
    newCharacterTags,
    setNewCharacterTags,
    newCustomTag,
    setNewCustomTag,
    editingCharacter,
    setEditingCharacter,
    characterFilter,
    setCharacterFilter,
    editingQuote,
    setEditingQuote,
    newQuoteAnimeId,
    setNewQuoteAnimeId,
    newQuoteText,
    setNewQuoteText,
    newQuoteCharacter,
    setNewQuoteCharacter,
    quoteSearchQuery,
    setQuoteSearchQuery,
    quoteFilterType,
    setQuoteFilterType,
    selectedAnimeForFilter,
    setSelectedAnimeForFilter,
    songType,
    setSongType,
    newSongTitle,
    setNewSongTitle,
    newSongArtist,
    setNewSongArtist,
  } = useFormStates();
  
  // モーダルハンドラーをカスタムフックで管理
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
    setNewCharacterName,
    setNewCharacterAnimeId,
    setNewCharacterImage,
    setNewCharacterCategory,
    setNewCharacterTags,
    setNewCustomTag,
  });
  
  // SNS機能をカスタムフックで管理（一時無効化）
  // const {
  //   userSearchQuery,
  //   setUserSearchQuery,
  //   searchedUsers,
  //   setSearchedUsers,
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
  
  // 一時的なデフォルト値
  const userSearchQuery = '';
  const setUserSearchQuery = () => {};
  const searchedUsers: any[] = [];
  const isSearchingUsers = false;
  const selectedUserProfile = null;
  const setSelectedUserProfile = () => {};
  const selectedUserAnimes: any[] = [];
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
  const followListUsers: any[] = [];
  const setFollowListUsers = (_value: any[]) => {};
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

  // イベントハンドラのメモ化
  const handleOpenAddForm = useCallback(() => {
    setShowAddForm(true);
  }, []);

  const handleCloseAddForm = useCallback(() => {
    setShowAddForm(false);
  }, []);

  const handleCloseReviewModal = useCallback(() => {
    setShowReviewModal(false);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const handleCloseFavoriteAnimeModal = useCallback(() => {
    setShowFavoriteAnimeModal(false);
  }, []);

  const handleCloseUserProfileModal = useCallback(() => {
    setShowUserProfileModal(false);
  }, []);

  const handleCloseFollowListModal = useCallback(() => {
    setShowFollowListModal(false);
  }, []);

  const handleCloseAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  const handleCloseAddQuoteModal = useCallback(() => {
    setShowAddQuoteModal(false);
    setEditingQuote(null);
  }, []);

  const handleCloseSongModal = useCallback(() => {
    setShowSongModal(false);
    setSongType(null);
    setSelectedAnime(null);
    setNewSongTitle('');
    setNewSongArtist('');
  }, []);

  const handleCloseDNAModal = useCallback(() => {
    setShowDNAModal(false);
  }, []);

  const handleOpenAddQuoteModal = useCallback(() => {
    setEditingQuote(null);
    setNewQuoteAnimeId(null);
    setNewQuoteText('');
    setNewQuoteCharacter('');
    setShowAddQuoteModal(true);
  }, []);

  const handleEditQuote = useCallback((animeId: number, quoteIndex: number) => {
    const anime = allAnimes.find(a => a.id === animeId);
    if (anime?.quotes?.[quoteIndex]) {
      setEditingQuote({ animeId, quoteIndex });
      setNewQuoteText(anime.quotes[quoteIndex].text);
      setNewQuoteCharacter(anime.quotes[quoteIndex].character || '');
      setShowAddQuoteModal(true);
    }
  }, [allAnimes]);


  const handleSaveAddQuoteModal = useCallback(() => {
    setShowAddQuoteModal(false);
    setEditingQuote(null);
  }, []);

  const handleReviewPosted = useCallback(async () => {
    if (selectedAnime) {
      await loadReviews(selectedAnime.id);
    }
  }, [selectedAnime, loadReviews]);

  // 今期の視聴予定アニメを積みアニメに移動
  const handleMoveToBacklog = useCallback(async () => {
    if (!user || previousSeasonItems.length === 0) return;

    try {
      for (const item of previousSeasonItems) {
        await updateWatchlistItem(item.anilist_id, {
          status: null,
          season_year: null,
          season: null,
        });
      }
      markSeasonChecked(); // 確認済みとしてマーク
      setShowSeasonEndModal(false);
      setPreviousSeasonItems([]);
    } catch (error) {
      console.error('Failed to move to backlog:', error);
      alert('積みアニメへの移動に失敗しました');
    }
  }, [user, previousSeasonItems]);

  // 今期の視聴予定アニメを削除
  const handleDeletePreviousSeason = useCallback(async () => {
    if (!user || previousSeasonItems.length === 0) return;

    try {
      for (const item of previousSeasonItems) {
        await removeFromWatchlist(item.anilist_id);
      }
      markSeasonChecked(); // 確認済みとしてマーク
      setShowSeasonEndModal(false);
      setPreviousSeasonItems([]);
    } catch (error) {
      console.error('Failed to delete items:', error);
      alert('削除に失敗しました');
    }
  }, [user, previousSeasonItems]);

  // そのままにする（視聴中に移行はSeasonEndModal内で処理）
  const handleKeepPreviousSeason = useCallback(() => {
    markSeasonChecked(); // 確認済みとしてマーク
    setShowSeasonEndModal(false);
    setPreviousSeasonItems([]);
  }, []);

  // シーズン開始時のチェック（アプリ起動時）
  // 「来期」が「今期」になった時点で、視聴予定（planned）のアニメをチェック
  useEffect(() => {
    const checkSeasonStart = async () => {
      if (!user || isLoading) return;
      
      // 既に今シーズンの確認済みフラグがある場合はスキップ
      if (!shouldShowSeasonStartModal()) {
        return;
      }
      
      try {
        const items = await getCurrentSeasonPlannedWatchlist(user.id);
        if (items.length > 0) {
          setPreviousSeasonItems(items);
          setShowSeasonEndModal(true);
        } else {
          // 視聴予定アニメがなくても確認済みとしてマーク
          markSeasonChecked();
        }
      } catch (error) {
        console.error('Failed to check season start:', error);
      }
    };

    checkSeasonStart();
  }, [user, isLoading]);

  // アニメが選択されたときに感想を読み込む
  useEffect(() => {
    if (selectedAnime && user) {
      loadReviews(selectedAnime.id);
    }
  }, [selectedAnime?.id, user, loadReviews]);
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
        onOpenSettingsModal={() => setShowSettings(true)}
        setShowAuthModal={setShowAuthModal}
      />

      {/* メインコンテンツ */}
      <main className="pt-20 max-w-md md:max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'home' && (
          <HomeTab
            homeSubTab={homeSubTab}
            setHomeSubTab={setHomeSubTab}
            count={count}
            totalRewatchCount={totalRewatchCount}
            averageRating={averageRating}
            seasons={seasons}
            expandedYears={expandedYears}
            setExpandedYears={setExpandedYears}
            expandedSeasons={expandedSeasons}
            setExpandedSeasons={setExpandedSeasons}
            onOpenAddForm={handleOpenAddForm}
            setSelectedAnime={setSelectedAnime}
            allAnimes={allAnimes}
            user={user}
            setSeasons={setSeasons}
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
            userName={userName}
            userIcon={userIcon}
            userHandle={userHandle}
            userOtakuType={userOtakuType}
            setUserOtakuType={(type: string) => {
              // 後方互換性のため、一時的にlocalStorageに保存
              if (typeof window !== 'undefined') {
                localStorage.setItem('userOtakuType', type);
              }
            }}
            favoriteAnimeIds={favoriteAnimeIds}
            setFavoriteAnimeIds={setFavoriteAnimeIds}
            averageRating={averageRating}
            favoriteCharacters={favoriteCharacters}
            setFavoriteCharacters={setFavoriteCharacters}
            characterFilter={characterFilter}
            setCharacterFilter={setCharacterFilter}
            quoteSearchQuery={quoteSearchQuery}
            setQuoteSearchQuery={setQuoteSearchQuery}
            quoteFilterType={quoteFilterType}
            setQuoteFilterType={setQuoteFilterType}
            selectedAnimeForFilter={selectedAnimeForFilter}
            setSelectedAnimeForFilter={setSelectedAnimeForFilter}
            setSeasons={setSeasons}
            user={user}
            supabaseClient={supabase}
            onOpenDNAModal={() => setShowDNAModal(true)}
            onOpenSettingsModal={() => setShowSettings(true)}
            setShowFavoriteAnimeModal={setShowFavoriteAnimeModal}
            onOpenCharacterModal={handleOpenAddCharacterModal}
            onEditCharacter={handleEditCharacter}
            onOpenAddQuoteModal={handleOpenAddQuoteModal}
            onEditQuote={handleEditQuote}
            setSelectedAnime={setSelectedAnime}
            setSongType={setSongType}
            setNewSongTitle={setNewSongTitle}
            setNewSongArtist={setNewSongArtist}
            setShowSongModal={setShowSongModal}
            handleLogout={handleLogout}
          />
        )}
      </main>

      <AddAnimeFormModal
        show={showAddForm}
        onClose={handleCloseAddForm}
        seasons={seasons}
        setSeasons={setSeasons}
        expandedSeasons={oldExpandedSeasons}
        setExpandedSeasons={setOldExpandedSeasons}
        user={user}
        extractSeriesName={extractSeriesName}
        getSeasonName={getSeasonName}
        animeToSupabase={animeToSupabase}
      />

      {/* 感想投稿モーダル */}
      <ReviewModal
        show={showReviewModal}
        onClose={handleCloseReviewModal}
        selectedAnime={selectedAnime}
        user={user}
        userName={userName}
        userIcon={userIcon}
        onReviewPosted={handleReviewPosted}
      />

      <SettingsModal
        show={showSettings}
        onClose={handleCloseSettings}
        profile={profile}
        avatarPublicUrl={avatarPublicUrl}
        saveProfile={saveProfile}
      />

      <FavoriteAnimeModal
        show={showFavoriteAnimeModal}
        onClose={handleCloseFavoriteAnimeModal}
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
        onClose={handleCloseAuthModal}
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
          setSongType={setSongType}
          setNewSongTitle={setNewSongTitle}
          setNewSongArtist={setNewSongArtist}
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
        onClose={handleCloseAddQuoteModal}
        allAnimes={allAnimes}
        seasons={seasons}
        setSeasons={setSeasons}
        user={user}
        editingQuote={editingQuote}
        onSave={handleSaveAddQuoteModal}
      />

      <SongModal
        show={showSongModal}
        onClose={handleCloseSongModal}
        selectedAnime={selectedAnime}
        setSelectedAnime={setSelectedAnime}
        allAnimes={allAnimes}
        seasons={seasons}
        setSeasons={setSeasons}
        user={user}
        initialSongType={songType}
        initialSongTitle={newSongTitle}
        initialSongArtist={newSongArtist}
      />

      <DNAModal
        show={showDNAModal}
        onClose={handleCloseDNAModal}
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

    </div>
  );
}