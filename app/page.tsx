'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import { searchAnime, searchAnimeBySeason } from './lib/anilist';
import type { UserProfile } from './lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { 
  searchUsers, 
  getRecommendedUsers, 
  followUser, 
  unfollowUser, 
  getFollowers, 
  getFollowing, 
  getPublicProfile, 
  getPublicAnimes,
  isFollowing,
  getFollowCounts,
  upsertUserProfile,
  getMyProfile
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
import { translateGenre } from './utils/helpers';




// メインページ
export default function Home() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const prevSeasonsRef = useRef<string>('');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [count, setCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showFavoriteAnimeModal, setShowFavoriteAnimeModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDNAModal, setShowDNAModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newAnimeTitle, setNewAnimeTitle] = useState('');
  const [newAnimeIcon, setNewAnimeIcon] = useState('🎬');
  const [newAnimeRating, setNewAnimeRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<any | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userName, setUserName] = useState<string>('ユーザー');
  const [userIcon, setUserIcon] = useState<string>('👤');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [userOtakuType, setUserOtakuType] = useState<string>('');
  const [favoriteAnimeIds, setFavoriteAnimeIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'discover' | 'collection' | 'profile'>('home');
  const [homeSubTab, setHomeSubTab] = useState<'seasons' | 'series'>('seasons');
  const [discoverSubTab, setDiscoverSubTab] = useState<'trends'>('trends');
  const [collectionSubTab, setCollectionSubTab] = useState<'achievements' | 'characters' | 'quotes' | 'lists' | 'music' | 'voiceActors'>('achievements');
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [evangelistLists, setEvangelistLists] = useState<EvangelistList[]>([]);
  const [favoriteCharacters, setFavoriteCharacters] = useState<FavoriteCharacter[]>([]);
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([]);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [selectedList, setSelectedList] = useState<EvangelistList | null>(null);
  const [editingList, setEditingList] = useState<EvangelistList | null>(null);
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterAnimeId, setNewCharacterAnimeId] = useState<number | null>(null);
  const [newCharacterImage, setNewCharacterImage] = useState('👤');
  const [newCharacterCategory, setNewCharacterCategory] = useState('');
  const [newCharacterTags, setNewCharacterTags] = useState<string[]>([]);
  const [newCustomTag, setNewCustomTag] = useState('');
  const [editingCharacter, setEditingCharacter] = useState<FavoriteCharacter | null>(null);
  const [characterFilter, setCharacterFilter] = useState<string | null>(null);
  const [showAddVoiceActorModal, setShowAddVoiceActorModal] = useState(false);
  const [newVoiceActorName, setNewVoiceActorName] = useState('');
  const [newVoiceActorImage, setNewVoiceActorImage] = useState('🎤');
  const [newVoiceActorAnimeIds, setNewVoiceActorAnimeIds] = useState<number[]>([]);
  const [newVoiceActorNotes, setNewVoiceActorNotes] = useState('');
  const [editingVoiceActor, setEditingVoiceActor] = useState<VoiceActor | null>(null);
  const [voiceActorSearchQuery, setVoiceActorSearchQuery] = useState('');
  const [quoteSearchQuery, setQuoteSearchQuery] = useState('');
  const [quoteFilterType, setQuoteFilterType] = useState<'all' | 'anime' | 'character'>('all');
  const [selectedAnimeForFilter, setSelectedAnimeForFilter] = useState<number | null>(null);
  const [listSortType, setListSortType] = useState<'date' | 'title' | 'count'>('date');
  
  // SNS機能の状態管理
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<UserProfile[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<UserProfile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [selectedUserAnimes, setSelectedUserAnimes] = useState<Anime[]>([]);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [userFollowStatus, setUserFollowStatus] = useState<{ [userId: string]: boolean }>({});
  const [followCounts, setFollowCounts] = useState<{ following: number; followers: number }>({ following: 0, followers: 0 });
  const [showFollowListModal, setShowFollowListModal] = useState(false);
  const [followListType, setFollowListType] = useState<'following' | 'followers'>('following');
  const [followListUsers, setFollowListUsers] = useState<UserProfile[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [userBio, setUserBio] = useState('');
  const [userHandle, setUserHandle] = useState<string>('');
  
  // フォロー/フォロワー一覧モーダルを開く際にデータを読み込む
  useEffect(() => {
    if (showFollowListModal && user) {
      const loadFollowList = async () => {
        try {
          if (followListType === 'following') {
            const following = await getFollowing(user.id);
            setFollowListUsers(following);
          } else {
            const followers = await getFollowers(user.id);
            setFollowListUsers(followers);
          }
        } catch (error) {
          console.error('Failed to load follow list:', error);
        }
      };
      
      loadFollowList();
    }
  }, [showFollowListModal, followListType, user]);
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<{ animeId: number; quoteIndex: number } | null>(null);
  const [newQuoteAnimeId, setNewQuoteAnimeId] = useState<number | null>(null);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteCharacter, setNewQuoteCharacter] = useState('');
  const [showSongModal, setShowSongModal] = useState(false);
  const [songType, setSongType] = useState<'op' | 'ed' | null>(null);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [addModalMode, setAddModalMode] = useState<'search' | 'season'>('search');
  const [selectedSeason, setSelectedSeason] = useState<'SPRING' | 'SUMMER' | 'FALL' | 'WINTER' | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [seasonSearchResults, setSeasonSearchResults] = useState<any[]>([]);
  const [selectedSeasonAnimeIds, setSelectedSeasonAnimeIds] = useState<Set<number>>(new Set());
  const [isSeasonSearching, setIsSeasonSearching] = useState(false);
  const [seasonSearchPage, setSeasonSearchPage] = useState(1);
  const [hasMoreSeasonResults, setHasMoreSeasonResults] = useState(false);
  const [animeDetailTab, setAnimeDetailTab] = useState<'info' | 'reviews'>('info');
  const [animeReviews, setAnimeReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'overall' | 'episode'>('all');
  const [reviewSort, setReviewSort] = useState<'newest' | 'likes' | 'helpful'>('newest');
  const [userSpoilerHidden, setUserSpoilerHidden] = useState(false);
  const [expandedSpoilerReviews, setExpandedSpoilerReviews] = useState<Set<string>>(new Set());

  // 認証状態の監視
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 現在のセッションを確認
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      // 認証状態の変化を監視
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // localStorageから初期値を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('userName');
      const savedIcon = localStorage.getItem('userIcon');
      const savedDarkMode = localStorage.getItem('darkMode');
      const savedOtakuType = localStorage.getItem('userOtakuType');
      const savedFavoriteAnimeIds = localStorage.getItem('favoriteAnimeIds');
      const savedSeasons = localStorage.getItem('animeSeasons');
      const savedLists = localStorage.getItem('evangelistLists');
      const savedCharacters = localStorage.getItem('favoriteCharacters');
      
      if (savedName) setUserName(savedName);
      if (savedIcon) setUserIcon(savedIcon);
      if (savedDarkMode === 'true') setIsDarkMode(true);
      if (savedOtakuType) setUserOtakuType(savedOtakuType);
      if (savedFavoriteAnimeIds) {
        try {
          setFavoriteAnimeIds(JSON.parse(savedFavoriteAnimeIds));
        } catch (e) {
          console.error('Failed to parse favoriteAnimeIds', e);
        }
      }
      
      // 布教リストを読み込む
      if (savedLists) {
        try {
          const parsedLists = JSON.parse(savedLists);
          // Date型に変換
          const listsWithDates = parsedLists.map((list: any) => ({
            ...list,
            createdAt: new Date(list.createdAt),
          }));
          setEvangelistLists(listsWithDates);
        } catch (e) {
          console.error('Failed to parse evangelist lists', e);
        }
      }
      
      // 推しキャラを読み込む
      if (savedCharacters) {
        try {
          const parsedCharacters = JSON.parse(savedCharacters);
          // サンプルデータを検出（IDが1-3のキャラクターが含まれている場合）
          const hasSampleData = parsedCharacters.some((char: FavoriteCharacter) =>
            char.id >= 1 && char.id <= 3
          );
          
          if (hasSampleData) {
            // サンプルデータが含まれている場合はlocalStorageをクリア
            localStorage.removeItem('favoriteCharacters');
            setFavoriteCharacters([]);
          } else {
            setFavoriteCharacters(parsedCharacters);
          }
        } catch (e) {
          console.error('Failed to parse favorite characters', e);
          // エラーの場合は空の配列を使用
          setFavoriteCharacters([]);
        }
      } else {
        // 保存データがない場合は空の配列を使用
        setFavoriteCharacters([]);
      }
      
      // アニメデータを読み込む（未ログイン時のみlocalStorageから、ログイン時はSupabaseから読み込む）
      // ログイン時はSupabaseからの読み込み処理（useEffect）で上書きされるため、ここでは未ログイン時の処理のみ
      // ただし、isLoadingが完了するまで待つ必要があるため、この処理は認証状態確認後に行う
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

  // ユーザー情報をlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userName', userName);
      localStorage.setItem('userIcon', userIcon);
      if (userOtakuType) {
        localStorage.setItem('userOtakuType', userOtakuType);
      } else {
        localStorage.removeItem('userOtakuType');
      }
      localStorage.setItem('favoriteAnimeIds', JSON.stringify(favoriteAnimeIds));
    }
  }, [userName, userIcon, userOtakuType, favoriteAnimeIds]);

  // アニメデータをlocalStorageに保存（未ログイン時のみ）
  useEffect(() => {
    if (typeof window !== 'undefined' && !user && seasons.length > 0) {
      const seasonsString = JSON.stringify(seasons);
      // 前回の値と比較して、変更があった場合のみ保存
      if (prevSeasonsRef.current !== seasonsString) {
        localStorage.setItem('animeSeasons', seasonsString);
        prevSeasonsRef.current = seasonsString;
      }
    }
  }, [seasons, user]);

  // 布教リストをlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('evangelistLists', JSON.stringify(evangelistLists));
    }
  }, [evangelistLists]);

  // 推しキャラをlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined' && favoriteCharacters.length > 0) {
      localStorage.setItem('favoriteCharacters', JSON.stringify(favoriteCharacters));
    }
  }, [favoriteCharacters]);

  // 認証処理

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // ログアウト時にseasonsを空にする
      setSeasons([]);
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  // シーズン名を日本語に変換
  const getSeasonName = (season: string) => {
    const seasonMap: { [key: string]: string } = {
      'WINTER': '冬',
      'SPRING': '春',
      'SUMMER': '夏',
      'FALL': '秋',
    };
    return seasonMap[season] || season;
  };

  // SNS機能の関数
  const handleUserSearch = async () => {
    if (!userSearchQuery.trim()) return;
    
    setIsSearchingUsers(true);
    try {
      const results = await searchUsers(userSearchQuery.trim());
      setSearchedUsers(results);
      
      // フォロー状態を確認
      if (user) {
        const followStatus: { [userId: string]: boolean } = {};
        await Promise.all(
          results.map(async (u) => {
            followStatus[u.id] = await isFollowing(u.id);
          })
        );
        setUserFollowStatus(prev => ({ ...prev, ...followStatus }));
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleViewUserProfile = async (userId: string) => {
    try {
      const profile = await getPublicProfile(userId);
      if (!profile) {
        alert('このユーザーのプロフィールは公開されていません');
        return;
      }
      
      const animes = await getPublicAnimes(userId);
      const following = await isFollowing(userId);
      
      setSelectedUserProfile(profile);
      setSelectedUserAnimes(animes.map(a => supabaseToAnime(a)));
      setUserFollowStatus(prev => ({ ...prev, [userId]: following }));
      setShowUserProfileModal(true);
    } catch (error) {
      console.error('Failed to view user profile:', error);
      alert('プロフィールの取得に失敗しました');
    }
  };

  const handleToggleFollow = async (userId: string) => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }
    
    const currentlyFollowing = userFollowStatus[userId] || false;
    
    try {
      let success = false;
      if (currentlyFollowing) {
        success = await unfollowUser(userId);
      } else {
        success = await followUser(userId);
      }
      
      if (success) {
        setUserFollowStatus(prev => ({
          ...prev,
          [userId]: !currentlyFollowing,
        }));
        
        // フォロー数を更新
        if (user) {
          const counts = await getFollowCounts(user.id);
          setFollowCounts(counts);
        }
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      alert('フォロー操作に失敗しました');
    }
  };

  // 検索処理
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setSelectedSearchResult(null);
    
    try {
      const results = await searchAnime(searchQuery.trim());
      setSearchResults(results || []);
    } catch (error) {
      console.error('Failed to search anime:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // タイトルからシリーズ名を自動判定する関数
  const extractSeriesName = (title: string): string | undefined => {
    // 「2期」「3期」「Season 2」「S2」などのパターンを検出
    const patterns = [
      /^(.+?)\s*[第]?(\d+)[期季]/,
      /^(.+?)\s*Season\s*(\d+)/i,
      /^(.+?)\s*S(\d+)/i,
      /^(.+?)\s*第(\d+)期/,
      /^(.+?)\s*第(\d+)シーズン/i,
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return undefined;
  };

  // 検索結果を選択した時の処理
  const handleSelectSearchResult = (result: any) => {
    setSelectedSearchResult(result);
    
    const title = result.title?.native || result.title?.romaji || '';
    
    // タイトルを自動入力
    setNewAnimeTitle(title);
    
    // シリーズ名を自動判定
    const seriesName = extractSeriesName(title);
    // シリーズ名は後でnewAnimeに設定する際に使用
    
    // 画像URLを設定（largeがあればlarge、なければmediumを使用）
    if (result.coverImage?.large || result.coverImage?.medium) {
      setNewAnimeIcon(result.coverImage.large || result.coverImage.medium);
    }
    
    // シーズン名を自動設定
    if (result.seasonYear && result.season) {
      const seasonName = `${result.seasonYear}年${getSeasonName(result.season)}`;
      // 既存のシーズンに追加するか、新しいシーズンを作成
      const existingSeason = seasons.find(s => s.name === seasonName);
      if (!existingSeason && seasons.length > 0) {
        // 最新のシーズンに追加する場合は、そのシーズン名を使用
        // ここでは既存のロジックに任せる
      }
    }
  };

  // データマッピング関数：Anime型 → Supabase形式（snake_case）
  const animeToSupabase = (anime: Anime, seasonName: string, userId: string) => {
    return {
      user_id: userId,
      season_name: seasonName,
      title: anime.title,
      image: anime.image || null,
      rating: anime.rating && anime.rating > 0 ? anime.rating : null, // 0の場合はNULLにする
      watched: anime.watched ?? false,
      rewatch_count: anime.rewatchCount ?? 0,
                      tags: (anime.tags && anime.tags.length > 0) ? anime.tags : null,
                      songs: anime.songs || null,
                      quotes: anime.quotes || null,
                      series_name: anime.seriesName || null,
                      studios: (anime.studios && anime.studios.length > 0) ? anime.studios : null,
    };
  };

  // データマッピング関数：Supabase形式 → Anime型
  const supabaseToAnime = (row: any): Anime => {
    return {
      id: row.id,
      title: row.title,
      image: row.image,
      rating: row.rating,
      watched: row.watched,
      rewatchCount: row.rewatch_count ?? 0,
      tags: row.tags || [],
      songs: row.songs || undefined,
      quotes: row.quotes || undefined,
      seriesName: row.series_name || undefined,
      studios: row.studios || undefined,
    };
  };

  // 感想をSupabaseから読み込む
  const loadReviews = async (animeId: number) => {
    if (!user) {
      setAnimeReviews([]);
      return;
    }
    
    setLoadingReviews(true);
    try {
      // アニメのUUIDを取得（animesテーブルから）
      const { data: animeData, error: animeError } = await supabase
        .from('animes')
        .select('id')
        .eq('id', animeId)
        .eq('user_id', user.id)
        .single();
      
      if (animeError || !animeData) {
        console.error('Failed to find anime:', animeError);
        setAnimeReviews([]);
        setLoadingReviews(false);
        return;
      }
      
      const animeUuid = animeData.id;
      
      // 感想を取得
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('anime_id', animeUuid)
        .order('created_at', { ascending: false });
      
      if (reviewsError) throw reviewsError;
      
      // 現在のユーザーがいいね/役に立ったを押したか確認
      if (reviewsData && reviewsData.length > 0) {
        const reviewIds = reviewsData.map(r => r.id);
        
        // いいね情報を取得
        const { data: likesData } = await supabase
          .from('review_likes')
          .select('review_id')
          .in('review_id', reviewIds)
          .eq('user_id', user.id);
        
        // 役に立った情報を取得
        const { data: helpfulData } = await supabase
          .from('review_helpful')
          .select('review_id')
          .in('review_id', reviewIds)
          .eq('user_id', user.id);
        
        const likedReviewIds = new Set(likesData?.map(l => l.review_id) || []);
        const helpfulReviewIds = new Set(helpfulData?.map(h => h.review_id) || []);
        
        const reviews: Review[] = reviewsData.map((r: any) => ({
          id: r.id,
          animeId: animeId, // 数値IDを保持
          userId: r.user_id,
          userName: r.user_name,
          userIcon: r.user_icon,
          type: r.type as 'overall' | 'episode',
          episodeNumber: r.episode_number || undefined,
          content: r.content,
          containsSpoiler: r.contains_spoiler,
          spoilerHidden: r.spoiler_hidden,
          likes: r.likes || 0,
          helpfulCount: r.helpful_count || 0,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
          userLiked: likedReviewIds.has(r.id),
          userHelpful: helpfulReviewIds.has(r.id),
        }));
        
        setAnimeReviews(reviews);
      } else {
        setAnimeReviews([]);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setAnimeReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // アニメが選択されたときに感想を読み込む
  useEffect(() => {
    if (selectedAnime && user) {
      loadReviews(selectedAnime.id);
    } else {
      setAnimeReviews([]);
    }
  }, [selectedAnime?.id, user]);

  // ログイン時にSupabaseからアニメデータを読み込む、未ログイン時はlocalStorageから読み込む
  useEffect(() => {
    const loadAnimes = async () => {
      if (isLoading) return;

      if (user) {
        // ログイン時：Supabaseから読み込む
        try {
          const { data, error } = await supabase
            .from('animes')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: true });

          if (error) throw error;

          if (data && data.length > 0) {
            // シーズンごとにグループ化
            const seasonMap = new Map<string, Anime[]>();
            data.forEach((row) => {
              const anime = supabaseToAnime(row);
              const seasonName = row.season_name || '未分類';
              if (!seasonMap.has(seasonName)) {
                seasonMap.set(seasonName, []);
              }
              seasonMap.get(seasonName)!.push(anime);
            });

            // Season型に変換
            const loadedSeasons: Season[] = Array.from(seasonMap.entries()).map(([name, animes]) => ({
              name,
              animes,
            }));

            if (loadedSeasons.length > 0) {
              setSeasons(loadedSeasons);
              setExpandedSeasons(new Set([loadedSeasons[0].name]));
            } else {
              setSeasons([]);
            }
          } else {
            setSeasons([]);
          }
        } catch (error) {
          console.error('Failed to load animes from Supabase:', error);
        }
      } else {
        // 未ログイン時：localStorageから読み込む
        if (typeof window !== 'undefined') {
          const savedSeasons = localStorage.getItem('animeSeasons');
          if (savedSeasons) {
            try {
              const parsedSeasons = JSON.parse(savedSeasons);
              // サンプルデータを検出（IDが1-4のアニメが含まれている場合）
              const hasSampleData = parsedSeasons.some((season: Season) =>
                season.animes.some((anime: Anime) => anime.id >= 1 && anime.id <= 4)
              );
              
              if (hasSampleData) {
                // サンプルデータが含まれている場合はlocalStorageをクリア
                localStorage.removeItem('animeSeasons');
                setSeasons([]);
              } else {
                setSeasons(parsedSeasons);
                if (parsedSeasons.length > 0) {
                  setExpandedSeasons(new Set([parsedSeasons[0].name]));
                }
              }
            } catch (e) {
              // パースエラーの場合は空の配列を使用
              setSeasons([]);
            }
          } else {
            // 保存データがない場合は空の配列を使用
            setSeasons([]);
          }
        }
      }
    };

    loadAnimes();
  }, [user, isLoading]);

  // ログイン時にプロフィール情報を読み込む
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profile = await getMyProfile();
          if (profile) {
            setMyProfile(profile);
            setUserName(profile.username || userName);
            setUserBio(profile.bio || '');
            setIsProfilePublic(profile.is_public || false);
            setUserHandle(profile.handle || '');
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      } else {
        setMyProfile(null);
        setUserHandle('');
      }
    };
    
    loadProfile();
  }, [user]);

  // すべてのアニメを取得
  const allAnimes = seasons.flatMap(season => season.animes);

  // 平均評価を計算
  const averageRating = allAnimes.length > 0 && allAnimes.some(a => a.rating > 0)
    ? allAnimes.filter(a => a.rating > 0).reduce((sum, a) => sum + a.rating, 0) / allAnimes.filter(a => a.rating > 0).length
    : 0;

  // 累計周回数を計算
  const totalRewatchCount = allAnimes.reduce((sum, a) => sum + (a.rewatchCount ?? 0), 0);

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
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10 lg:ml-[200px]">
        <div className="max-w-md md:max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-black bg-linear-to-r from-[#ffc2d1] to-[#ffb07c] bg-clip-text text-transparent">
            俺のアニメログ
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            {user ? (
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-2xl">{userIcon}</span>
                <span className="font-bold text-sm dark:text-white">{userName}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1.5 rounded-full bg-[#ffc2d1] hover:bg-[#ffb07c] text-white font-bold text-sm transition-colors"
              >
                ログイン
              </button>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-md md:max-w-6xl mx-auto px-4 py-6 pb-24 lg:pb-6 lg:ml-[200px]">
        {activeTab === 'home' && (
          <>
            {/* サブタブ */}
            <div className="flex gap-2 md:gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setHomeSubTab('seasons')}
                    className={`px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all ${
                  homeSubTab === 'seasons'
                    ? 'bg-[#ffc2d1] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                クール別
              </button>
              <button
                onClick={() => setHomeSubTab('series')}
                    className={`px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all ${
                  homeSubTab === 'series'
                    ? 'bg-[#ffc2d1] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                シリーズ
              </button>
            </div>

            {homeSubTab === 'seasons' && (
              <>
                {/* 統計カード */}
                <div className="bg-linear-to-br from-[#ffc2d1] to-[#ffb07c] rounded-2xl p-5 text-white mb-6 relative">
                  {/* オタクタイプ */}
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-white/90 text-sm font-medium">
                      あなたは 🎵 音響派
                    </p>
                  </div>
                  
                  {/* 統計情報 */}
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-black">{count}</p>
                      <p className="text-white/80 text-xs mt-1">作品</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black">{totalRewatchCount}</p>
                      <p className="text-white/80 text-xs mt-1">周</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black">
                        {averageRating > 0 ? `⭐${averageRating.toFixed(1)}` : '⭐0.0'}
                      </p>
                      <p className="text-white/80 text-xs mt-1">平均評価</p>
                    </div>
                  </div>
                </div>

                {/* 追加ボタン */}
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="w-full mb-6 py-4 border-2 border-dashed border-[#ffc2d1]-300 dark:border-[#ffc2d1]-600 rounded-2xl text-[#ffc2d1] dark:text-[#ffc2d1] font-bold hover:bg-[#ffc2d1]/10 dark:hover:bg-[#ffc2d1]/10 transition-colors"
                >
                  + アニメを追加
                </button>

                {/* アニメ一覧 */}
                {seasons.map((season) => {
              const isExpanded = expandedSeasons.has(season.name);
              const watchedCount = season.animes.filter(a => a.watched).length;
              
              return (
                <div key={season.name} className="mb-6">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedSeasons);
                      if (isExpanded) {
                        newExpanded.delete(season.name);
                      } else {
                        newExpanded.add(season.name);
                      }
                      setExpandedSeasons(newExpanded);
                    }}
                    className="w-full flex items-center justify-between mb-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <h2 className="font-bold text-lg dark:text-white">{season.name}</h2>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {watchedCount}/{season.animes.length}作品
                    </span>
                  </button>
                  
                  {isExpanded && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {season.animes.map((anime) => (
            <AnimeCard 
              key={anime.id} 
              anime={anime}
              onClick={() => setSelectedAnime(anime)}
            />
          ))}
        </div>
                  )}
                </div>
              );
            })}
              </>
            )}

            {homeSubTab === 'series' && (
              <div className="space-y-6">
                {(() => {
                  // すべてのアニメを取得
                  const allAnimes = seasons.flatMap(s => s.animes);
                  
                  // シリーズごとにグループ化
                  const seriesMap = new Map<string, Anime[]>();
                  const standaloneAnimes: Anime[] = [];
                  
                  allAnimes.forEach(anime => {
                    if (anime.seriesName) {
                      if (!seriesMap.has(anime.seriesName)) {
                        seriesMap.set(anime.seriesName, []);
                      }
                      seriesMap.get(anime.seriesName)!.push(anime);
                    } else {
                      standaloneAnimes.push(anime);
                    }
                  });
                  
                  // シリーズ内を時系列順にソート（seasonNameから判断、または追加順）
                  seriesMap.forEach((animes, seriesName) => {
                    animes.sort((a, b) => {
                      // 同じシーズン内の順序を保持するため、元の順序を使用
                      const aSeason = seasons.find(s => s.animes.includes(a));
                      const bSeason = seasons.find(s => s.animes.includes(b));
                      if (aSeason && bSeason) {
                        const seasonIndexA = seasons.indexOf(aSeason);
                        const seasonIndexB = seasons.indexOf(bSeason);
                        if (seasonIndexA !== seasonIndexB) {
                          return seasonIndexA - seasonIndexB;
                        }
                        const animeIndexA = aSeason.animes.indexOf(a);
                        const animeIndexB = bSeason.animes.indexOf(b);
                        return animeIndexA - animeIndexB;
                      }
                      return 0;
                    });
                  });
                  
                  const seriesArray = Array.from(seriesMap.entries());
                  
                  return (
                    <>
                      {/* シリーズ一覧 */}
                      {seriesArray.map(([seriesName, animes]) => (
                        <div key={seriesName} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl font-bold dark:text-white">{seriesName}</h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              全{animes.length}作品
                            </span>
                          </div>
                          <div className="overflow-x-auto pb-2 scrollbar-hide">
                            <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
                              {animes.map((anime) => (
                                <div
                                  key={anime.id}
                                  onClick={() => setSelectedAnime(anime)}
                                  className="shrink-0 w-24 cursor-pointer"
                                >
                                  <AnimeCard anime={anime} onClick={() => setSelectedAnime(anime)} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* 単発作品 */}
                      {standaloneAnimes.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl font-bold dark:text-white">単発作品</h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              全{standaloneAnimes.length}作品
                            </span>
                          </div>
                          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {standaloneAnimes.map((anime) => (
                              <AnimeCard
                                key={anime.id}
                                anime={anime}
                                onClick={() => setSelectedAnime(anime)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {seriesArray.length === 0 && standaloneAnimes.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                          アニメが登録されていません
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'discover' && (
          <>
            {discoverSubTab === 'trends' && (
              <div className="space-y-6">
                {(() => {
                  // 統計データの計算
                  const totalAnimes = allAnimes.length;
                  const totalRewatchCount = allAnimes.reduce((sum, a) => sum + (a.rewatchCount ?? 0), 0);
                  // 評価が未登録（rating: 0またはnull）の場合は平均計算から除外
                  const ratedAnimes = allAnimes.filter(a => a.rating && a.rating > 0);
                  const avgRating = ratedAnimes.length > 0
                    ? ratedAnimes.reduce((sum, a) => sum + a.rating, 0) / ratedAnimes.length
                    : 0;
                  
                  // 最も見たクールを計算
                  const seasonCounts: { [key: string]: number } = {};
                  seasons.forEach(season => {
                    seasonCounts[season.name] = season.animes.length;
                  });
                  const mostWatchedSeason = Object.entries(seasonCounts)
                    .sort((a, b) => b[1] - a[1])[0];
                  
                  // タグの使用頻度
                  const tagCounts: { [key: string]: number } = {};
                  allAnimes.forEach(anime => {
                    anime.tags?.forEach(tag => {
                      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                  });
                  const sortedTags = Object.entries(tagCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                  const maxTagCount = sortedTags.length > 0 ? sortedTags[0][1] : 1;
                  
                  // 評価分布
                  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
                    rating,
                    count: allAnimes.filter(a => a.rating === rating).length,
                  }));
                  const maxRatingCount = Math.max(...ratingCounts.map(r => r.count), 1);
                  
                  // クール別視聴数
                  const seasonAnimeCounts = seasons.map(season => ({
                    name: season.name,
                    count: season.animes.length,
                  }));
                  const maxSeasonCount = Math.max(...seasonAnimeCounts.map(s => s.count), 1);
                  
                  // タグの集計（マイページから移動）
                  const tagCountsForProfile: { [key: string]: number } = {};
                  allAnimes.forEach(anime => {
                    anime.tags?.forEach(tag => {
                      tagCountsForProfile[tag] = (tagCountsForProfile[tag] || 0) + 1;
                    });
                  });
                  const sortedTagsForProfile = Object.entries(tagCountsForProfile)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                  const mostPopularTag = sortedTagsForProfile[0] ? availableTags.find(t => t.value === sortedTagsForProfile[0][0]) : null;
                  
                  // 制作会社を実際のアニメデータから集計
                  const studioCounts: { [key: string]: number } = {};
                  allAnimes.forEach(anime => {
                    if (anime.studios && Array.isArray(anime.studios)) {
                      anime.studios.forEach(studio => {
                        if (studio) {
                          studioCounts[studio] = (studioCounts[studio] || 0) + 1;
                        }
                      });
                    }
                  });
                  const studios = Object.entries(studioCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10); // 上位10社
                  
                  // 傾向テキスト生成
                  const topTags = sortedTags.slice(0, 2);
                  const tendencyText = topTags.length > 0
                    ? `あなたは${topTags.map(([tag]) => {
                        const tagInfo = availableTags.find(t => t.value === tag);
                        return `${tagInfo?.emoji}${tagInfo?.label || tag}`;
                      }).join('と')}な作品を好む傾向があります`
                    : 'データが不足しています';
                  
                  return (
                    <>
                      {/* 視聴統計サマリー（統合版、一番上） */}
                      <div className="bg-linear-to-br from-[#ffc2d1] to-[#ffb07c] rounded-2xl p-5 text-white shadow-lg">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <span>📊</span>
                          視聴統計サマリー
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                            <p className="text-white/80 text-xs mb-1">総視聴作品数</p>
                            <p className="text-2xl font-black">{totalAnimes}</p>
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                            <p className="text-white/80 text-xs mb-1">総周回数</p>
                            <p className="text-2xl font-black">{totalRewatchCount}</p>
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                            <p className="text-white/80 text-xs mb-1">平均評価</p>
                            <p className="text-2xl font-black">
                              {avgRating > 0 ? `⭐${avgRating.toFixed(1)}` : '⭐0.0'}
                            </p>
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                            <p className="text-white/80 text-xs mb-1">最も見たクール</p>
                            <p className="text-lg font-bold truncate">
                              {mostWatchedSeason ? mostWatchedSeason[0] : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* あなたの傾向まとめ（サマリーの次） */}
                      <div className="bg-linear-to-br from-[#ffc2d1] to-[#ffb07c] rounded-2xl p-5 text-white shadow-lg">
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                          <span>✨</span>
                          あなたの傾向まとめ
                        </h3>
                        <p className="text-sm leading-relaxed">{tendencyText}</p>
                      </div>

                      {/* ジャンル分布 */}
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
                        <h3 className="font-bold text-lg mb-3 dark:text-white flex items-center gap-2">
                          <span>🏷️</span>
                          ジャンル分布
                        </h3>
                        {sortedTags.length > 0 ? (
                          <div className="space-y-3">
                            {sortedTags.map(([tag, count]) => {
                              const tagInfo = availableTags.find(t => t.value === tag);
                              const percentage = (count / maxTagCount) * 100;
                              const barWidth = Math.round(percentage / 5) * 5; // 5%刻み
                              
                              return (
                                <div key={tag} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium dark:text-white">
                                      {tagInfo?.emoji} {tagInfo?.label || tag}
                                    </span>
                                    <span className="text-sm font-bold text-[#ffc2d1] dark:text-[#ffc2d1]">
                                      {Math.round((count / totalAnimes) * 100)}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                      <div
                                        className="bg-linear-to-r from-indigo-500 to-purple-500 h-full transition-all"
                                        style={{ width: `${barWidth}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                                      {count}本
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 text-center py-4">データがありません</p>
                        )}
                      </div>

                      {/* 評価分布 */}
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
                        <h3 className="font-bold text-lg mb-3 dark:text-white flex items-center gap-2">
                          <span>⭐</span>
                          評価分布
                        </h3>
                        <div className="space-y-3">
                          {ratingCounts.map(({ rating, count }) => {
                            const percentage = (count / maxRatingCount) * 100;
                            const barWidth = Math.round(percentage / 5) * 5;
                            const ratingLabel = ratingLabels[rating];
                            
                            return (
                              <div key={rating} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium dark:text-white">
                                    ⭐{rating} {ratingLabel?.label || ''}
                                  </span>
                                  <span className="text-sm font-bold text-[#ffc2d1] dark:text-[#ffc2d1]">
                                    {count}本
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div
                                      className="bg-linear-to-r from-yellow-400 to-orange-500 h-full transition-all"
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                            {ratingCounts.find(r => r.rating === 5)?.count || 0}本の神作、
                            {ratingCounts.find(r => r.rating === 4)?.count || 0}本の名作、
                            {ratingCounts.find(r => r.rating === 3)?.count || 0}本の普通作品
                          </p>
                        </div>
                      </div>

                      {/* 視聴ペース */}
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
                        <h3 className="font-bold text-lg mb-3 dark:text-white flex items-center gap-2">
                          <span>📅</span>
                          視聴ペース
                        </h3>
                        {seasonAnimeCounts.length > 0 ? (
                          <div className="space-y-3">
                            {seasonAnimeCounts.map(({ name, count }) => {
                              const percentage = (count / maxSeasonCount) * 100;
                              const barWidth = Math.round(percentage / 5) * 5;
                              
                              return (
                                <div key={name} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium dark:text-white">{name}</span>
                                    <span className="text-sm font-bold text-[#ffc2d1] dark:text-[#ffc2d1]">
                                      {count}本
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                      <div
                                        className="bg-linear-to-r from-green-400 to-blue-500 h-full transition-all"
                                        style={{ width: `${barWidth}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 text-center py-4">データがありません</p>
                        )}
                      </div>

                      {/* よく見る制作会社（最後） */}
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
                        <h3 className="font-bold text-lg mb-3 dark:text-white">よく見る制作会社</h3>
                        {studios.length > 0 ? (
                          <div className="space-y-2">
                            {studios.map((studio) => (
                              <div key={studio.name} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-0">
                                <span className="font-medium dark:text-white">{studio.name}</span>
                                <span className="text-gray-500 dark:text-gray-400">{studio.count}作品</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 text-center py-4">データがありません</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

          </>
        )}

        {activeTab === 'collection' && (
          <>
            {/* サブタブ */}
            <div className="flex gap-3 md:gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setCollectionSubTab('achievements')}
                className={`px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold whitespace-nowrap transition-all min-w-[100px] md:min-w-[120px] text-center ${
                  collectionSubTab === 'achievements'
                    ? 'bg-[#ffc2d1] text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                実績
              </button>
              <button
                onClick={() => setCollectionSubTab('characters')}
                className={`px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold whitespace-nowrap transition-all min-w-[100px] md:min-w-[120px] text-center ${
                  collectionSubTab === 'characters'
                    ? 'bg-[#ffc2d1] text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                推しキャラ
              </button>
              <button
                onClick={() => setCollectionSubTab('quotes')}
                className={`px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold whitespace-nowrap transition-all min-w-[100px] md:min-w-[120px] text-center ${
                  collectionSubTab === 'quotes'
                    ? 'bg-[#ffc2d1] text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                名言
              </button>
              <button
                onClick={() => setCollectionSubTab('lists')}
                className={`px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold whitespace-nowrap transition-all min-w-[100px] md:min-w-[120px] text-center ${
                  collectionSubTab === 'lists'
                    ? 'bg-[#ffc2d1] text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                布教リスト
              </button>
              <button
                onClick={() => setCollectionSubTab('music')}
                className={`px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold whitespace-nowrap transition-all min-w-[100px] md:min-w-[120px] text-center ${
                  collectionSubTab === 'music'
                    ? 'bg-[#ffc2d1] text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                主題歌
              </button>
              <button
                onClick={() => setCollectionSubTab('voiceActors')}
                className={`px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold whitespace-nowrap transition-all min-w-[100px] md:min-w-[120px] text-center ${
                  collectionSubTab === 'voiceActors'
                    ? 'bg-[#ffc2d1] text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                声優
              </button>
            </div>

            {collectionSubTab === 'achievements' && (
              <AchievementsTab 
                allAnimes={allAnimes}
                achievements={achievements}
                user={user}
                supabase={supabase}
              />
            )}

            {collectionSubTab === 'characters' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold dark:text-white">推しキャラ</h2>
                  <button
                    onClick={() => {
                      setNewCharacterName('');
                      setNewCharacterAnimeId(null);
                      setNewCharacterImage('👤');
                      setNewCharacterCategory('');
                      setNewCharacterTags([]);
                      setNewCustomTag('');
                      setEditingCharacter(null);
                      setShowAddCharacterModal(true);
                    }}
                    className="text-sm bg-[#ffc2d1] text-white px-4 py-2 rounded-lg hover:bg-[#ffb07c] transition-colors"
                  >
                    + 推しを追加
                  </button>
                </div>
                
                {/* カテゴリフィルタ */}
                {favoriteCharacters.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                      onClick={() => setCharacterFilter(null)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        characterFilter === null
                          ? 'bg-[#ffc2d1] text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      すべて
                    </button>
                    {characterCategories.map((category) => {
                      const count = favoriteCharacters.filter(c => c.category === category.value).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={category.value}
                          onClick={() => setCharacterFilter(category.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                            characterFilter === category.value
                              ? 'bg-[#ffc2d1] text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {category.emoji} {category.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {(() => {
                  const filteredCharacters = characterFilter
                    ? favoriteCharacters.filter(c => c.category === characterFilter)
                    : favoriteCharacters;
                  
                  return filteredCharacters.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {filteredCharacters.map((character) => (
                        <div
                          key={character.id}
                          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md relative group"
                        >
                          {/* 編集・削除ボタン */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingCharacter(character);
                                setNewCharacterName(character.name);
                                setNewCharacterAnimeId(character.animeId);
                                setNewCharacterImage(character.image);
                                setNewCharacterCategory(character.category);
                                setNewCharacterTags([...character.tags]);
                                setNewCustomTag('');
                                setShowAddCharacterModal(true);
                              }}
                              className="bg-blue-500 text-white p-1.5 rounded-lg hover:bg-blue-600 transition-colors"
                              title="編集"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`${character.name}を削除しますか？`)) {
                                  setFavoriteCharacters(favoriteCharacters.filter(c => c.id !== character.id));
                                }
                              }}
                              className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                              title="削除"
                            >
                              🗑️
                            </button>
                          </div>
                          
                          <div className="text-4xl text-center mb-2">{character.image}</div>
                          <h3 className="font-bold text-sm dark:text-white text-center mb-1">{character.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">{character.animeName}</p>
                          <div className="flex items-center justify-center mb-2">
                            <span className="text-xs bg-[#ffc2d1]/20 dark:bg-[#ffc2d1]/20 text-[#ffc2d1] dark:text-[#ffc2d1] px-2 py-1 rounded-full">
                              {character.category}
                            </span>
                          </div>
                          {character.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {character.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {character.tags.length > 3 && (
                                <span className="text-xs text-gray-400">+{character.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      {characterFilter ? 'このカテゴリに推しキャラが登録されていません' : '推しキャラが登録されていません'}
                    </p>
                  );
                })()}
              </div>
            )}

            {collectionSubTab === 'quotes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold dark:text-white">名言コレクション</h2>
                  <button
                    onClick={() => {
                      setEditingQuote(null);
                      setNewQuoteAnimeId(null);
                      setNewQuoteText('');
                      setNewQuoteCharacter('');
                      setShowAddQuoteModal(true);
                    }}
                    className="text-sm bg-[#ffc2d1] text-white px-4 py-2 rounded-lg hover:bg-[#ffb07c] transition-colors"
                  >
                    + 名言を追加
                  </button>
                </div>
                
                {(() => {
                  const allQuotes: Array<{ text: string; character?: string; animeTitle: string; animeId: number }> = [];
                  allAnimes.forEach((anime) => {
                    anime.quotes?.forEach((quote) => {
                      allQuotes.push({ ...quote, animeTitle: anime.title, animeId: anime.id });
                    });
                  });

                  // フィルタリング
                  const filteredQuotes = allQuotes.filter(quote => {
                    // 検索クエリでフィルタ
                    if (quoteSearchQuery && !quote.text.toLowerCase().includes(quoteSearchQuery.toLowerCase()) &&
                        !quote.animeTitle.toLowerCase().includes(quoteSearchQuery.toLowerCase()) &&
                        !(quote.character && quote.character.toLowerCase().includes(quoteSearchQuery.toLowerCase()))) {
                      return false;
                    }
                    
                    // アニメ別フィルタ
                    if (quoteFilterType === 'anime' && selectedAnimeForFilter && quote.animeId !== selectedAnimeForFilter) {
                      return false;
                    }
                    
                    // キャラクター別フィルタ
                    if (quoteFilterType === 'character' && !quote.character) {
                      return false;
                    }
                    
                    return true;
                  });
                  
                  // アニメ一覧（フィルタ用）
                  const uniqueAnimes = Array.from(new Set(allQuotes.map(q => q.animeId)))
                    .map(id => allAnimes.find(a => a.id === id))
                    .filter(Boolean) as Anime[];

                  return (
                    <>
                      {/* 検索・フィルタ */}
                      {allQuotes.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {/* 検索バー */}
                          <input
                            type="text"
                            value={quoteSearchQuery}
                            onChange={(e) => setQuoteSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
                            placeholder="名言、アニメ、キャラクターで検索..."
                          />
                          
                          {/* フィルタボタン */}
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <button
                              onClick={() => {
                                setQuoteFilterType('all');
                                setSelectedAnimeForFilter(null);
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                quoteFilterType === 'all'
                                  ? 'bg-[#ffc2d1] text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              すべて
                            </button>
                            <button
                              onClick={() => {
                                setQuoteFilterType('anime');
                                setSelectedAnimeForFilter(null);
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                quoteFilterType === 'anime'
                                  ? 'bg-[#ffc2d1] text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              アニメ別
                            </button>
                            <button
                              onClick={() => {
                                setQuoteFilterType('character');
                                setSelectedAnimeForFilter(null);
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                quoteFilterType === 'character'
                                  ? 'bg-[#ffc2d1] text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              キャラクター別
                            </button>
                          </div>
                          
                          {/* アニメ選択（アニメ別フィルタ時） */}
                          {quoteFilterType === 'anime' && (
                            <select
                              value={selectedAnimeForFilter || ''}
                              onChange={(e) => setSelectedAnimeForFilter(Number(e.target.value) || null)}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">アニメを選択...</option>
                              {uniqueAnimes.map((anime) => (
                                <option key={anime.id} value={anime.id}>
                                  {anime.title}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                      
                      {filteredQuotes.length > 0 ? (
                        <div className="space-y-3">
                          {(() => {
                            // 名言とアニメID、インデックスのマッピングを作成
                            const quoteMap: Array<{ quote: typeof filteredQuotes[0]; animeId: number; quoteIndex: number }> = [];
                            filteredQuotes.forEach((quote) => {
                              const anime = allAnimes.find(a => a.id === quote.animeId);
                              if (anime && anime.quotes) {
                                const quoteIndex = anime.quotes.findIndex(q => q.text === quote.text && q.character === quote.character);
                                if (quoteIndex !== -1) {
                                  quoteMap.push({ quote, animeId: quote.animeId, quoteIndex });
                                }
                              }
                            });
                            
                            return quoteMap.map(({ quote, animeId, quoteIndex }, index) => (
                              <div
                                key={`${animeId}-${quoteIndex}`}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border-l-4 border-[#ffc2d1]-500 relative group"
                              >
                                {/* 編集・削除ボタン */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      const anime = allAnimes.find(a => a.id === animeId);
                                      if (anime && anime.quotes && anime.quotes[quoteIndex]) {
                                        setEditingQuote({ animeId, quoteIndex });
                                        setNewQuoteText(anime.quotes[quoteIndex].text);
                                        setNewQuoteCharacter(anime.quotes[quoteIndex].character || '');
                                        setShowAddQuoteModal(true);
                                      }
                                    }}
                                    className="bg-blue-500 text-white p-1.5 rounded-lg hover:bg-blue-600 transition-colors"
                                    title="編集"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm('この名言を削除しますか？')) {
                                        const anime = allAnimes.find(a => a.id === animeId);
                                        if (anime && anime.quotes) {
                                          const updatedQuotes = anime.quotes.filter((_, i) => i !== quoteIndex);
                                          const updatedSeasons = seasons.map(season => ({
                                            ...season,
                                            animes: season.animes.map(a =>
                                              a.id === animeId
                                                ? { ...a, quotes: updatedQuotes }
                                                : a
                                            ),
                                          }));
                                          
                                          // Supabaseを更新（ログイン時のみ）
                                          if (user) {
                                            try {
                                              const { error } = await supabase
                                                .from('animes')
                                                .update({ quotes: updatedQuotes })
                                                .eq('id', animeId)
                                                .eq('user_id', user.id);
                                              
                                              if (error) throw error;
                                            } catch (error) {
                                              console.error('Failed to delete quote in Supabase:', error);
                                            }
                                          }
                                          
                                          setSeasons(updatedSeasons);
                                        }
                                      }
                                    }}
                                    className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                                    title="削除"
                                  >
                                    🗑️
                                  </button>
                                </div>
                                
                                <p className="text-sm dark:text-white mb-2 pr-12">「{quote.text}」</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {quote.character ? `${quote.character} / ` : ''}{quote.animeTitle}
                                </p>
                              </div>
                            ));
                          })()}
                        </div>
                      ) : allQuotes.length > 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">検索結果がありません</p>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">名言が登録されていません</p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {collectionSubTab === 'lists' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold dark:text-white">布教リスト</h2>
                  <button
                    onClick={() => {
                      setEditingList(null);
                      setShowCreateListModal(true);
                    }}
                    className="text-sm bg-[#ffc2d1] text-white px-4 py-2 rounded-lg hover:bg-[#ffb07c] transition-colors"
                  >
                    + 新しいリストを作成
                  </button>
                </div>
                
                {/* 並び替え */}
                {evangelistLists.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                      onClick={() => setListSortType('date')}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        listSortType === 'date'
                          ? 'bg-[#ffc2d1] text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      作成日順
                    </button>
                    <button
                      onClick={() => setListSortType('title')}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        listSortType === 'title'
                          ? 'bg-[#ffc2d1] text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      タイトル順
                    </button>
                    <button
                      onClick={() => setListSortType('count')}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        listSortType === 'count'
                          ? 'bg-[#ffc2d1] text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      作品数順
                    </button>
                  </div>
                )}
                
                {evangelistLists.length > 0 ? (
                  <div className="space-y-3">
                    {(() => {
                      const sortedLists = [...evangelistLists].sort((a, b) => {
                        switch (listSortType) {
                          case 'date':
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                          case 'title':
                            return a.title.localeCompare(b.title, 'ja');
                          case 'count':
                            return b.animeIds.length - a.animeIds.length;
                          default:
                            return 0;
                        }
                      });
                      
                      return sortedLists.map((list) => (
                        <div
                          key={list.id}
                          onClick={() => setSelectedList(list)}
                          className="bg-linear-to-br from-[#ffc2d1] to-[#ffb07c] rounded-2xl p-4 shadow-md cursor-pointer hover:scale-105 transition-transform"
                        >
                          <h3 className="font-bold text-white mb-1">{list.title}</h3>
                          <p className="text-white/80 text-sm mb-2">{list.description}</p>
                          <p className="text-white/60 text-xs">{list.animeIds.length}作品</p>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">布教リストが作成されていません</p>
                )}
              </div>
            )}

            {collectionSubTab === 'music' && (
              <MusicTab 
                allAnimes={allAnimes} 
                seasons={seasons} 
                setSeasons={setSeasons}
                setSelectedAnime={setSelectedAnime}
                setSongType={setSongType}
                setNewSongTitle={setNewSongTitle}
                setNewSongArtist={setNewSongArtist}
                setShowSongModal={setShowSongModal}
                user={user}
                supabase={supabase}
              />
            )}

            {collectionSubTab === 'voiceActors' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold dark:text-white">声優リスト</h2>
                  <button
                    onClick={() => {
                      setNewVoiceActorName('');
                      setNewVoiceActorImage('🎤');
                      setNewVoiceActorAnimeIds([]);
                      setNewVoiceActorNotes('');
                      setEditingVoiceActor(null);
                      setShowAddVoiceActorModal(true);
                    }}
                    className="text-sm bg-[#ffc2d1] text-white px-4 py-2 rounded-lg hover:bg-[#ffb07c] transition-colors"
                  >
                    + 声優を追加
                  </button>
                </div>

                {/* 検索バー */}
                {voiceActors.length > 0 && (
                  <div className="mb-4">
                    <input
                      type="text"
                      value={voiceActorSearchQuery}
                      onChange={(e) => setVoiceActorSearchQuery(e.target.value)}
                      placeholder="声優名で検索..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}

                {/* 声優リスト */}
                {voiceActors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {voiceActors
                      .filter(va => 
                        voiceActorSearchQuery === '' || 
                        va.name.toLowerCase().includes(voiceActorSearchQuery.toLowerCase())
                      )
                      .map((voiceActor) => {
                        const animeList = voiceActor.animeIds
                          .map(id => allAnimes.find(a => a.id === id))
                          .filter(Boolean) as Anime[];
                        
                        return (
                          <div
                            key={voiceActor.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow relative group"
                          >
                            {/* 編集・削除ボタン（ホバー時表示） */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingVoiceActor(voiceActor);
                                  setNewVoiceActorName(voiceActor.name);
                                  setNewVoiceActorImage(voiceActor.image);
                                  setNewVoiceActorAnimeIds(voiceActor.animeIds);
                                  setNewVoiceActorNotes(voiceActor.notes || '');
                                  setShowAddVoiceActorModal(true);
                                }}
                                className="bg-[#ffc2d1] text-white p-2 rounded-lg hover:bg-[#ffb07c] transition-colors text-xs"
                                title="編集"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('この声優を削除しますか？')) {
                                    const updated = voiceActors.filter(va => va.id !== voiceActor.id);
                                    setVoiceActors(updated);
                                    if (typeof window !== 'undefined') {
                                      localStorage.setItem('voiceActors', JSON.stringify(updated));
                                    }
                                  }
                                }}
                                className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors text-xs"
                                title="削除"
                              >
                                🗑️
                              </button>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="text-4xl">{voiceActor.image}</div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg dark:text-white mb-1">{voiceActor.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  {voiceActor.animeIds.length}作品に出演
                                </p>
                                {animeList.length > 0 && (
                                  <div className="space-y-1">
                                    {animeList.slice(0, 3).map((anime) => (
                                      <div key={anime.id} className="text-xs text-gray-600 dark:text-gray-300">
                                        • {anime.title}
                                      </div>
                                    ))}
                                    {animeList.length > 3 && (
                                      <div className="text-xs text-gray-400 dark:text-gray-500">
                                        +{animeList.length - 3}作品
                                      </div>
                                    )}
                                  </div>
                                )}
                                {voiceActor.notes && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                                    {voiceActor.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">声優が登録されていません</p>
                )}
              </div>
            )}
          </>
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

      {/* アニメ追加フォームモーダル */}
      {showAddForm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setShowAddForm(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm lg:max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 my-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 dark:text-white">新しいアニメを追加</h2>
            
            {/* モード切り替えタブ */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAddModalMode('search')}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  addModalMode === 'search'
                    ? 'bg-[#ffc2d1] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                タイトル検索
              </button>
              <button
                onClick={() => setAddModalMode('season')}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  addModalMode === 'season'
                    ? 'bg-[#ffc2d1] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                クール検索
              </button>
            </div>
            
            {/* クール検索モード */}
            {addModalMode === 'season' && (
              <div className="mb-4 space-y-4">
                {/* クール選択 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      年
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
                    >
                      {Array.from({ length: new Date().getFullYear() - 1970 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}年</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      シーズン
                    </label>
                    <select
                      value={selectedSeason || ''}
                      onChange={(e) => setSelectedSeason(e.target.value as 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER' | null)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">選択してください</option>
                      <option value="SPRING">春</option>
                      <option value="SUMMER">夏</option>
                      <option value="FALL">秋</option>
                      <option value="WINTER">冬</option>
                    </select>
                  </div>
                </div>
                
                {/* 検索ボタン */}
                <button
                  onClick={async () => {
                    if (selectedSeason) {
                      setIsSeasonSearching(true);
                      setSeasonSearchPage(1);
                      setSelectedSeasonAnimeIds(new Set());
                      try {
                        const result = await searchAnimeBySeason(selectedSeason, selectedYear, 1, 50);
                        setSeasonSearchResults(result.media);
                        setHasMoreSeasonResults(result.pageInfo.hasNextPage);
                      } catch (error) {
                        console.error('Failed to search anime by season:', error);
                      } finally {
                        setIsSeasonSearching(false);
                      }
                    }
                  }}
                  disabled={!selectedSeason || isSeasonSearching}
                  className="w-full px-4 py-3 bg-[#ffc2d1] text-white rounded-xl font-bold hover:bg-[#ffb07c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSeasonSearching ? '検索中...' : 'クールを検索'}
                </button>
                
                {/* 検索結果 */}
                {seasonSearchResults.length > 0 && !isSeasonSearching && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        検索結果: {seasonSearchResults.length}件
                      </p>
                      <button
                        onClick={() => {
                          if (selectedSeasonAnimeIds.size === seasonSearchResults.length) {
                            setSelectedSeasonAnimeIds(new Set());
                          } else {
                            setSelectedSeasonAnimeIds(new Set(seasonSearchResults.map(r => r.id)));
                          }
                        }}
                        className="text-xs text-[#ffc2d1] dark:text-[#ffc2d1] hover:underline"
                      >
                        {selectedSeasonAnimeIds.size === seasonSearchResults.length ? 'すべて解除' : 'すべて選択'}
                      </button>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {seasonSearchResults.map((result) => {
                        const isSelected = selectedSeasonAnimeIds.has(result.id);
                        return (
                          <label
                            key={result.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#ffc2d1]-600 bg-[#ffc2d1]/10 dark:bg-[#ffc2d1]/10/30'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-[#ffc2d1]-300 dark:hover:border-[#ffc2d1]-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSet = new Set(selectedSeasonAnimeIds);
                                if (e.target.checked) {
                                  newSet.add(result.id);
                                } else {
                                  newSet.delete(result.id);
                                }
                                setSelectedSeasonAnimeIds(newSet);
                              }}
                              className="w-5 h-5 text-[#ffc2d1] rounded focus:ring-[#ffc2d1]"
                            />
                            <img
                              src={result.coverImage?.large || result.coverImage?.medium || '🎬'}
                              alt={result.title?.native || result.title?.romaji}
                              className="w-16 h-24 object-cover rounded shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="96"><rect fill="%23ddd" width="64" height="96"/></svg>';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm dark:text-white truncate">
                                {result.title?.native || result.title?.romaji}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {result.format || ''} {result.episodes ? `全${result.episodes}話` : ''}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    
                    {/* 一括登録ボタン */}
                    {selectedSeasonAnimeIds.size > 0 && (
                      <button
                        onClick={async () => {
                          const selectedAnimes = seasonSearchResults.filter(r => selectedSeasonAnimeIds.has(r.id));
                          const maxId = Math.max(...seasons.flatMap(s => s.animes).map(a => a.id), 0);
                          
                          // シーズン名を生成（例: "2024年秋"）
                          const seasonNameMap: { [key: string]: string } = {
                            'SPRING': '春',
                            'SUMMER': '夏',
                            'FALL': '秋',
                            'WINTER': '冬',
                          };
                          const seasonName = `${selectedYear}年${seasonNameMap[selectedSeason!]}`;
                          
                          // アニメを追加（評価は0、watchedはfalse）
                          const newAnimes: Anime[] = selectedAnimes.map((result, index) => {
                            const seriesName = extractSeriesName(result.title?.native || result.title?.romaji || '');
                            return {
                              id: maxId + index + 1,
                              title: result.title?.native || result.title?.romaji || '',
                              image: result.coverImage?.large || result.coverImage?.medium || '🎬',
                              rating: 0, // 未評価
                              watched: false,
                              rewatchCount: 0,
                              tags: result.genres?.map((g: string) => translateGenre(g)).slice(0, 3) || [],
                              seriesName,
                              studios: result.studios?.nodes?.map((s: any) => s.name) || [],
                            };
                          });
                          
                          // 既存のシーズンを探す、なければ作成してアニメを追加
                          const existingSeasonIndex = seasons.findIndex(s => s.name === seasonName);
                          let updatedSeasons: Season[];
                          
                          if (existingSeasonIndex === -1) {
                            // 新しいシーズンを作成
                            updatedSeasons = [...seasons, { name: seasonName, animes: newAnimes }];
                          } else {
                            // 既存のシーズンにアニメを追加
                            updatedSeasons = seasons.map((season, index) =>
                              index === existingSeasonIndex
                                ? { ...season, animes: [...season.animes, ...newAnimes] }
                                : season
                            );
                          }
                          
                          // 新しいシーズンが追加された場合は展開状態にする
                          const newExpandedSeasons = new Set(expandedSeasons);
                          if (!seasons.find(s => s.name === seasonName)) {
                            newExpandedSeasons.add(seasonName);
                          } else {
                            // 既存のシーズンでも展開状態を維持
                            newExpandedSeasons.add(seasonName);
                          }
                          setExpandedSeasons(newExpandedSeasons);
                          
                          // Supabaseに保存（ログイン時のみ）
                          if (user) {
                            try {
                              const supabaseData = newAnimes.map(anime => 
                                animeToSupabase(anime, seasonName, user.id)
                              );
                              
                              console.group('🔍 Supabase Insert Debug');
                              console.log('📊 送信データ:', {
                                table: 'animes',
                                dataCount: supabaseData.length,
                                userId: user.id,
                                seasonName: seasonName,
                              });
                              console.log('📝 最初のアイテム:', supabaseData[0]);
                              console.log('📝 すべてのデータ:', supabaseData);
                              
                              const { data, error } = await supabase
                                .from('animes')
                                .insert(supabaseData)
                                .select();
                              
                              if (error) {
                                console.error('❌ Supabase Error:', error);
                                console.error('📋 Error Properties:', {
                                  message: error.message,
                                  details: error.details,
                                  hint: error.hint,
                                  code: error.code,
                                });
                                console.groupEnd();
                                throw error;
                              }
                              
                              console.log('✅ Success:', data);
                              console.groupEnd();
                            } catch (error: any) {
                              console.group('❌ Error Catch Block');
                              console.error('Error Type:', typeof error);
                              console.error('Error Value:', error);
                              
                              // エラーオブジェクトのすべてのプロパティを確認
                              if (error) {
                                const errorProps: Record<string, any> = {};
                                for (const key in error) {
                                  try {
                                    errorProps[key] = error[key];
                                  } catch (e) {
                                    errorProps[key] = '[読み取り不可]';
                                  }
                                }
                                console.error('Error Properties:', errorProps);
                              }
                              
                              // エラーの文字列表現を試す
                              try {
                                console.error('Error toString:', String(error));
                              } catch (e) {
                                console.error('toString failed');
                              }
                              
                              console.groupEnd();
                              
                              const errorMessage = error?.message || error?.details || error?.hint || String(error) || '不明なエラー';
                              alert(`アニメの保存に失敗しました\n\nエラー: ${errorMessage}\n\n詳細はコンソール（F12）を確認してください。`);
                            }
                          }
                          
                          setSeasons(updatedSeasons);
                          setShowAddForm(false);
                          setSelectedSeasonAnimeIds(new Set());
                          setSeasonSearchResults([]);
                          setAddModalMode('search');
                        }}
                        className="w-full px-4 py-3 bg-[#ffc2d1] text-white rounded-xl font-bold hover:bg-[#ffb07c] transition-colors"
                      >
                        {selectedSeasonAnimeIds.size}件のアニメを登録
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* タイトル検索モード */}
            {addModalMode === 'search' && (
              <div className="space-y-4">
            {/* 検索バー */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                アニメを検索（AniList）
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleSearch();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
                  placeholder="アニメタイトルで検索"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="px-4 py-2 bg-[#ffc2d1] text-white rounded-xl font-bold hover:bg-[#ffb07c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSearching ? '検索中...' : '検索'}
                </button>
              </div>
            </div>

            {/* 検索結果 */}
            {isSearching && (
              <div className="mb-4 text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffc2d1]-600"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">検索中...</p>
              </div>
            )}

            {searchResults.length > 0 && !isSearching && (
              <div className="mb-4 max-h-80 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sticky top-0 bg-white dark:bg-gray-800 py-1">検索結果</p>
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectSearchResult(result)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        selectedSearchResult?.id === result.id
                          ? 'border-[#ffc2d1]-600 bg-[#ffc2d1]/10 dark:bg-[#ffc2d1]/10/30'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-[#ffc2d1]-300 dark:hover:border-[#ffc2d1]-600'
                      }`}
                    >
                      <img
                        src={result.coverImage?.large || result.coverImage?.medium || '🎬'}
                        alt={result.title?.native || result.title?.romaji}
                        className="w-16 h-24 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="96"><rect fill="%23ddd" width="64" height="96"/></svg>';
                        }}
                      />
                      <div className="flex-1 text-left">
                        <p className="font-bold text-sm dark:text-white">
                          {result.title?.native || result.title?.romaji}
                        </p>
                        {result.title?.native && result.title?.romaji && result.title.native !== result.title.romaji && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {result.title.romaji}
                          </p>
                        )}
                        {result.seasonYear && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {result.seasonYear}年 {result.season ? getSeasonName(result.season) : ''}
                          </p>
                        )}
                        {result.genres && result.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.genres.slice(0, 3).map((genre: string) => (
                              <span key={genre} className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                {translateGenre(genre)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 検索結果がない場合のメッセージ */}
            {searchResults.length === 0 && !isSearching && searchQuery.trim() && (
              <div className="mb-4 text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">検索結果が見つかりませんでした</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">別のキーワードで検索してください</p>
              </div>
            )}

            {/* 検索前のメッセージ */}
            {searchResults.length === 0 && !isSearching && !searchQuery.trim() && (
              <div className="mb-4 text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">アニメタイトルで検索してください</p>
              </div>
            )}

            {/* 検索結果が選択されている場合のみ追加ボタンを表示 */}
            {selectedSearchResult && (
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewAnimeTitle('');
                    setNewAnimeIcon('🎬');
                    setNewAnimeRating(0);
                    setSearchQuery('');
                    setSearchResults([]);
                    setSelectedSearchResult(null);
                  }}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button 
                  onClick={async () => {
                    if (!selectedSearchResult) {
                      alert('アニメを選択してください');
                      return;
                    }
                    
                    const maxId = Math.max(...seasons.flatMap(s => s.animes).map(a => a.id), 0);
                    
                    // 選択された検索結果から情報を取得
                    const title = selectedSearchResult.title?.native || selectedSearchResult.title?.romaji || '';
                    const image = selectedSearchResult.coverImage?.large || selectedSearchResult.coverImage?.medium || '🎬';
                    
                    // ジャンルをタグとして取得
                    const tags: string[] = [];
                    if (selectedSearchResult?.genres && selectedSearchResult.genres.length > 0) {
                      selectedSearchResult.genres.forEach((genre: string) => {
                        const translatedGenre = translateGenre(genre);
                        const matchingTag = availableTags.find(t => t.label === translatedGenre);
                        if (matchingTag) {
                          tags.push(matchingTag.value);
                        } else {
                          tags.push(translatedGenre);
                        }
                      });
                    }
                    
                    // シリーズ名を自動判定
                    const seriesName = extractSeriesName(title);
                    
                    // 制作会社を取得
                    const studios: string[] = [];
                    if (selectedSearchResult?.studios?.nodes && Array.isArray(selectedSearchResult.studios.nodes)) {
                      studios.push(...selectedSearchResult.studios.nodes.map((s: any) => s.name));
                    }
                    
                    const newAnime: Anime = {
                      id: maxId + 1,
                      title: title,
                      image: image,
                      rating: 0, // デフォルトは未評価
                      watched: false,
                      rewatchCount: 0,
                      tags: tags.length > 0 ? tags : undefined,
                      seriesName: seriesName,
                      studios: studios.length > 0 ? studios : undefined,
                    };
                    
                    // シーズン名を決定（検索結果から取得）
                    const seasonNameMap: { [key: string]: string } = {
                      'SPRING': '春',
                      'SUMMER': '夏',
                      'FALL': '秋',
                      'WINTER': '冬',
                    };
                    let seasonName = '未分類';
                    if (selectedSearchResult?.seasonYear && selectedSearchResult?.season) {
                      seasonName = `${selectedSearchResult.seasonYear}年${seasonNameMap[selectedSearchResult.season] || ''}`;
                    } else {
                      // 現在の日付からシーズンを決定
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = now.getMonth();
                      if (month >= 0 && month <= 2) {
                        seasonName = `${year}年冬`;
                      } else if (month >= 3 && month <= 5) {
                        seasonName = `${year}年春`;
                      } else if (month >= 6 && month <= 8) {
                        seasonName = `${year}年夏`;
                      } else {
                        seasonName = `${year}年秋`;
                      }
                    }
                    
                    // 既存のシーズンを探す、なければ作成
                    const existingSeasonIndex = seasons.findIndex(s => s.name === seasonName);
                    let updatedSeasons: Season[];
                    
                    if (existingSeasonIndex === -1) {
                      // 新しいシーズンを作成
                      updatedSeasons = [...seasons, { name: seasonName, animes: [newAnime] }];
                    } else {
                      // 既存のシーズンにアニメを追加
                      updatedSeasons = seasons.map((season, index) =>
                        index === existingSeasonIndex
                          ? { ...season, animes: [...season.animes, newAnime] }
                          : season
                      );
                    }
                    
                    // Supabaseに保存（ログイン時のみ）
                    if (user) {
                      try {
                        const supabaseData = animeToSupabase(newAnime, seasonName, user.id);
                        console.log('Attempting to insert to Supabase:', {
                          table: 'animes',
                          data: supabaseData,
                          userId: user.id,
                        });
                        
                        const { data, error } = await supabase
                          .from('animes')
                          .insert(supabaseData)
                          .select()
                          .single();
                        
                        if (error) {
                          console.error('Supabase insert error:', error);
                          console.error('Error object:', JSON.stringify(error, null, 2));
                          console.error('Error properties:', Object.keys(error));
                          console.error('Error message:', error.message);
                          console.error('Error details:', error.details);
                          console.error('Error hint:', error.hint);
                          console.error('Error code:', error.code);
                          throw error;
                        }
                        
                        console.log('Successfully inserted to Supabase:', data);
                        
                        // Supabaseが生成したIDを使用してアニメを更新
                        if (data) {
                          const savedAnime = supabaseToAnime(data);
                          const seasonIndex = updatedSeasons.findIndex(s => s.name === seasonName);
                          if (seasonIndex !== -1) {
                            const animeIndex = updatedSeasons[seasonIndex].animes.length - 1;
                            updatedSeasons[seasonIndex].animes[animeIndex] = savedAnime;
                          }
                        }
                      } catch (error: any) {
                        console.error('Failed to save anime to Supabase');
                        console.error('Error type:', typeof error);
                        console.error('Error constructor:', error?.constructor?.name);
                        console.error('Error as string:', String(error));
                        if (error) {
                          console.error('Error message:', error.message);
                          console.error('Error details:', error.details);
                          console.error('Error hint:', error.hint);
                          console.error('Error code:', error.code);
                        }
                        // エラーが発生してもローカル状態は更新する
                      }
                    }
                    
                    setSeasons(updatedSeasons);
                    setShowAddForm(false);
                    setNewAnimeTitle('');
                    setNewAnimeIcon('🎬');
                    setNewAnimeRating(0);
                    setSearchQuery('');
                    setSearchResults([]);
                    setSelectedSearchResult(null);
                  }}
                  className="flex-1 bg-[#ffc2d1] text-white py-3 rounded-xl font-bold hover:bg-[#ffb07c] transition-colors"
                >
                  追加
                </button>
              </div>
            )}
              </div>
            )}
          </div>
        </div>
      )}

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
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAnime(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm lg:max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* タブ切り替え */}
            <div className="flex gap-2 mb-4 border-b dark:border-gray-700 pb-2">
              <button
                onClick={() => setAnimeDetailTab('info')}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  animeDetailTab === 'info'
                    ? 'bg-[#ffc2d1] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                基本情報
              </button>
              <button
                onClick={() => setAnimeDetailTab('reviews')}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  animeDetailTab === 'reviews'
                    ? 'bg-[#ffc2d1] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                感想
              </button>
            </div>

            {/* 基本情報タブ */}
            {animeDetailTab === 'info' && (
              <>
            <div className="text-center mb-4">
              {(() => {
                const isImageUrl = selectedAnime.image && (selectedAnime.image.startsWith('http://') || selectedAnime.image.startsWith('https://'));
                return isImageUrl ? (
                  <div className="flex justify-center mb-3">
                    <img
                      src={selectedAnime.image}
                      alt={selectedAnime.title}
                      className="w-32 h-44 object-cover rounded-xl shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="text-6xl">🎬</span>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <span className="text-6xl block mb-3">{selectedAnime.image || '🎬'}</span>
                );
              })()}
              <h3 className="text-xl font-bold mt-2 dark:text-white">{selectedAnime.title}</h3>
            </div>
            
            {/* 評価ボタン */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">評価を選択</p>
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={async () => {
                      const updatedSeasons = seasons.map(season => ({
                        ...season,
                        animes: season.animes.map((anime) =>
                          anime.id === selectedAnime.id
                            ? { ...anime, rating }
                            : anime
                        ),
                      }));
                      
                      // Supabaseを更新（ログイン時のみ）
                      if (user) {
                        try {
                          const { error } = await supabase
                            .from('animes')
                            .update({ rating })
                            .eq('id', selectedAnime.id)
                            .eq('user_id', user.id);
                          
                          if (error) throw error;
                        } catch (error) {
                          console.error('Failed to update anime rating in Supabase:', error);
                        }
                      }
                      
                      setSeasons(updatedSeasons);
                      setSelectedAnime({ ...selectedAnime, rating });
                    }}
                    className={`text-3xl transition-all hover:scale-110 active:scale-95 ${
                      selectedAnime.rating >= rating
                        ? 'text-[#ffd966] drop-shadow-sm'
                        : 'text-gray-300 opacity-30 hover:opacity-50'
                    }`}
                    title={`${rating}つ星`}
                  >
                    {selectedAnime.rating >= rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
              {selectedAnime.rating > 0 ? (
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                  {ratingLabels[selectedAnime.rating]?.emoji} {ratingLabels[selectedAnime.rating]?.label}
                </p>
              ) : (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-2">
                  評価を選択してください
                </p>
              )}
            </div>

            {/* 周回数編集 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">周回数</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={async () => {
                    const currentCount = selectedAnime.rewatchCount ?? 0;
                    const newCount = Math.max(0, currentCount - 1);
                    const updatedSeasons = seasons.map(season => ({
                      ...season,
                      animes: season.animes.map((anime) =>
                        anime.id === selectedAnime.id
                          ? { ...anime, rewatchCount: newCount }
                          : anime
                      ),
                    }));
                    
                    // Supabaseを更新（ログイン時のみ）
                    if (user) {
                      try {
                        const { error } = await supabase
                          .from('animes')
                          .update({ rewatch_count: newCount })
                          .eq('id', selectedAnime.id)
                          .eq('user_id', user.id);
                        
                        if (error) throw error;
                      } catch (error) {
                        console.error('Failed to update anime rewatch count in Supabase:', error);
                      }
                    }
                    
                    setSeasons(updatedSeasons);
                    setSelectedAnime({ ...selectedAnime, rewatchCount: newCount });
                  }}
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                  disabled={(selectedAnime.rewatchCount ?? 0) <= 0}
                >
                  -
                </button>
                <span className="text-2xl font-bold dark:text-white min-w-[60px] text-center">
                  {(selectedAnime.rewatchCount ?? 0)}周
                </span>
                <button
                  onClick={async () => {
                    const currentCount = selectedAnime.rewatchCount ?? 0;
                    const newCount = Math.min(99, currentCount + 1);
                    const updatedSeasons = seasons.map(season => ({
                      ...season,
                      animes: season.animes.map((anime) =>
                        anime.id === selectedAnime.id
                          ? { ...anime, rewatchCount: newCount }
                          : anime
                      ),
                    }));
                    
                    // Supabaseを更新（ログイン時のみ）
                    if (user) {
                      try {
                        const { error } = await supabase
                          .from('animes')
                          .update({ rewatch_count: newCount })
                          .eq('id', selectedAnime.id)
                          .eq('user_id', user.id);
                        
                        if (error) throw error;
                      } catch (error) {
                        console.error('Failed to update anime rewatch count in Supabase:', error);
                      }
                    }
                    
                    setSeasons(updatedSeasons);
                    setSelectedAnime({ ...selectedAnime, rewatchCount: newCount });
                  }}
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                  disabled={(selectedAnime.rewatchCount ?? 0) >= 99}
                >
                  +
                </button>
              </div>
            </div>

            {/* タグ選択 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">タグ</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {availableTags.map((tag) => {
                  const isSelected = selectedAnime.tags?.includes(tag.value) ?? false;
                  return (
                    <button
                      key={tag.value}
                      onClick={async () => {
                        const currentTags = selectedAnime.tags ?? [];
                        const newTags = isSelected
                          ? currentTags.filter(t => t !== tag.value)
                          : [...currentTags, tag.value];
                        const updatedSeasons = seasons.map(season => ({
                          ...season,
                          animes: season.animes.map((anime) =>
                            anime.id === selectedAnime.id
                              ? { ...anime, tags: newTags }
                              : anime
                          ),
                        }));
                        
                        // Supabaseを更新（ログイン時のみ）
                        if (user) {
                          try {
                            const { error } = await supabase
                              .from('animes')
                              .update({ tags: newTags })
                              .eq('id', selectedAnime.id)
                              .eq('user_id', user.id);
                            
                            if (error) throw error;
                          } catch (error) {
                            console.error('Failed to update anime tags in Supabase:', error);
                          }
                        }
                        
                        setSeasons(updatedSeasons);
                        setSelectedAnime({ ...selectedAnime, tags: newTags });
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#ffc2d1] text-white dark:bg-indigo-500'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* シリーズ名編集 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">シリーズ名</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedAnime.seriesName || ''}
                  onChange={(e) => {
                    const newSeriesName = e.target.value.trim() || undefined;
                    setSelectedAnime({ ...selectedAnime, seriesName: newSeriesName });
                  }}
                  onBlur={async () => {
                    const newSeriesName = selectedAnime.seriesName?.trim() || undefined;
                    const updatedSeasons = seasons.map(season => ({
                      ...season,
                      animes: season.animes.map((anime) =>
                        anime.id === selectedAnime.id
                          ? { ...anime, seriesName: newSeriesName }
                          : anime
                      ),
                    }));
                    
                    // Supabaseを更新（ログイン時のみ）
                    if (user) {
                      try {
                        const { error } = await supabase
                          .from('animes')
                          .update({ series_name: newSeriesName })
                          .eq('id', selectedAnime.id)
                          .eq('user_id', user.id);
                        
                        if (error) throw error;
                      } catch (error) {
                        console.error('Failed to update anime series name in Supabase:', error);
                      }
                    }
                    
                    setSeasons(updatedSeasons);
                  }}
                  placeholder="シリーズ名を入力（任意）"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white text-sm"
                />
                {selectedAnime.seriesName && (
                  <button
                    onClick={async () => {
                      const updatedSeasons = seasons.map(season => ({
                        ...season,
                        animes: season.animes.map((anime) =>
                          anime.id === selectedAnime.id
                            ? { ...anime, seriesName: undefined }
                            : anime
                        ),
                      }));
                      
                      // Supabaseを更新（ログイン時のみ）
                      if (user) {
                        try {
                          const { error } = await supabase
                            .from('animes')
                            .update({ series_name: null })
                            .eq('id', selectedAnime.id)
                            .eq('user_id', user.id);
                          
                          if (error) throw error;
                        } catch (error) {
                          console.error('Failed to remove anime series name in Supabase:', error);
                        }
                      }
                      
                      setSeasons(updatedSeasons);
                      setSelectedAnime({ ...selectedAnime, seriesName: undefined });
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    削除
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                同じシリーズ名を持つアニメがグループ化されます
              </p>
            </div>

            {/* 主題歌 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center font-medium">主題歌</p>
              
              {/* OP */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">OP</p>
                  {!selectedAnime.songs?.op && (
                    <button
                      onClick={() => {
                        setSongType('op');
                        setNewSongTitle('');
                        setNewSongArtist('');
                        setShowSongModal(true);
                      }}
                      className="text-xs bg-[#ffc2d1] text-white px-3 py-1 rounded-lg hover:bg-[#ffb07c] transition-colors"
                    >
                      + 登録
                    </button>
                  )}
                </div>
                {selectedAnime.songs?.op ? (
                  <div className="bg-linear-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm dark:text-white">{selectedAnime.songs.op.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{selectedAnime.songs.op.artist}</p>
                      </div>
                      <button
                        onClick={async () => {
                          const updatedSeasons = seasons.map(season => ({
                            ...season,
                            animes: season.animes.map((anime) =>
                              anime.id === selectedAnime.id
                                ? {
                                    ...anime,
                                    songs: {
                                      ...anime.songs,
                                      op: anime.songs?.op
                                        ? { ...anime.songs.op, isFavorite: !anime.songs.op.isFavorite }
                                        : undefined,
                                    },
                                  }
                                : anime
                            ),
                          }));
                          
                          // Supabaseを更新（ログイン時のみ）
                          if (user && selectedAnime.songs?.op) {
                            try {
                              const updatedSongs = {
                                ...selectedAnime.songs,
                                op: { ...selectedAnime.songs.op, isFavorite: !selectedAnime.songs.op.isFavorite },
                              };
                              const { error } = await supabase
                                .from('animes')
                                .update({ songs: updatedSongs })
                                .eq('id', selectedAnime.id)
                                .eq('user_id', user.id);
                              
                              if (error) throw error;
                            } catch (error) {
                              console.error('Failed to update anime songs in Supabase:', error);
                            }
                          }
                          
                          setSeasons(updatedSeasons);
                          setSelectedAnime({
                            ...selectedAnime,
                            songs: {
                              ...selectedAnime.songs,
                              op: selectedAnime.songs?.op
                                ? { ...selectedAnime.songs.op, isFavorite: !selectedAnime.songs.op.isFavorite }
                                : undefined,
                            },
                          });
                        }}
                        className="text-xl"
                      >
                        {selectedAnime.songs.op.isFavorite ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={async () => {
                            const updatedSeasons = seasons.map(season => ({
                              ...season,
                              animes: season.animes.map((anime) =>
                                anime.id === selectedAnime.id
                                  ? {
                                      ...anime,
                                      songs: {
                                        ...anime.songs,
                                        op: anime.songs?.op
                                          ? { ...anime.songs.op, rating }
                                          : undefined,
                                      },
                                    }
                                  : anime
                              ),
                            }));
                            
                            // Supabaseを更新（ログイン時のみ）
                            if (user && selectedAnime.songs?.op) {
                              try {
                                const updatedSongs = {
                                  ...selectedAnime.songs,
                                  op: { ...selectedAnime.songs.op, rating },
                                };
                                const { error } = await supabase
                                  .from('animes')
                                  .update({ songs: updatedSongs })
                                  .eq('id', selectedAnime.id)
                                  .eq('user_id', user.id);
                                
                                if (error) throw error;
                              } catch (error) {
                                console.error('Failed to update anime songs in Supabase:', error);
                              }
                            }
                            
                            setSeasons(updatedSeasons);
                            setSelectedAnime({
                              ...selectedAnime,
                              songs: {
                                ...selectedAnime.songs,
                                op: selectedAnime.songs?.op
                                  ? { ...selectedAnime.songs.op, rating }
                                  : undefined,
                              },
                            });
                          }}
                          className={`text-sm ${
                            (selectedAnime.songs?.op?.rating ?? 0) >= rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        const updatedSeasons = seasons.map(season => ({
                          ...season,
                          animes: season.animes.map((anime) =>
                            anime.id === selectedAnime.id
                              ? {
                                  ...anime,
                                  songs: {
                                    ...anime.songs,
                                    op: undefined,
                                  },
                                }
                              : anime
                          ),
                        }));
                        
                        // Supabaseを更新（ログイン時のみ）
                        if (user) {
                          try {
                            const updatedSongs = {
                              ...selectedAnime.songs,
                              op: undefined,
                            };
                            const { error } = await supabase
                              .from('animes')
                              .update({ songs: updatedSongs })
                              .eq('id', selectedAnime.id)
                              .eq('user_id', user.id);
                            
                            if (error) throw error;
                          } catch (error) {
                            console.error('Failed to delete anime song in Supabase:', error);
                          }
                        }
                        
                        setSeasons(updatedSeasons);
                        setSelectedAnime({
                          ...selectedAnime,
                          songs: {
                            ...selectedAnime.songs,
                            op: undefined,
                          },
                        });
                      }}
                      className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500"
                    >
                      削除
                    </button>
                  </div>
                ) : null}
              </div>

              {/* ED */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">ED</p>
                  {!selectedAnime.songs?.ed && (
                    <button
                      onClick={() => {
                        setSongType('ed');
                        setNewSongTitle('');
                        setNewSongArtist('');
                        setShowSongModal(true);
                      }}
                      className="text-xs bg-[#ffc2d1] text-white px-3 py-1 rounded-lg hover:bg-[#ffb07c] transition-colors"
                    >
                      + 登録
                    </button>
                  )}
                </div>
                {selectedAnime.songs?.ed ? (
                  <div className="bg-linear-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm dark:text-white">{selectedAnime.songs.ed.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{selectedAnime.songs.ed.artist}</p>
                      </div>
                      <button
                        onClick={async () => {
                          const updatedSeasons = seasons.map(season => ({
                            ...season,
                            animes: season.animes.map((anime) =>
                              anime.id === selectedAnime.id
                                ? {
                                    ...anime,
                                    songs: {
                                      ...anime.songs,
                                      ed: anime.songs?.ed
                                        ? { ...anime.songs.ed, isFavorite: !anime.songs.ed.isFavorite }
                                        : undefined,
                                    },
                                  }
                                : anime
                            ),
                          }));
                          
                          // Supabaseを更新（ログイン時のみ）
                          if (user && selectedAnime.songs?.ed) {
                            try {
                              const updatedSongs = {
                                ...selectedAnime.songs,
                                ed: { ...selectedAnime.songs.ed, isFavorite: !selectedAnime.songs.ed.isFavorite },
                              };
                              const { error } = await supabase
                                .from('animes')
                                .update({ songs: updatedSongs })
                                .eq('id', selectedAnime.id)
                                .eq('user_id', user.id);
                              
                              if (error) throw error;
                            } catch (error) {
                              console.error('Failed to update anime songs in Supabase:', error);
                            }
                          }
                          
                          setSeasons(updatedSeasons);
                          setSelectedAnime({
                            ...selectedAnime,
                            songs: {
                              ...selectedAnime.songs,
                              ed: selectedAnime.songs?.ed
                                ? { ...selectedAnime.songs.ed, isFavorite: !selectedAnime.songs.ed.isFavorite }
                                : undefined,
                            },
                          });
                        }}
                        className="text-xl"
                      >
                        {selectedAnime.songs.ed.isFavorite ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={async () => {
                            const updatedSeasons = seasons.map(season => ({
                              ...season,
                              animes: season.animes.map((anime) =>
                                anime.id === selectedAnime.id
                                  ? {
                                      ...anime,
                                      songs: {
                                        ...anime.songs,
                                        ed: anime.songs?.ed
                                          ? { ...anime.songs.ed, rating }
                                          : undefined,
                                      },
                                    }
                                  : anime
                              ),
                            }));
                            
                            // Supabaseを更新（ログイン時のみ）
                            if (user && selectedAnime.songs?.ed) {
                              try {
                                const updatedSongs = {
                                  ...selectedAnime.songs,
                                  ed: { ...selectedAnime.songs.ed, rating },
                                };
                                const { error } = await supabase
                                  .from('animes')
                                  .update({ songs: updatedSongs })
                                  .eq('id', selectedAnime.id)
                                  .eq('user_id', user.id);
                                
                                if (error) throw error;
                              } catch (error) {
                                console.error('Failed to update anime songs in Supabase:', error);
                              }
                            }
                            
                            setSeasons(updatedSeasons);
                            setSelectedAnime({
                              ...selectedAnime,
                              songs: {
                                ...selectedAnime.songs,
                                ed: selectedAnime.songs?.ed
                                  ? { ...selectedAnime.songs.ed, rating }
                                  : undefined,
                              },
                            });
                          }}
                          className={`text-sm ${
                            (selectedAnime.songs?.ed?.rating ?? 0) >= rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        const updatedSeasons = seasons.map(season => ({
                          ...season,
                          animes: season.animes.map((anime) =>
                            anime.id === selectedAnime.id
                              ? {
                                  ...anime,
                                  songs: {
                                    ...anime.songs,
                                    ed: undefined,
                                  },
                                }
                              : anime
                          ),
                        }));
                        
                        // Supabaseを更新（ログイン時のみ）
                        if (user) {
                          try {
                            const updatedSongs = {
                              ...selectedAnime.songs,
                              ed: undefined,
                            };
                            const { error } = await supabase
                              .from('animes')
                              .update({ songs: updatedSongs })
                              .eq('id', selectedAnime.id)
                              .eq('user_id', user.id);
                            
                            if (error) throw error;
                          } catch (error) {
                            console.error('Failed to delete anime song in Supabase:', error);
                          }
                        }
                        
                        setSeasons(updatedSeasons);
                        setSelectedAnime({
                          ...selectedAnime,
                          songs: {
                            ...selectedAnime.songs,
                            ed: undefined,
                          },
                        });
                      }}
                      className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500"
                    >
                      削除
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* 名言 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">名言</p>
                <button
                  onClick={async () => {
                    const newQuoteText = prompt('セリフを入力してください:');
                    if (newQuoteText) {
                      const newQuoteCharacter = prompt('キャラクター名（任意）:') || undefined;
                      const newQuotes = [...(selectedAnime.quotes || []), { text: newQuoteText, character: newQuoteCharacter }];
                      const updatedSeasons = seasons.map(season => ({
                        ...season,
                        animes: season.animes.map((anime) =>
                          anime.id === selectedAnime.id
                            ? {
                                ...anime,
                                quotes: newQuotes,
                              }
                            : anime
                        ),
                      }));
                      
                      // Supabaseを更新（ログイン時のみ）
                      if (user) {
                        try {
                          const { error } = await supabase
                            .from('animes')
                            .update({ quotes: newQuotes })
                            .eq('id', selectedAnime.id)
                            .eq('user_id', user.id);
                          
                          if (error) throw error;
                        } catch (error) {
                          console.error('Failed to update anime quotes in Supabase:', error);
                        }
                      }
                      
                      setSeasons(updatedSeasons);
                      setSelectedAnime({
                        ...selectedAnime,
                        quotes: newQuotes,
                      });
                    }
                  }}
                  className="text-xs bg-[#ffc2d1] text-white px-3 py-1 rounded-lg hover:bg-[#ffb07c] transition-colors"
                >
                  + 名言を追加
                </button>
              </div>
              
              {selectedAnime.quotes && selectedAnime.quotes.length > 0 ? (
                <div className="space-y-2">
                  {selectedAnime.quotes.map((quote, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-[#ffc2d1]-500 relative"
                    >
                      <p className="text-sm dark:text-white mb-1">「{quote.text}」</p>
                      {quote.character && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">— {quote.character}</p>
                      )}
                      <button
                        onClick={async () => {
                          const updatedQuotes = selectedAnime.quotes?.filter((_, i) => i !== index) || [];
                          const updatedSeasons = seasons.map(season => ({
                            ...season,
                            animes: season.animes.map((anime) =>
                              anime.id === selectedAnime.id
                                ? { ...anime, quotes: updatedQuotes }
                                : anime
                            ),
                          }));
                          
                          // Supabaseを更新（ログイン時のみ）
                          if (user) {
                            try {
                              const { error } = await supabase
                                .from('animes')
                                .update({ quotes: updatedQuotes })
                                .eq('id', selectedAnime.id)
                                .eq('user_id', user.id);
                              
                              if (error) throw error;
                            } catch (error) {
                              console.error('Failed to update anime quotes in Supabase:', error);
                            }
                          }
                          
                          setSeasons(updatedSeasons);
                          setSelectedAnime({ ...selectedAnime, quotes: updatedQuotes });
                        }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">名言が登録されていません</p>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={async () => {
                  // Supabaseから削除（ログイン時のみ）
                  if (user) {
                    try {
                      // ローカルで生成されたID（非常に大きい数値）の場合は、Supabaseに保存されていない可能性がある
                      // SupabaseのIDは通常、連番の小さい数値なので、大きすぎるIDの場合はスキップ
                      const isLocalId = selectedAnime.id > 1000000;
                      
                      if (!isLocalId) {
                        const { data, error } = await supabase
                          .from('animes')
                          .delete()
                          .eq('id', selectedAnime.id)
                          .eq('user_id', user.id)
                          .select();
                        
                        if (error) {
                          console.error('Supabase delete error:', error);
                          throw error;
                        }
                        
                        console.log('Deleted anime from Supabase:', data);
                      } else {
                        console.log('Skipping Supabase delete for local ID:', selectedAnime.id);
                      }
                    } catch (error: any) {
                      console.error('Failed to delete anime from Supabase:', error);
                      console.error('Error details:', {
                        message: error?.message,
                        details: error?.details,
                        hint: error?.hint,
                        code: error?.code,
                        animeId: selectedAnime.id,
                        userId: user.id,
                      });
                      // エラーが発生してもローカル状態は更新する
                    }
                  }
                  
                  const updatedSeasons = seasons.map(season => ({
                    ...season,
                    animes: season.animes.filter((anime) => anime.id !== selectedAnime.id),
                  }));
                  setSeasons(updatedSeasons);
                  setSelectedAnime(null);
                }}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                削除
              </button>
            <button 
              onClick={() => setSelectedAnime(null)}
                className="flex-1 bg-[#ffc2d1] text-white py-3 rounded-xl font-bold hover:bg-[#ffb07c] transition-colors"
            >
              閉じる
            </button>
            </div>
              </>
            )}

            {/* 感想タブ */}
            {animeDetailTab === 'reviews' && (
              <div className="space-y-4">
                {/* フィルタとソート */}
                <div className="flex gap-2 mb-4">
                  <select
                    value={reviewFilter}
                    onChange={(e) => setReviewFilter(e.target.value as 'all' | 'overall' | 'episode')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="all">すべて</option>
                    <option value="overall">全体感想のみ</option>
                    <option value="episode">話数感想のみ</option>
                  </select>
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value as 'newest' | 'likes' | 'helpful')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="newest">新着順</option>
                    <option value="likes">いいね順</option>
                    <option value="helpful">役に立った順</option>
                  </select>
                </div>

                {/* ネタバレ非表示設定 */}
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="spoilerHidden"
                    checked={userSpoilerHidden}
                    onChange={(e) => setUserSpoilerHidden(e.target.checked)}
                    className="w-4 h-4 text-[#ffc2d1] rounded focus:ring-[#ffc2d1]"
                  />
                  <label htmlFor="spoilerHidden" className="text-sm text-gray-700 dark:text-gray-300">
                    ネタバレを含む感想を非表示
                  </label>
                </div>

                {/* 感想投稿ボタン */}
                {user && (
                  <button
                    onClick={() => {
                      setShowReviewModal(true);
                    }}
                    className="w-full bg-[#ffc2d1] text-white py-3 rounded-xl font-bold hover:bg-[#ffb07c] transition-colors mb-4"
                  >
                    + 感想を投稿
                  </button>
                )}

                {/* 感想一覧 */}
                {loadingReviews ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffc2d1]-600"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">読み込み中...</p>
                  </div>
                ) : (() => {
                  // フィルタリング
                  let filteredReviews = animeReviews.filter(review => {
                    if (reviewFilter === 'overall' && review.type !== 'overall') return false;
                    if (reviewFilter === 'episode' && review.type !== 'episode') return false;
                    if (userSpoilerHidden && review.containsSpoiler) return false;
                    return true;
                  });

                  // ソート
                  filteredReviews.sort((a, b) => {
                    switch (reviewSort) {
                      case 'likes':
                        return b.likes - a.likes;
                      case 'helpful':
                        return b.helpfulCount - a.helpfulCount;
                      case 'newest':
                      default:
                        return b.createdAt.getTime() - a.createdAt.getTime();
                    }
                  });

                  // 話数感想をエピソード別にグループ化
                  const episodeReviews = filteredReviews.filter(r => r.type === 'episode');
                  const overallReviews = filteredReviews.filter(r => r.type === 'overall');
                  
                  const episodeGroups = new Map<number, Review[]>();
                  episodeReviews.forEach(review => {
                    if (review.episodeNumber) {
                      if (!episodeGroups.has(review.episodeNumber)) {
                        episodeGroups.set(review.episodeNumber, []);
                      }
                      episodeGroups.get(review.episodeNumber)!.push(review);
                    }
                  });


                  return filteredReviews.length > 0 ? (
                    <div className="space-y-4">
                      {/* 全体感想 */}
                      {overallReviews.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">全体感想</h4>
                          <div className="space-y-3">
                            {overallReviews.map((review) => {
                              const isExpanded = expandedSpoilerReviews.has(review.id);
                              const shouldCollapse = review.containsSpoiler && !isExpanded;
                              
                              return (
                                <div
                                  key={review.id}
                                  className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 ${
                                    review.containsSpoiler ? 'border-l-4 border-yellow-500' : ''
                                  }`}
                                >
                                  {/* ネタバレ警告 */}
                                  {review.containsSpoiler && (
                                    <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs px-3 py-2 rounded mb-2 flex items-center gap-2">
                                      <span>⚠️</span>
                                      <span>ネタバレを含む感想です</span>
                                    </div>
                                  )}

                                  {/* ユーザー情報 */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">{review.userIcon}</span>
                                    <span className="font-bold text-sm dark:text-white">{review.userName}</span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                                      {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                                    </span>
                                  </div>

                                  {/* 感想本文（折りたたみ可能） */}
                                  {shouldCollapse ? (
                                    <button
                                      onClick={() => {
                                        const newSet = new Set(expandedSpoilerReviews);
                                        newSet.add(review.id);
                                        setExpandedSpoilerReviews(newSet);
                                      }}
                                      className="w-full text-left text-sm text-[#ffc2d1] dark:text-[#ffc2d1] hover:underline py-2"
                                    >
                                      ▶ クリックして展開
                                    </button>
                                  ) : (
                                    <>
                                      <p className="text-sm dark:text-white mb-3 whitespace-pre-wrap">{review.content}</p>
                                      {review.containsSpoiler && (
                                        <button
                                          onClick={() => {
                                            const newSet = new Set(expandedSpoilerReviews);
                                            newSet.delete(review.id);
                                            setExpandedSpoilerReviews(newSet);
                                          }}
                                          className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                                        >
                                          ▲ 折りたたむ
                                        </button>
                                      )}
                                    </>
                                  )}

                                  {/* いいね・役に立った */}
                                  <div className="flex items-center gap-4 mt-3">
                                    <button
                                      onClick={async () => {
                                        if (!user) return;
                                        
                                        try {
                                          const { data: animeData } = await supabase
                                            .from('animes')
                                            .select('id')
                                            .eq('id', selectedAnime.id)
                                            .eq('user_id', user.id)
                                            .single();
                                          
                                          if (!animeData) return;
                                          
                                          if (review.userLiked) {
                                            await supabase
                                              .from('review_likes')
                                              .delete()
                                              .eq('review_id', review.id)
                                              .eq('user_id', user.id);
                                          } else {
                                            await supabase
                                              .from('review_likes')
                                              .insert({
                                                review_id: review.id,
                                                user_id: user.id,
                                              });
                                          }
                                          
                                          loadReviews(selectedAnime.id);
                                        } catch (error) {
                                          console.error('Failed to toggle like:', error);
                                        }
                                      }}
                                      className={`flex items-center gap-1 text-sm ${
                                        review.userLiked
                                          ? 'text-red-500'
                                          : 'text-gray-500 dark:text-gray-400'
                                      }`}
                                    >
                                      <span>{review.userLiked ? '❤️' : '🤍'}</span>
                                      <span>{review.likes}</span>
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!user) return;
                                        
                                        try {
                                          const { data: animeData } = await supabase
                                            .from('animes')
                                            .select('id')
                                            .eq('id', selectedAnime.id)
                                            .eq('user_id', user.id)
                                            .single();
                                          
                                          if (!animeData) return;
                                          
                                          if (review.userHelpful) {
                                            await supabase
                                              .from('review_helpful')
                                              .delete()
                                              .eq('review_id', review.id)
                                              .eq('user_id', user.id);
                                          } else {
                                            await supabase
                                              .from('review_helpful')
                                              .insert({
                                                review_id: review.id,
                                                user_id: user.id,
                                              });
                                          }
                                          
                                          loadReviews(selectedAnime.id);
                                        } catch (error) {
                                          console.error('Failed to toggle helpful:', error);
                                        }
                                      }}
                                      className={`flex items-center gap-1 text-sm ${
                                        review.userHelpful
                                          ? 'text-blue-500'
                                          : 'text-gray-500 dark:text-gray-400'
                                      }`}
                                    >
                                      <span>👍</span>
                                      <span>{review.helpfulCount}</span>
                                    </button>

                                    {/* 自分の感想の場合、編集・削除ボタン */}
                                    {user && review.userId === user.id && (
                                      <div className="ml-auto flex gap-2">
                                        <button
                                          onClick={() => {
                                            setShowReviewModal(true);
                                          }}
                                          className="text-xs text-[#ffc2d1] dark:text-[#ffc2d1] hover:underline"
                                        >
                                          編集
                                        </button>
                                        <button
                                          onClick={async () => {
                                            if (!confirm('この感想を削除しますか？')) return;
                                            
                                            try {
                                              await supabase
                                                .from('reviews')
                                                .delete()
                                                .eq('id', review.id);
                                              
                                              loadReviews(selectedAnime.id);
                                            } catch (error) {
                                              console.error('Failed to delete review:', error);
                                            }
                                          }}
                                          className="text-xs text-red-500 hover:underline"
                                        >
                                          削除
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 話数感想（エピソード別にグループ化） */}
                      {episodeGroups.size > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">話数感想</h4>
                          {Array.from(episodeGroups.entries())
                            .sort((a, b) => a[0] - b[0])
                            .map(([episodeNumber, reviews]) => (
                              <div key={episodeNumber} className="mb-4">
                                <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                  第{episodeNumber}話の感想 ({reviews.length}件)
                                </h5>
                                <div className="space-y-3">
                                  {reviews.map((review) => {
                                    const isExpanded = expandedSpoilerReviews.has(review.id);
                                    const shouldCollapse = review.containsSpoiler && !isExpanded;
                                    
                                    return (
                                      <div
                                        key={review.id}
                                        className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 ${
                                          review.containsSpoiler ? 'border-l-4 border-yellow-500' : ''
                                        }`}
                                      >
                                        {/* ネタバレ警告 */}
                                        {review.containsSpoiler && (
                                          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs px-3 py-2 rounded mb-2 flex items-center gap-2">
                                            <span>⚠️</span>
                                            <span>ネタバレを含む感想です</span>
                                          </div>
                                        )}

                                        {/* ユーザー情報 */}
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xl">{review.userIcon}</span>
                                          <span className="font-bold text-sm dark:text-white">{review.userName}</span>
                                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                                            {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                                          </span>
                                        </div>

                                        {/* 感想本文（折りたたみ可能） */}
                                        {shouldCollapse ? (
                                          <button
                                            onClick={() => {
                                              const newSet = new Set(expandedSpoilerReviews);
                                              newSet.add(review.id);
                                              setExpandedSpoilerReviews(newSet);
                                            }}
                                            className="w-full text-left text-sm text-[#ffc2d1] dark:text-[#ffc2d1] hover:underline py-2"
                                          >
                                            ▶ クリックして展開
                                          </button>
                                        ) : (
                                          <>
                                            <p className="text-sm dark:text-white mb-3 whitespace-pre-wrap">{review.content}</p>
                                            {review.containsSpoiler && (
                                              <button
                                                onClick={() => {
                                                  const newSet = new Set(expandedSpoilerReviews);
                                                  newSet.delete(review.id);
                                                  setExpandedSpoilerReviews(newSet);
                                                }}
                                                className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                                              >
                                                ▲ 折りたたむ
                                              </button>
                                            )}
                                          </>
                                        )}

                                        {/* いいね・役に立った */}
                                        <div className="flex items-center gap-4 mt-3">
                                          <button
                                            onClick={async () => {
                                              if (!user) return;
                                              
                                              try {
                                                const { data: animeData } = await supabase
                                                  .from('animes')
                                                  .select('id')
                                                  .eq('id', selectedAnime.id)
                                                  .eq('user_id', user.id)
                                                  .single();
                                                
                                                if (!animeData) return;
                                                
                                                if (review.userLiked) {
                                                  await supabase
                                                    .from('review_likes')
                                                    .delete()
                                                    .eq('review_id', review.id)
                                                    .eq('user_id', user.id);
                                                } else {
                                                  await supabase
                                                    .from('review_likes')
                                                    .insert({
                                                      review_id: review.id,
                                                      user_id: user.id,
                                                    });
                                                }
                                                
                                                loadReviews(selectedAnime.id);
                                              } catch (error) {
                                                console.error('Failed to toggle like:', error);
                                              }
                                            }}
                                            className={`flex items-center gap-1 text-sm ${
                                              review.userLiked
                                                ? 'text-red-500'
                                                : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                          >
                                            <span>{review.userLiked ? '❤️' : '🤍'}</span>
                                            <span>{review.likes}</span>
                                          </button>
                                          <button
                                            onClick={async () => {
                                              if (!user) return;
                                              
                                              try {
                                                const { data: animeData } = await supabase
                                                  .from('animes')
                                                  .select('id')
                                                  .eq('id', selectedAnime.id)
                                                  .eq('user_id', user.id)
                                                  .single();
                                                
                                                if (!animeData) return;
                                                
                                                if (review.userHelpful) {
                                                  await supabase
                                                    .from('review_helpful')
                                                    .delete()
                                                    .eq('review_id', review.id)
                                                    .eq('user_id', user.id);
                                                } else {
                                                  await supabase
                                                    .from('review_helpful')
                                                    .insert({
                                                      review_id: review.id,
                                                      user_id: user.id,
                                                    });
                                                }
                                                
                                                loadReviews(selectedAnime.id);
                                              } catch (error) {
                                                console.error('Failed to toggle helpful:', error);
                                              }
                                            }}
                                            className={`flex items-center gap-1 text-sm ${
                                              review.userHelpful
                                                ? 'text-blue-500'
                                                : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                          >
                                            <span>👍</span>
                                            <span>{review.helpfulCount}</span>
                                          </button>

                                          {/* 自分の感想の場合、編集・削除ボタン */}
                                          {user && review.userId === user.id && (
                                            <div className="ml-auto flex gap-2">
                                              <button
                                                onClick={() => {
                                                  setShowReviewModal(true);
                                                }}
                                                className="text-xs text-[#ffc2d1] dark:text-[#ffc2d1] hover:underline"
                                              >
                                                編集
                                              </button>
                                              <button
                                                onClick={async () => {
                                                  if (!confirm('この感想を削除しますか？')) return;
                                                  
                                                  try {
                                                    await supabase
                                                      .from('reviews')
                                                      .delete()
                                                      .eq('id', review.id);
                                                    
                                                    loadReviews(selectedAnime.id);
                                                  } catch (error) {
                                                    console.error('Failed to delete review:', error);
                                                  }
                                                }}
                                                className="text-xs text-red-500 hover:underline"
                                              >
                                                削除
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      {user ? 'まだ感想がありません。最初の感想を投稿してみましょう！' : 'ログインすると感想を投稿・閲覧できます'}
                    </p>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
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

      {/* ボトムナビゲーション（スマホ・タブレット） */}
      <nav className="block lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-10">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex justify-around items-center">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all ${
                activeTab === 'home'
                  ? 'text-[#ffc2d1] dark:text-[#ffc2d1]'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className={`text-2xl transition-transform ${activeTab === 'home' ? 'scale-110' : 'scale-100'}`}>
                📺
              </span>
              <span className="text-xs font-medium mt-1">ホーム</span>
            </button>
            
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all ${
                activeTab === 'discover'
                  ? 'text-[#ffc2d1] dark:text-[#ffc2d1]'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className={`text-2xl transition-transform ${activeTab === 'discover' ? 'scale-110' : 'scale-100'}`}>
                📊
              </span>
              <span className="text-xs font-medium mt-1">統計</span>
            </button>
            
            <button
              onClick={() => setActiveTab('collection')}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all ${
                activeTab === 'collection'
                  ? 'text-[#ffc2d1] dark:text-[#ffc2d1]'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className={`text-2xl transition-transform ${activeTab === 'collection' ? 'scale-110' : 'scale-100'}`}>
                🏆
              </span>
              <span className="text-xs font-medium mt-1">コレクション</span>
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'text-[#ffc2d1] dark:text-[#ffc2d1]'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className={`text-2xl transition-transform ${activeTab === 'profile' ? 'scale-110' : 'scale-100'}`}>
                👤
              </span>
              <span className="text-xs font-medium mt-1">マイページ</span>
            </button>
          </div>
        </div>
      </nav>

      {/* サイドバーナビゲーション（PC） */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[200px] bg-white dark:bg-gray-800 border-r dark:border-gray-700 z-10 flex-col pt-20">
        <div className="flex flex-col gap-2 px-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all ${
              activeTab === 'home'
                ? 'bg-[#ffc2d1]/20 dark:bg-[#ffc2d1]/20 text-[#ffc2d1] dark:text-[#ffc2d1]'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-2xl">📺</span>
            <span className="font-medium">ホーム</span>
          </button>
          
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all ${
              activeTab === 'discover'
                ? 'bg-[#ffc2d1]/20 dark:bg-[#ffc2d1]/20 text-[#ffc2d1] dark:text-[#ffc2d1]'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-2xl">📊</span>
            <span className="font-medium">統計</span>
          </button>
          
          <button
            onClick={() => setActiveTab('collection')}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all ${
              activeTab === 'collection'
                ? 'bg-[#ffc2d1]/20 dark:bg-[#ffc2d1]/20 text-[#ffc2d1] dark:text-[#ffc2d1]'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-2xl">🏆</span>
            <span className="font-medium">コレクション</span>
          </button>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-[#ffc2d1]/20 dark:bg-[#ffc2d1]/20 text-[#ffc2d1] dark:text-[#ffc2d1]'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-2xl">👤</span>
            <span className="font-medium">マイページ</span>
          </button>
        </div>
      </nav>
    </div>
  );
}