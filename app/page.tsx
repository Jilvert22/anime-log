'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { 
  upsertUserProfile,
} from './lib/supabase';
import type { 
  Season, 
  Anime, 
  EvangelistList, 
  VoiceActor 
} from './types';
import {
  achievements,
} from './constants';
import { ProfileTab } from './components/tabs/ProfileTab';
import { HomeTab } from './components/tabs/HomeTab';
import { DiscoverTab } from './components/tabs/DiscoverTab';
import { CollectionTab } from './components/tabs/CollectionTab';
import { ReviewModal } from './components/modals/ReviewModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { AuthModal } from './components/modals/AuthModal';
import { FavoriteAnimeModal } from './components/modals/FavoriteAnimeModal';
import { SongModal } from './components/modals/SongModal';
import { UserProfileModal } from './components/modals/UserProfileModal';
import { FollowListModal } from './components/modals/FollowListModal';
import { CreateListModal } from './components/modals/CreateListModal';
import { AddCharacterModal } from './components/modals/AddCharacterModal';
import { AddVoiceActorModal } from './components/modals/AddVoiceActorModal';
import { AddQuoteModal } from './components/modals/AddQuoteModal';
import { DNAModal } from './components/modals/DNAModal';
import { AddAnimeFormModal } from './components/modals/AddAnimeFormModal';
import { AnimeDetailModal } from './components/modals/AnimeDetailModal';
import { ListDetailModal } from './components/modals/ListDetailModal';
import { Navigation } from './components/Navigation';
import { useAnimeReviews } from './hooks/useAnimeReviews';
import { useAuth } from './hooks/useAuth';
import { useUserProfile } from './hooks/useUserProfile';
import { useAnimeData } from './hooks/useAnimeData';
import { useSocial } from './hooks/useSocial';
import { useModals } from './hooks/useModals';
import { useCollection } from './hooks/useCollection';
import { useFormStates } from './hooks/useFormStates';
import { useTabs } from './hooks/useTabs';
import { useDarkMode } from './hooks/useDarkMode';
import { useCountAnimation } from './hooks/useCountAnimation';
import { useModalHandlers } from './hooks/useModalHandlers';
import { animeToSupabase, supabaseToAnime, extractSeriesName, getSeasonName } from './utils/helpers';

