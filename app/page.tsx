'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import { searchAnime, searchAnimeBySeason } from './lib/anilist';
import type { UserProfile } from './lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { 
  upsertUserProfile,
} from './lib/supabase';
import type { 
  Season, 
  Review, 
  Anime, 
  Achievement, 
  EvangelistList, 
  FavoriteCharacter, 
  VoiceActor 
} from './types';
import {
  availableTags,
  characterCategories,
  otakuTypes,
  characterPresetTags,
  sampleFavoriteCharacters,
  achievements,
  sampleSeasons,
  ratingLabels,
  genreTranslation,
} from './constants';
import { StarRating } from './components/StarRating';
import { AnimeCard } from './components/AnimeCard';
import { UserCard } from './components/UserCard';
import { AchievementsTab } from './components/tabs/AchievementsTab';
import { MusicTab } from './components/tabs/MusicTab';
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
import { translateGenre, animeToSupabase, supabaseToAnime, extractSeriesName, getSeasonName } from './utils/helpers';




// メインページ
export default function Home() {
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [count, setCount] = useState(0);
  
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
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
  const [activeTab, setActiveTab] = useState<'home' | 'discover' | 'collection' | 'profile'>('home');
  const [homeSubTab, setHomeSubTab] = useState<'seasons' | 'series'>('seasons');
  const [discoverSubTab, setDiscoverSubTab] = useState<'trends'>('trends');
  const [collectionSubTab, setCollectionSubTab] = useState<'achievements' | 'characters' | 'quotes' | 'lists' | 'music' | 'voiceActors'>('achievements');
  
  // コレクション関連をカスタムフックで管理
  const {
    evangelistLists,
    setEvangelistLists,
    favoriteCharacters,
    setFavoriteCharacters,
  } = useCollection();
  
  // アニメデータ管理をカスタムフックで管理
  const {
    seasons,
    setSeasons,
    expandedSeasons,
    setExpandedSeasons,
    allAnimes,
    averageRating,
    totalRewatchCount,
  } = useAnimeData(user, isLoading);
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([]);
  
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
  
  // SNS機能をカスタムフックで管理
  const {
    userSearchQuery,
    setUserSearchQuery,
    searchedUsers,
    setSearchedUsers,
    recommendedUsers,
    setRecommendedUsers,
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

  // localStorageから初期値を読み込む（ダークモードのみ）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode === 'true') setIsDarkMode(true);
    }
  }, []);

  // ダークモードの適用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('darkMode', isDarkMode.toString());
    }
  }, [isDarkMode]);




  // ログアウト処理
  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      // ログアウト時にseasonsを空にする（useAnimeDataフック内で管理されているため、ここでは不要）
    }
  };








  // アニメが選択されたときに感想を読み込む
  useEffect(() => {
    if (selectedAnime && user) {
      loadReviews(selectedAnime.id);
    } else if (!selectedAnime || !user) {
      // アニメが選択されていない、またはログインしていない場合は空にする
      // loadReviewsは既に空にする処理を含んでいるので、ここでは何もしない
    }
  }, [selectedAnime?.id, user, loadReviews]);

  // カウントアップアニメーション
  useEffect(() => {
    const targetCount = allAnimes.length;
    const duration = 1500; // 1.5秒
    const steps = 60;
    const increment = targetCount / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const nextCount = Math.min(Math.ceil(increment * currentStep), targetCount);
      setCount(nextCount);
      
      if (nextCount >= targetCount) {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [allAnimes.length]);

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
            expandedSeasons={expandedSeasons}
            setExpandedSeasons={setExpandedSeasons}
            onOpenAddForm={() => setShowAddForm(true)}
            setSelectedAnime={setSelectedAnime}
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
            onOpenAddCharacterModal={() => {
              setNewCharacterName('');
              setNewCharacterAnimeId(null);
              setNewCharacterImage('👤');
              setNewCharacterCategory('');
              setNewCharacterTags([]);
              setNewCustomTag('');
              setEditingCharacter(null);
              setShowAddCharacterModal(true);
            }}
            onEditCharacter={(character) => {
              setEditingCharacter(character);
              setNewCharacterName(character.name);
              setNewCharacterAnimeId(character.animeId);
              setNewCharacterImage(character.image);
              setNewCharacterCategory(character.category);
              setNewCharacterTags([...character.tags]);
              setNewCustomTag('');
              setShowAddCharacterModal(true);
            }}
            quoteSearchQuery={quoteSearchQuery}
            setQuoteSearchQuery={setQuoteSearchQuery}
            quoteFilterType={quoteFilterType}
            setQuoteFilterType={setQuoteFilterType}
            selectedAnimeForFilter={selectedAnimeForFilter}
            setSelectedAnimeForFilter={setSelectedAnimeForFilter}
            onOpenAddQuoteModal={() => {
              setEditingQuote(null);
              setNewQuoteAnimeId(null);
              setNewQuoteText('');
              setNewQuoteCharacter('');
              setShowAddQuoteModal(true);
            }}
            onEditQuote={(animeId, quoteIndex) => {
              const anime = allAnimes.find(a => a.id === animeId);
              if (anime && anime.quotes && anime.quotes[quoteIndex]) {
                setEditingQuote({ animeId, quoteIndex });
                setNewQuoteText(anime.quotes[quoteIndex].text);
                setNewQuoteCharacter(anime.quotes[quoteIndex].character || '');
                setShowAddQuoteModal(true);
              }
            }}
            evangelistLists={evangelistLists}
            setEvangelistLists={setEvangelistLists}
            listSortType={listSortType}
            setListSortType={setListSortType}
            onSelectList={setSelectedList}
            onOpenCreateListModal={() => {
              setEditingList(null);
              setShowCreateListModal(true);
            }}
            voiceActors={voiceActors}
            setVoiceActors={setVoiceActors}
            voiceActorSearchQuery={voiceActorSearchQuery}
            setVoiceActorSearchQuery={setVoiceActorSearchQuery}
            onOpenAddVoiceActorModal={() => {
              setNewVoiceActorName('');
              setNewVoiceActorImage('🎤');
              setNewVoiceActorAnimeIds([]);
              setNewVoiceActorNotes('');
              setEditingVoiceActor(null);
              setShowAddVoiceActorModal(true);
            }}
            onEditVoiceActor={(actor) => {
              setEditingVoiceActor(actor);
              setNewVoiceActorName(actor.name);
              setNewVoiceActorImage(actor.image);
              setNewVoiceActorAnimeIds(actor.animeIds);
              setNewVoiceActorNotes(actor.notes || '');
              setShowAddVoiceActorModal(true);
            }}
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
            recommendedUsers={recommendedUsers}
            isSearchingUsers={isSearchingUsers}
            handleUserSearch={handleUserSearch}
            handleViewUserProfile={handleViewUserProfile}
            handleToggleFollow={handleToggleFollow}
            userFollowStatus={userFollowStatus}
          />
        )}
      </main>

      <AddAnimeFormModal
        show={showAddForm}
        onClose={() => setShowAddForm(false)}
        seasons={seasons}
        setSeasons={setSeasons}
        expandedSeasons={expandedSeasons}
        setExpandedSeasons={setExpandedSeasons}
        user={user}
        extractSeriesName={extractSeriesName}
        getSeasonName={getSeasonName}
        animeToSupabase={animeToSupabase}
        supabaseToAnime={supabaseToAnime}
      />

      {/* 感想投稿モーダル */}
      <ReviewModal
        show={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        selectedAnime={selectedAnime}
        user={user}
        userName={userName}
        userIcon={userIcon}
        onReviewPosted={async () => {
          if (selectedAnime) {
            await loadReviews(selectedAnime.id);
          }
        }}
      />

      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        userName={userName}
        setUserName={setUserName}
        userIcon={userIcon}
        setUserIcon={setUserIcon}
        userHandle={userHandle}
        setUserHandle={setUserHandle}
        userOtakuType={userOtakuType}
        setUserOtakuType={setUserOtakuType}
        favoriteAnimeIds={favoriteAnimeIds}
        setFavoriteAnimeIds={setFavoriteAnimeIds}
        isProfilePublic={isProfilePublic}
        setIsProfilePublic={setIsProfilePublic}
        userBio={userBio}
        setUserBio={setUserBio}
        user={user}
        allAnimes={allAnimes}
        setShowFavoriteAnimeModal={setShowFavoriteAnimeModal}
        upsertUserProfile={upsertUserProfile}
        setMyProfile={setMyProfile}
      />

      <FavoriteAnimeModal
        show={showFavoriteAnimeModal}
        onClose={() => setShowFavoriteAnimeModal(false)}
        allAnimes={allAnimes}
        favoriteAnimeIds={favoriteAnimeIds}
        setFavoriteAnimeIds={setFavoriteAnimeIds}
      />

      <UserProfileModal
        show={showUserProfileModal}
        onClose={() => setShowUserProfileModal(false)}
        selectedUserProfile={selectedUserProfile}
        selectedUserAnimes={selectedUserAnimes}
        user={user}
        userFollowStatus={userFollowStatus}
        onToggleFollow={handleToggleFollow}
        onAnimeClick={setSelectedAnime}
      />

      <FollowListModal
        show={showFollowListModal}
        onClose={() => setShowFollowListModal(false)}
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
        onClose={() => setShowAuthModal(false)}
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
        onClose={() => {
          setShowCreateListModal(false);
          setEditingList(null);
        }}
        allAnimes={allAnimes}
        editingList={editingList}
        onSave={(list) => {
          if (editingList) {
            // 編集
            const updatedLists = evangelistLists.map(l =>
              l.id === editingList.id
                ? {
                    ...l,
                    title: list.title,
                    description: list.description,
                    animeIds: list.animeIds,
                  }
                : l
            );
            setEvangelistLists(updatedLists);
          } else {
            // 新規作成
            const newList: EvangelistList = {
              id: Date.now(),
              title: list.title,
              description: list.description,
              animeIds: list.animeIds,
              createdAt: new Date(),
            };
            setEvangelistLists([...evangelistLists, newList]);
          }
          setEditingList(null);
        }}
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
        />
      )}

      <AddCharacterModal
        show={showAddCharacterModal}
        onClose={() => {
          setShowAddCharacterModal(false);
          setEditingCharacter(null);
        }}
        allAnimes={allAnimes}
        editingCharacter={editingCharacter}
        favoriteCharacters={favoriteCharacters}
        onSave={(character) => {
          if (editingCharacter) {
            // 編集
            setFavoriteCharacters(favoriteCharacters.map(c =>
              c.id === editingCharacter.id ? character : c
            ));
          } else {
            // 新規作成
            setFavoriteCharacters([...favoriteCharacters, character]);
          }
          setShowAddCharacterModal(false);
          setEditingCharacter(null);
        }}
      />

      <AddVoiceActorModal
        show={showAddVoiceActorModal}
        onClose={() => {
          setShowAddVoiceActorModal(false);
          setEditingVoiceActor(null);
        }}
        allAnimes={allAnimes}
        editingVoiceActor={editingVoiceActor}
        voiceActors={voiceActors}
        onSave={(actor) => {
          if (editingVoiceActor) {
            // 編集
            setVoiceActors(voiceActors.map(a =>
              a.id === editingVoiceActor.id ? actor : a
            ));
          } else {
            // 新規作成
            setVoiceActors([...voiceActors, actor]);
          }
          setShowAddVoiceActorModal(false);
          setEditingVoiceActor(null);
        }}
      />
      <CreateListModal
        show={showCreateListModal}
        onClose={() => {
          setShowCreateListModal(false);
          setEditingList(null);
        }}
        allAnimes={allAnimes}
        editingList={editingList}
        onSave={(list) => {
          if (editingList) {
            // 編集
            const updatedLists = evangelistLists.map(l =>
              l.id === editingList.id
                ? {
                    ...l,
                    title: list.title,
                    description: list.description,
                    animeIds: list.animeIds,
                  }
                : l
            );
            setEvangelistLists(updatedLists);
          } else {
            // 新規作成
            const newList: EvangelistList = {
              id: Date.now(),
              title: list.title,
              description: list.description,
              animeIds: list.animeIds,
              createdAt: new Date(),
            };
            setEvangelistLists([...evangelistLists, newList]);
          }
          setEditingList(null);
        }}
      />

      {/* 布教リスト詳細モーダル */}
      {selectedList && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedList(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 dark:text-white">{selectedList.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedList.description}</p>
            
            {/* アニメ一覧 */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {selectedList.animeIds.length}作品
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {selectedList.animeIds.map((animeId) => {
                  const anime = allAnimes.find(a => a.id === animeId);
                  if (!anime) return null;
                  const isImageUrl = anime.image && (anime.image.startsWith('http://') || anime.image.startsWith('https://'));
                  return (
                    <div
                      key={animeId}
                      onClick={() => {
                        setSelectedAnime(anime);
                        setSelectedList(null);
                      }}
                      className="bg-linear-to-br from-[#ffc2d1] to-[#ffb07c] rounded-xl p-3 text-white text-center cursor-pointer hover:scale-105 transition-transform"
                    >
                      {isImageUrl ? (
                        <img
                          src={anime.image}
                          alt={anime.title}
                          className="w-full h-16 object-cover rounded mb-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="text-3xl mb-1">🎬</div><p class="text-xs font-bold truncate">' + anime.title + '</p>';
                            }
                          }}
                        />
                      ) : (
                        <div className="text-3xl mb-1">{anime.image}</div>
                      )}
                      <p className="text-xs font-bold truncate">{anime.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      const animeTitles = selectedList.animeIds
                        .map(id => allAnimes.find(a => a.id === id)?.title)
                        .filter(Boolean)
                        .join('、');
                      
                      await navigator.share({
                        title: selectedList.title,
                        text: `${selectedList.description}\n\n${animeTitles}`,
                      });
                    } catch (error) {
                      console.error('Share failed:', error);
                    }
                  } else {
                    // フォールバック: テキストをクリップボードにコピー
                    const animeTitles = selectedList.animeIds
                      .map(id => allAnimes.find(a => a.id === id)?.title)
                      .filter(Boolean)
                      .join('、');
                    const shareText = `${selectedList.title}\n${selectedList.description}\n\n${animeTitles}`;
                    await navigator.clipboard.writeText(shareText);
                    alert('リストをクリップボードにコピーしました');
                  }
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                📤 シェア
              </button>
              <button
                onClick={() => {
                  setEditingList(selectedList);
                  setSelectedList(null);
                  setShowCreateListModal(true);
                }}
                className="flex-1 bg-[#ffc2d1] text-white py-3 rounded-xl font-bold hover:bg-[#ffb07c] transition-colors"
              >
                編集
              </button>
              <button
                onClick={() => {
                  setEvangelistLists(evangelistLists.filter(list => list.id !== selectedList.id));
                  setSelectedList(null);
                }}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                削除
              </button>
            </div>
            
            <button
              onClick={() => setSelectedList(null)}
              className="w-full mt-3 text-gray-500 dark:text-gray-400 text-sm"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <AddCharacterModal
        show={showAddCharacterModal}
        onClose={() => {
          setShowAddCharacterModal(false);
          setEditingCharacter(null);
        }}
        allAnimes={allAnimes}
        editingCharacter={editingCharacter}
        favoriteCharacters={favoriteCharacters}
        onSave={(character) => {
          if (editingCharacter) {
            setFavoriteCharacters(favoriteCharacters.map(c => 
              c.id === editingCharacter.id ? character : c
            ));
          } else {
            setFavoriteCharacters([...favoriteCharacters, character]);
          }
          setShowAddCharacterModal(false);
          setEditingCharacter(null);
        }}
      />

      <AddVoiceActorModal
        show={showAddVoiceActorModal}
        onClose={() => {
          setShowAddVoiceActorModal(false);
          setEditingVoiceActor(null);
        }}
        allAnimes={allAnimes}
        editingVoiceActor={editingVoiceActor}
        voiceActors={voiceActors}
        onSave={(voiceActor) => {
          if (editingVoiceActor) {
            const updated = voiceActors.map(va => 
              va.id === editingVoiceActor.id ? voiceActor : va
            );
            setVoiceActors(updated);
            if (typeof window !== 'undefined') {
              localStorage.setItem('voiceActors', JSON.stringify(updated));
            }
          } else {
            const updated = [...voiceActors, voiceActor];
            setVoiceActors(updated);
            if (typeof window !== 'undefined') {
              localStorage.setItem('voiceActors', JSON.stringify(updated));
            }
          }
          setShowAddVoiceActorModal(false);
          setEditingVoiceActor(null);
        }}
      />

      <AddQuoteModal
        show={showAddQuoteModal}
        onClose={() => {
          setShowAddQuoteModal(false);
          setEditingQuote(null);
        }}
        allAnimes={allAnimes}
        seasons={seasons}
        setSeasons={setSeasons}
        user={user}
        editingQuote={editingQuote}
        onSave={() => {
          setShowAddQuoteModal(false);
          setEditingQuote(null);
        }}
      />

      <SongModal
        show={showSongModal}
        onClose={() => {
          setShowSongModal(false);
          setSongType(null);
          setSelectedAnime(null);
          setNewSongTitle('');
          setNewSongArtist('');
        }}
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
        onClose={() => setShowDNAModal(false)}
        allAnimes={allAnimes}
        favoriteAnimeIds={favoriteAnimeIds}
        count={count}
        averageRating={averageRating}
      />

    </div>
  );
}