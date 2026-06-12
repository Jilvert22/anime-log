'use client';
import { Star } from 'lucide-react';

import { useState, useCallback, useEffect, memo, useMemo } from 'react';
import Image from 'next/image';
import type { Anime, Season, User, AniListSearchResult } from '../../types';
import { searchAnime, searchAnimeBySeason, getAnimeDetail, type AniListMedia } from '../../lib/anilist';
import { useStorage } from '../../hooks/useStorage';
import { useAnimeSearchWithStreaming } from '../../hooks/useAnimeSearchWithStreaming';
import type { WatchlistItem } from '../../lib/storage/types';
import { supabase } from '../../lib/supabase';
import { animeToSupabase, sortSeasonsByTime, extractSeriesName, getSeasonName } from '../../utils/helpers';
import type { AniListMediaWithStreaming } from '../../lib/api/annict';
import { WatchlistDetailSheet } from '../modals/WatchlistDetailSheet';
import { StreamingBadges } from '../common/StreamingBadges';

// 積みアニメカード
const WatchlistCard = memo(function WatchlistCard({ 
  item, 
  onRemove,
  onMarkAsWatched,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onCardClick,
}: { 
  item: WatchlistItem; 
  onRemove: (anilistId: number) => void;
  onMarkAsWatched: (item: WatchlistItem) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onCardClick?: (item: WatchlistItem) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const isImageUrl = item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'));

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      return;
    }
    
    // カードをタップしたら詳細画面を開く
    if (onCardClick) {
      onCardClick(item);
    }
  };

  const handleToggleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(item.id);
    }
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden group relative cursor-pointer ${isSelected ? 'ring-2 ring-[#e879d4]' : ''}`}
      onClick={handleCardClick}
    >
      {/* 選択モード時のチェックボックス */}
      {isSelectionMode && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={handleToggleSelect}
            className="w-5 h-5 rounded border-gray-300 accent-[#e879d4] focus:ring-[#e879d4] cursor-pointer"
          />
        </div>
      )}
      
      <div className="aspect-[3/4] bg-gradient-to-br from-[#e879d4] to-[#764ba2] relative">
        {isImageUrl && !imageError && item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 33vw, 20vw"
            loading="lazy"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🎬
          </div>
        )}
        
        {/* ホバー時の「詳細を表示」テキスト（デスクトップ用、選択モード時は非表示） */}
        {!isSelectionMode && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none md:pointer-events-none">
            <span className="text-white text-sm font-medium">詳細を表示</span>
          </div>
        )}
      </div>
      
      <div className="p-2">
        <p className="text-sm font-medium text-gray-800 dark:text-white line-clamp-2">{item.title}</p>
        {/* 放送情報表示 */}
        {(item.broadcast_day !== null && item.broadcast_day !== undefined && item.broadcast_time) ? (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {(() => {
              const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
              return `${dayNames[item.broadcast_day]} ${item.broadcast_time}`;
            })()}
          </p>
        ) : null}
        {item.memo && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{item.memo}</p>
        )}
      </div>
    </div>
  );
});

export function WatchlistTab({
  setSelectedAnime,
  onOpenAddForm,
  user,
  seasons,
  setSeasons,
  expandedSeasons,
  setExpandedSeasons,
}: {
  setSelectedAnime: (anime: Anime | null) => void;
  onOpenAddForm: () => void;
  user: User | null;
  seasons: Season[];
  setSeasons: (seasons: Season[]) => void;
  expandedSeasons: Set<string>;
  setExpandedSeasons: (seasons: Set<string>) => void;
}) {
  const storage = useStorage();
  const { searchBySeason, searchByTitle, isLoading: isStreamingSearchLoading } = useAnimeSearchWithStreaming();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AniListMediaWithStreaming[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchMode, setSearchMode] = useState<'name' | 'season'>('name');
  const [seasonYear, setSeasonYear] = useState<number>(new Date().getFullYear());
  const [season, setSeason] = useState<'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'>('SPRING');
  
  // 並び替え設定
  const [sortOrder, setSortOrder] = useState<'created_desc' | 'created_asc' | 'title' | 'broadcast'>('created_desc');
  
  // 選択モード関連の状態
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 詳細表示関連の状態
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [selectedAnimeMedia, setSelectedAnimeMedia] = useState<AniListMedia | null>(null);
  
  // 視聴済み確認モーダルの状態
  const [showWatchedModal, setShowWatchedModal] = useState(false);
  const [selectedWatchlistItem, setSelectedWatchlistItem] = useState<WatchlistItem | null>(null);
  const [watchedRating, setWatchedRating] = useState<number>(0);
  const [watchedSeasonYear, setWatchedSeasonYear] = useState<number>(new Date().getFullYear());
  const [watchedSeason, setWatchedSeason] = useState<'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'>('SPRING');

  // 積みアニメを読み込む
  const loadWatchlist = useCallback(async () => {
    try {
      const items = await storage.getWatchlist();
      setWatchlist(items);
    } catch (error) {
      console.error('積みアニメの読み込みに失敗しました:', error);
    }
  }, [storage]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // AniList APIで名前検索（配信情報付き）
  const handleSearchAnime = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchByTitle(searchQuery.trim());
      setSearchResults(results || []);
    } catch (error) {
      console.error('アニメ検索に失敗しました:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchByTitle]);

  // AniList APIでシーズン検索（配信情報付き）
  const handleSearchBySeason = useCallback(async () => {
    setIsSearching(true);
    try {
      const results = await searchBySeason(season, seasonYear, 1, 20);
      setSearchResults(results || []);
    } catch (error) {
      console.error('シーズン検索に失敗しました:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [season, seasonYear, searchBySeason]);

  // 追加済みかどうかを判定（積みアニメ）
  const isAnimeAdded = useCallback((anilistId: number) => {
    return watchlist.some(item => item.anilist_id === anilistId);
  }, [watchlist]);

  // 視聴済みかどうかを判定（クール別に追加済み）
  const isAnimeWatched = useCallback((anilistId: number) => {
    return seasons.some(season => 
      season.animes.some(anime => anime.id === anilistId)
    );
  }, [seasons]);

  // 積みアニメに追加（重複チェックあり、配信情報付き）
  const handleAddToWatchlist = useCallback(async (anime: AniListMediaWithStreaming) => {
    // 既に登録済みかチェック
    const isAlreadyAdded = isAnimeAdded(anime.id);
    const isAlreadyWatched = isAnimeWatched(anime.id);
    
    if (isAlreadyWatched) {
      alert('このアニメは既に視聴済み（クール別に追加済み）です');
      return;
    }
    
    if (isAlreadyAdded) {
      alert('このアニメは既に積みアニメに追加されています');
      return;
    }
    
    const success = await storage.addToWatchlist({
      anilist_id: anime.id,
      title: anime.title?.native || anime.title?.romaji || '',
      image: anime.coverImage?.large || null,
      streaming_sites: anime.streamingServices || null,
    });
    
    if (success) {
      await loadWatchlist();
      // 検索フォームは開いたままにする（追加後も続けて検索できるように）
    } else {
      alert('積みアニメの追加に失敗しました');
    }
  }, [storage, loadWatchlist, isAnimeAdded, isAnimeWatched]);

  // 積みアニメから削除
  const handleRemoveFromWatchlist = useCallback(async (anilistId: number) => {
    const success = await storage.removeFromWatchlist(anilistId);
    if (success) {
      await loadWatchlist();
    } else {
      alert('削除に失敗しました');
    }
  }, [storage, loadWatchlist]);

  // 視聴済み確認モーダルを開く
  const openWatchedModal = useCallback((item: WatchlistItem) => {
    setSelectedWatchlistItem(item);
    setWatchedRating(0);
    setWatchedSeasonYear(new Date().getFullYear());
    setWatchedSeason('SPRING');
    setShowWatchedModal(true);
  }, []);

  // 視聴済みにする（アニメをクール別に追加）
  const handleMarkAsWatched = useCallback(async () => {
    if (!selectedWatchlistItem || !user) return;

    try {
      // AniListからアニメ情報を取得
      const { searchAnime } = await import('../../lib/anilist');
      const results = await searchAnime(selectedWatchlistItem.title);
      const animeData = results?.find((a: AniListSearchResult) => a.id === selectedWatchlistItem.anilist_id);
      
      if (!animeData) {
        alert('アニメ情報の取得に失敗しました');
        return;
      }

      // シーズン名を生成
      const seasonQuarter = watchedSeason === 'WINTER' ? 1 : 
        watchedSeason === 'SPRING' ? 2 : 
        watchedSeason === 'SUMMER' ? 3 : 4;
      const seasonName = getSeasonName(watchedSeasonYear, seasonQuarter);

      // アニメオブジェクトを作成
      const newAnime: Anime = {
        id: animeData.id,
        title: animeData.title.native || animeData.title.romaji || selectedWatchlistItem.title,
        image: animeData.coverImage?.large || selectedWatchlistItem.image || '',
        rating: watchedRating > 0 ? watchedRating : 0,
        watched: true,
        rewatchCount: 0,
        tags: [],
        seriesName: extractSeriesName(animeData.title.native || animeData.title.romaji || selectedWatchlistItem.title),
        studios: animeData.studios?.nodes?.map((s) => s.name) || [],
      };

      // シーズンに追加
      const existingSeasonIndex = seasons.findIndex(s => s.name === seasonName);
      let updatedSeasons: Season[];

      if (existingSeasonIndex === -1) {
        // 新しいシーズンを作成
        updatedSeasons = [...seasons, { name: seasonName, animes: [newAnime] }];
      } else {
        // 既存のシーズンに追加
        updatedSeasons = seasons.map((season, index) =>
          index === existingSeasonIndex
            ? { ...season, animes: [...season.animes, newAnime] }
            : season
        );
      }

      // 時系列順にソート
      updatedSeasons = sortSeasonsByTime(updatedSeasons);

      // 新しいシーズンが追加された場合は展開状態にする
      const newExpandedSeasons = new Set(expandedSeasons);
      if (!seasons.find(s => s.name === seasonName)) {
        newExpandedSeasons.add(seasonName);
      } else {
        newExpandedSeasons.add(seasonName);
      }
      setExpandedSeasons(newExpandedSeasons);

      // Supabaseに保存
      try {
        const supabaseData = animeToSupabase(newAnime, seasonName, user.id);
        
        const { error } = await supabase
          .from('animes')
          .insert(supabaseData)
          .select();
        
        if (error) throw error;
      } catch (error: unknown) {
        console.error('アニメの保存に失敗しました:', error);
        const errorMessage = error instanceof Error ? error.message : 'アニメの保存に失敗しました';
        alert(`アニメの保存に失敗しました${errorMessage !== 'アニメの保存に失敗しました' ? `: ${errorMessage}` : ''}`);
        return;
      }

      // シーズンを更新
      setSeasons(updatedSeasons);

      // 積みアニメから削除
      await handleRemoveFromWatchlist(selectedWatchlistItem.anilist_id);

      // モーダルを閉じる
      setShowWatchedModal(false);
      setSelectedWatchlistItem(null);
    } catch (error: unknown) {
      console.error('視聴済みマークに失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
      alert(`エラーが発生しました${errorMessage !== 'エラーが発生しました' ? `: ${errorMessage}` : ''}`);
    }
  }, [selectedWatchlistItem, user, watchedRating, watchedSeasonYear, watchedSeason, seasons, setSeasons, expandedSeasons, setExpandedSeasons, handleRemoveFromWatchlist]);

  // 削除ハンドラーをuseCallbackでメモ化（anilistIdを受け取る）
  const handleRemove = useCallback((anilistId: number) => {
    handleRemoveFromWatchlist(anilistId);
  }, [handleRemoveFromWatchlist]);

  // 視聴済みマークハンドラーをuseCallbackでメモ化（itemを受け取る）
  const handleMarkAsWatchedClick = useCallback((item: WatchlistItem) => {
    openWatchedModal(item);
  }, [openWatchedModal]);

  // フィルタリングと並び替え
  const filteredWatchlist = useMemo(() => {
    let filtered = [...watchlist];

    // 並び替え
    filtered = filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'created_desc': {
          // 追加日（新しい順）
          const aDate = new Date(a.created_at).getTime();
          const bDate = new Date(b.created_at).getTime();
          return bDate - aDate;
        }
        
        case 'created_asc': {
          // 追加日（古い順）
          const aDate = new Date(a.created_at).getTime();
          const bDate = new Date(b.created_at).getTime();
          return aDate - bDate;
        }
        
        case 'title': {
          // タイトル順（あいうえお順/ABC順）
          const aTitle = a.title || '';
          const bTitle = b.title || '';
          return aTitle.localeCompare(bTitle, 'ja');
        }
        
        case 'broadcast': {
          // 放送曜日順：broadcast_day昇順 → broadcast_time昇順 → 放送情報なしは最後
          const aHasBroadcast = a.broadcast_day !== null && a.broadcast_day !== undefined && a.broadcast_time;
          const bHasBroadcast = b.broadcast_day !== null && b.broadcast_day !== undefined && b.broadcast_time;
          
          if (!aHasBroadcast && !bHasBroadcast) return 0;
          if (!aHasBroadcast) return 1; // aが放送情報なし → 後ろ
          if (!bHasBroadcast) return -1; // bが放送情報なし → 後ろ
          
          // 曜日で比較
          if (a.broadcast_day! !== b.broadcast_day!) {
            return a.broadcast_day! - b.broadcast_day!;
          }
          
          // 同じ曜日の場合は時間で比較
          if (a.broadcast_time && b.broadcast_time) {
            const aTime = a.broadcast_time.split(':').map(Number);
            const bTime = b.broadcast_time.split(':').map(Number);
            const aMinutes = aTime[0] * 60 + aTime[1];
            const bMinutes = bTime[0] * 60 + bTime[1];
            return aMinutes - bMinutes;
          }
          
          return 0;
        }
        
        default:
          return 0;
      }
    });

    return filtered;
  }, [watchlist, sortOrder]);

  // 選択モードの切り替え
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedIds(new Set());
    }
  }, [isSelectionMode]);

  // 個別選択の切り替え
  const toggleSelectItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // すべて選択
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredWatchlist.map(item => item.id)));
  }, [filteredWatchlist]);

  // 選択解除
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // 一括削除
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`${selectedIds.size}件のアニメを削除しますか？`)) {
      return;
    }

    const ids = Array.from(selectedIds);
    const success = await storage.deleteWatchlistItems(ids);
    
    if (success) {
      await loadWatchlist();
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      alert('削除に失敗しました');
    }
  }, [storage, selectedIds, loadWatchlist]);

  // 一括視聴済みにする
  const handleBulkMarkAsWatched = useCallback(async () => {
    if (selectedIds.size === 0 || !user) return;

    if (!confirm(`${selectedIds.size}件のアニメを視聴済みにしますか？\n\n評価とクールは後で個別に設定できます。`)) {
      return;
    }

    const ids = Array.from(selectedIds);
    const selectedItems = watchlist.filter(item => ids.includes(item.id));
    
    try {
      for (const item of selectedItems) {
        // AniListからアニメ情報を取得
        const { searchAnime } = await import('../../lib/anilist');
        const results = await searchAnime(item.title);
        const animeData = results?.find((a: AniListSearchResult) => a.id === item.anilist_id);
        
        if (!animeData) continue;

        // シーズン名を生成（現在のシーズンを使用）
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;
        const seasonName = getSeasonName(currentYear, currentQuarter);

        // アニメオブジェクトを作成
        const newAnime: Anime = {
          id: animeData.id,
          title: animeData.title.native || animeData.title.romaji || item.title,
          image: animeData.coverImage?.large || item.image || '',
          rating: 0,
          watched: true,
          rewatchCount: 0,
          tags: [],
          seriesName: extractSeriesName(animeData.title.native || animeData.title.romaji || item.title),
          studios: animeData.studios?.nodes?.map((s) => s.name) || [],
        };

        // シーズンに追加
        const existingSeasonIndex = seasons.findIndex(s => s.name === seasonName);
        let updatedSeasons: Season[];

        if (existingSeasonIndex === -1) {
          updatedSeasons = [...seasons, { name: seasonName, animes: [newAnime] }];
        } else {
          updatedSeasons = seasons.map((season, index) =>
            index === existingSeasonIndex
              ? { ...season, animes: [...season.animes, newAnime] }
              : season
          );
        }

        // Supabaseに保存
        try {
          const supabaseData = animeToSupabase(newAnime, seasonName, user.id);
          await supabase.from('animes').insert(supabaseData).select();
        } catch (error) {
          console.error('アニメの保存に失敗しました:', error);
        }

        // 積みアニメから削除
        await storage.removeFromWatchlist(item.anilist_id);
      }

      // シーズンを更新
      const updatedSeasons = sortSeasonsByTime(seasons);
      setSeasons(updatedSeasons);
      
      // リストを更新
      await loadWatchlist();
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('一括視聴済みマークに失敗しました:', error);
      alert('一部のアニメの処理に失敗しました');
    }
  }, [storage, selectedIds, watchlist, user, seasons, setSeasons, loadWatchlist]);

  // カードクリックで詳細を開く
  const handleCardClick = useCallback(async (item: WatchlistItem) => {
    setSelectedItem(item);
    try {
      const detail = await getAnimeDetail(item.anilist_id);
      if (detail) {
        setSelectedAnimeMedia(detail);
      }
    } catch (error) {
      console.error('アニメ詳細の取得に失敗しました:', error);
    }
  }, []);

  return (
    <>
      {/* 説明 */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-xl p-4 mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white mb-1">積みアニメ</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          これから見たい作品をストックしておく場所です。見終わったら「視聴済みにする」でクール別に移動できます。
        </p>
      </div>

      {/* 追加ボタン */}
      {!showAddForm ? (
        <button 
          onClick={() => setShowAddForm(true)}
          data-onboarding="step-2"
          className="w-full mb-4 py-4 border-2 border-dashed border-[#e879d4] rounded-xl text-[#e879d4] font-bold hover:border-[#d45dbf] hover:text-[#d45dbf] hover:bg-[#e879d4]/5 transition-colors"
        >
          + 積みアニメを追加
        </button>
      ) : (
        /* 検索フォーム */
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          {/* 検索モード切り替え */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => { setSearchMode('name'); setSearchResults([]); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchMode === 'name'
                  ? 'bg-[#e879d4] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              名前検索
            </button>
            <button
              onClick={() => { setSearchMode('season'); setSearchResults([]); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchMode === 'season'
                  ? 'bg-[#e879d4] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              シーズン検索
            </button>
          </div>

          {searchMode === 'name' ? (
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                placeholder="アニメを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchAnime()}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
              />
              <div className="flex gap-2 sm:flex-row">
                <button
                  onClick={handleSearchAnime}
                  disabled={isSearching || isStreamingSearchLoading || !searchQuery.trim()}
                  className="flex-1 sm:flex-none px-4 py-2 bg-[#e879d4] text-white rounded-lg text-sm font-medium hover:bg-[#d45dbf] transition-colors disabled:opacity-50"
                >
                  {isSearching || isStreamingSearchLoading ? '検索中...' : '検索'}
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setSearchQuery(''); setSearchResults([]); }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="年"
                    value={seasonYear}
                    onChange={(e) => setSeasonYear(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
                  />
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value as typeof season)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
                  >
                    <option value="WINTER">冬</option>
                    <option value="SPRING">春</option>
                    <option value="SUMMER">夏</option>
                    <option value="FALL">秋</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSearchBySeason}
                    disabled={isSearching || isStreamingSearchLoading}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#e879d4] text-white rounded-lg text-sm font-medium hover:bg-[#d45dbf] transition-colors disabled:opacity-50"
                  >
                    {isSearching || isStreamingSearchLoading ? '検索中...' : '検索'}
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setSearchResults([]); }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map(anime => {
                const isAdded = isAnimeAdded(anime.id);
                const isWatched = isAnimeWatched(anime.id);
                const isDisabled = isAdded || isWatched;
                const statusType = isWatched ? 'watched' : isAdded ? 'watchlist' : null;
                
                return (
                  <button
                    key={anime.id}
                    onClick={() => !isDisabled && handleAddToWatchlist(anime)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-10 h-14 rounded overflow-hidden shrink-0 relative ${
                      isDisabled ? 'bg-gray-300 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-600'
                    }`}>
                      {anime.coverImage?.large && (
                        <Image
                          src={anime.coverImage.large}
                          alt=""
                          fill
                          className={`object-cover ${isDisabled ? 'opacity-50' : ''}`}
                          sizes="40px"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm line-clamp-2 block ${
                          isDisabled
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-gray-800 dark:text-white'
                        }`}>
                          {anime.title?.native || anime.title?.romaji}
                        </span>
                        {statusType === 'watchlist' && (
                          <span className="px-2 py-0.5 text-xs bg-purple-200 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded whitespace-nowrap shrink-0">
                            積みアニメに追加済み
                          </span>
                        )}
                        {statusType === 'watched' && (
                          <span className="px-2 py-0.5 text-xs bg-green-200 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded whitespace-nowrap shrink-0">
                            視聴済み
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 一括アクションバー（選択モード中のみ表示） */}
      {isSelectionMode && (
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedIds.size}件選択中
            </p>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                すべて選択
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                選択解除
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBulkMarkAsWatched}
              disabled={selectedIds.size === 0}
              className="px-3 py-2 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              視聴済みにする
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              className="px-3 py-2 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              削除
            </button>
            <button
              onClick={toggleSelectionMode}
              className="px-3 py-2 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ml-auto"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 並び替えセレクトボックスと編集ボタン */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
          並び替え:
        </label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
        >
          <option value="created_desc">追加日（新しい順）</option>
          <option value="created_asc">追加日（古い順）</option>
          <option value="title">タイトル順</option>
          <option value="broadcast">放送曜日順</option>
        </select>
        <button
          onClick={toggleSelectionMode}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ml-auto ${
            isSelectionMode
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {isSelectionMode ? '編集中' : '編集'}
        </button>
      </div>

      {/* 積みアニメ一覧 */}
      {filteredWatchlist.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredWatchlist.map(item => (
            <WatchlistCard
              key={item.id}
              item={item}
              onRemove={handleRemove}
              onMarkAsWatched={handleMarkAsWatchedClick}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={toggleSelectItem}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-gray-500 dark:text-gray-400">
            積みアニメがありません
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            気になる作品を追加してみましょう
          </p>
        </div>
      )}

      {/* 視聴済み確認モーダル */}
      {showWatchedModal && selectedWatchlistItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowWatchedModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 dark:text-white">視聴済みにする</h2>
            
            {/* アニメ情報 */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                {selectedWatchlistItem.image && (
                  <div className="w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative shrink-0">
                    <Image
                      src={selectedWatchlistItem.image}
                      alt={selectedWatchlistItem.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{selectedWatchlistItem.title}</p>
                </div>
              </div>
            </div>

            {/* 評価選択 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                評価
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setWatchedRating(rating)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      watchedRating === rating
                        ? 'bg-[#e879d4] text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="inline-flex items-center gap-0.5">{rating}<Star className="w-3.5 h-3.5 fill-current" aria-hidden /></span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                評価なしにする場合は「評価なし」を選択してください
              </p>
              <button
                onClick={() => setWatchedRating(0)}
                className={`mt-2 w-full py-2 rounded-lg font-medium transition-colors ${
                  watchedRating === 0
                    ? 'bg-gray-400 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                評価なし
              </button>
            </div>

            {/* シーズン選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                視聴したクール
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={watchedSeasonYear}
                  onChange={(e) => setWatchedSeasonYear(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
                  placeholder="年"
                />
                <select
                  value={watchedSeason}
                  onChange={(e) => setWatchedSeason(e.target.value as typeof watchedSeason)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
                >
                  <option value="WINTER">冬</option>
                  <option value="SPRING">春</option>
                  <option value="SUMMER">夏</option>
                  <option value="FALL">秋</option>
                </select>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWatchedModal(false);
                  setSelectedWatchlistItem(null);
                }}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleMarkAsWatched}
                className="flex-1 bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors"
              >
                視聴済みにする
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 詳細情報ボトムシート */}
      <WatchlistDetailSheet
        item={selectedItem}
        animeMedia={selectedAnimeMedia}
        isWatchlistMode={true}
        onMarkAsWatched={handleMarkAsWatchedClick}
        onClose={() => {
          setSelectedItem(null);
          setSelectedAnimeMedia(null);
        }}
        onUpdate={async () => {
          // リストを更新
          await loadWatchlist();
          // 詳細画面は閉じずに、更新されたアイテムを再取得して設定
          if (selectedItem?.anilist_id) {
            const updatedItems = await storage.getWatchlist();
            const updatedItem = updatedItems.find(item => item.anilist_id === selectedItem.anilist_id);
            if (updatedItem) {
              setSelectedItem(updatedItem);
            }
          }
        }}
      />
    </>
  );
}