// メインページ
export default function Home() {
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  
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
    showCreateListModal,
    setShowCreateListModal,
    showAddCharacterModal,
    setShowAddCharacterModal,
    showAddVoiceActorModal,
    setShowAddVoiceActorModal,
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
    userName,
    setUserName,
    userIcon,
    setUserIcon,
    userOtakuType,
    setUserOtakuType,
    favoriteAnimeIds,
    setFavoriteAnimeIds,
    myProfile,
    setMyProfile,
    isProfilePublic,
    setIsProfilePublic,
    userBio,
    setUserBio,
    userHandle,
    setUserHandle,
  } = useUserProfile(user);
  
  // タブ状態管理をカスタムフックで管理
  const {
    activeTab,
    setActiveTab,
    homeSubTab,
    setHomeSubTab,
    discoverSubTab,
    setDiscoverSubTab,
    collectionSubTab,
    setCollectionSubTab,
  } = useTabs();
  
  // コレクション関連をカスタムフックで管理
  const {
    evangelistLists,
    setEvangelistLists,
    favoriteCharacters,
    setFavoriteCharacters,
    voiceActors,
    setVoiceActors,
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
    newVoiceActorName,
    setNewVoiceActorName,
    newVoiceActorImage,
    setNewVoiceActorImage,
    newVoiceActorAnimeIds,
    setNewVoiceActorAnimeIds,
    newVoiceActorNotes,
    setNewVoiceActorNotes,
    editingVoiceActor,
    setEditingVoiceActor,
    voiceActorSearchQuery,
    setVoiceActorSearchQuery,
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
    selectedList,
    setSelectedList,
    editingList,
    setEditingList,
    listSortType,
    setListSortType,
    songType,
    setSongType,
    newSongTitle,
    setNewSongTitle,
    newSongArtist,
    setNewSongArtist,
  } = useFormStates();
  
  // モーダルハンドラーをカスタムフックで管理
  const {
    handleCreateListSave,
    handleCreateListClose,
    handleCharacterSave,
    handleCharacterClose,
    handleOpenAddCharacterModal,
    handleEditCharacter,
    handleVoiceActorSave,
    handleVoiceActorClose,
    handleOpenAddVoiceActorModal,
    handleEditVoiceActor,
  } = useModalHandlers({
    evangelistLists,
    setEvangelistLists,
    favoriteCharacters,
    setFavoriteCharacters,
    voiceActors,
    setVoiceActors,
    editingList,
    setEditingList,
    editingCharacter,
    setEditingCharacter,
    editingVoiceActor,
    setEditingVoiceActor,
    setShowCreateListModal,
    setShowAddCharacterModal,
    setShowAddVoiceActorModal,
    setNewCharacterName,
    setNewCharacterAnimeId,
    setNewCharacterImage,
    setNewCharacterCategory,
    setNewCharacterTags,
    setNewCustomTag,
    setNewVoiceActorName,
    setNewVoiceActorImage,
    setNewVoiceActorAnimeIds,
    setNewVoiceActorNotes,
  });
  
  // SNS機能をカスタムフックで管理
  const {
    userSearchQuery,
    setUserSearchQuery,
    searchedUsers,
    setSearchedUsers,
    isSearchingUsers,
    selectedUserProfile,
    setSelectedUserProfile,
    selectedUserAnimes,
    setSelectedUserAnimes,
    showUserProfileModal,
    setShowUserProfileModal,
    userFollowStatus,
    setUserFollowStatus,
    followCounts,
    setFollowCounts,
    showFollowListModal,
    setShowFollowListModal,
    followListType,
    setFollowListType,
    followListUsers,
    setFollowListUsers,
    handleUserSearch,
    handleViewUserProfile,
    handleToggleFollow,
  } = useSocial(user);
  
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
    // ProfileTabの編集状態をリセットする必要がある場合は、ここで処理
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

  const handleOpenCreateListModal = useCallback(() => {
    setEditingList(null);
    setShowCreateListModal(true);
  }, []);

  const handleSaveAddQuoteModal = useCallback(() => {
    setShowAddQuoteModal(false);
    setEditingQuote(null);
  }, []);

  const handleReviewPosted = useCallback(async () => {
    if (selectedAnime) {
      await loadReviews(selectedAnime.id);
    }
  }, [selectedAnime, loadReviews]);

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
        setShowSettings={setShowSettings}
        setShowAuthModal={setShowAuthModal}
      />

      {/* メインコンテンツ */}
      <main className="max-w-md md:max-w-6xl mx-auto px-4 py-6 pb-24 lg:pb-6 lg:ml-[200px]">
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
        
        {activeTab === 'discover' && (
          <DiscoverTab
            allAnimes={allAnimes}
            seasons={seasons}
          />
        )}

        {activeTab === 'collection' && (
          <CollectionTab
            collectionSubTab={collectionSubTab}
            setCollectionSubTab={setCollectionSubTab}
            allAnimes={allAnimes}
            seasons={seasons}
            setSeasons={setSeasons}
            user={user}
            supabaseClient={supabase}
            achievements={achievements}
            favoriteCharacters={favoriteCharacters}
            setFavoriteCharacters={setFavoriteCharacters}
            characterFilter={characterFilter}
            setCharacterFilter={setCharacterFilter}
            onOpenAddCharacterModal={handleOpenAddCharacterModal}
            onEditCharacter={handleEditCharacter}
            quoteSearchQuery={quoteSearchQuery}
            setQuoteSearchQuery={setQuoteSearchQuery}
            quoteFilterType={quoteFilterType}
            setQuoteFilterType={setQuoteFilterType}
            selectedAnimeForFilter={selectedAnimeForFilter}
            setSelectedAnimeForFilter={setSelectedAnimeForFilter}
            onOpenAddQuoteModal={handleOpenAddQuoteModal}
            onEditQuote={handleEditQuote}
            evangelistLists={evangelistLists}
            setEvangelistLists={setEvangelistLists}
            listSortType={listSortType}
            setListSortType={setListSortType}
            onSelectList={setSelectedList}
            onOpenCreateListModal={handleOpenCreateListModal}
            voiceActors={voiceActors}
            setVoiceActors={setVoiceActors}
            voiceActorSearchQuery={voiceActorSearchQuery}
            setVoiceActorSearchQuery={setVoiceActorSearchQuery}
            onOpenAddVoiceActorModal={handleOpenAddVoiceActorModal}
            onEditVoiceActor={handleEditVoiceActor}
            setSelectedAnime={setSelectedAnime}
            setSongType={setSongType}
            setNewSongTitle={setNewSongTitle}
            setNewSongArtist={setNewSongArtist}
            setShowSongModal={setShowSongModal}
          />
        )}
        
        {activeTab === 'profile' && (
          <ProfileTab
            allAnimes={allAnimes}
            seasons={seasons}
            userName={userName}
            userIcon={userIcon}
            userHandle={userHandle}
            averageRating={averageRating}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setShowSettings={setShowSettings}
            handleLogout={handleLogout}
            userOtakuType={userOtakuType}
            favoriteAnimeIds={favoriteAnimeIds}
            setFavoriteAnimeIds={setFavoriteAnimeIds}
            setShowFavoriteAnimeModal={setShowFavoriteAnimeModal}
            followCounts={followCounts}
            setShowFollowListModal={setShowFollowListModal}
            setFollowListType={setFollowListType}
            setFollowListUsers={setFollowListUsers}
            user={user}
            setUserName={setUserName}
            setUserIcon={setUserIcon}
            setUserOtakuType={setUserOtakuType}
            isProfilePublic={isProfilePublic}
            setIsProfilePublic={setIsProfilePublic}
            userBio={userBio}
            setUserBio={setUserBio}
            upsertUserProfile={upsertUserProfile}
            userSearchQuery={userSearchQuery}
            setUserSearchQuery={setUserSearchQuery}
            searchedUsers={searchedUsers}
            isSearchingUsers={isSearchingUsers}
            handleUserSearch={handleUserSearch}
            handleViewUserProfile={handleViewUserProfile}
            handleToggleFollow={handleToggleFollow}
            userFollowStatus={userFollowStatus}
            setActiveTab={setActiveTab}
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
        supabaseToAnime={supabaseToAnime}
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
        userName={userName}
        setUserName={setUserName}
        userIcon={userIcon}
        setUserIcon={setUserIcon}
        userHandle={userHandle}
        setUserHandle={setUserHandle}
        isProfilePublic={isProfilePublic}
        setIsProfilePublic={setIsProfilePublic}
        userBio={userBio}
        setUserBio={setUserBio}
        user={user}
        upsertUserProfile={upsertUserProfile}
        setMyProfile={setMyProfile}
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

      <CreateListModal
        show={showCreateListModal}
        onClose={handleCreateListClose}
        allAnimes={allAnimes}
        editingList={editingList}
        onSave={handleCreateListSave}
      />

      {/* 布教リスト詳細モーダル */}
      {selectedList && (
        <ListDetailModal
          selectedList={selectedList}
          setSelectedList={setSelectedList}
          allAnimes={allAnimes}
          setSelectedAnime={setSelectedAnime}
          setEditingList={setEditingList}
          setShowCreateListModal={setShowCreateListModal}
          evangelistLists={evangelistLists}
          setEvangelistLists={setEvangelistLists}
        />
      )}

      <AddCharacterModal
        show={showAddCharacterModal}
        onClose={handleCharacterClose}
        allAnimes={allAnimes}
        editingCharacter={editingCharacter}
        favoriteCharacters={favoriteCharacters}
        onSave={handleCharacterSave}
      />

      <AddVoiceActorModal
        show={showAddVoiceActorModal}
        onClose={handleVoiceActorClose}
        allAnimes={allAnimes}
        editingVoiceActor={editingVoiceActor}
        voiceActors={voiceActors}
        onSave={handleVoiceActorSave}
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

    </div>
  );
}