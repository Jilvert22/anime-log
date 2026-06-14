'use client';
import { Tv, Star, Film } from 'lucide-react';
import { useFeedback } from '../../contexts/FeedbackContext';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useStorage } from '../../hooks/useStorage';
import { useAnimeSearchWithStreaming } from '../../hooks/useAnimeSearchWithStreaming';
import { useAnimeDataContext } from '../../contexts/AnimeDataContext';
import { useAuth } from '../../hooks/useAuth';
import type { WatchlistItem } from '../../lib/storage/types';
import {
  getNextWatchlistStatus,
  getWatchlistStatusLabel,
  getWatchlistStatusColor,
  type WatchlistStatus,
  type WatchlistStatusFilter,
} from '../../lib/watchlist/status';
import { getCurrentSeason, getNextSeason, animeToSupabase, sortSeasonsByTime, extractSeriesName, getSeasonName, SEASON_QUARTER } from '../../utils/helpers';
import { getBroadcastInfo, getAnimeDetail, type AniListMedia } from '../../lib/anilist';
import type { AniListMediaWithStreaming } from '../../lib/api/annict';
import { WatchlistDetailSheet } from '../modals/WatchlistDetailSheet';
import { Spinner } from '../common/Spinner';
import { supabase } from '../../lib/supabase';
import type { Anime } from '../../types';

// 視聴予定アニメカード
function SeasonWatchlistCard({ 
  item, 
  onStatusChange,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onCardClick,
}: { 
  item: WatchlistItem; 
  onStatusChange: (anilistId: number, newStatus: WatchlistStatus) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onCardClick?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const isImageUrl = item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'));

  const handleStatusChange = () => {
    const nextStatus = getNextWatchlistStatus(item.status);
    if (nextStatus && item.anilist_id) {
      onStatusChange(item.anilist_id, nextStatus);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      return;
    }
    
    // カードをタップしたら詳細画面を開く
    if (onCardClick) {
      onCardClick();
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
            onChange={onToggleSelect}
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
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-8 h-8 text-white/60" aria-hidden />
          </div>
        )}
        
        {/* ステータスバッジ */}
        {item.status && (
          <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white ${getWatchlistStatusColor(item.status)}`}>
            {getWatchlistStatusLabel(item.status)}
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
}

// 検索結果カードコンポーネント（クール別一覧と同じスタイル）
function SearchResultCard({
  anime,
  isAdded,
  onAdd,
  onRemove,
  onCardClick,
}: {
  anime: AniListMediaWithStreaming;
  isAdded: boolean;
  onAdd: () => void;
  onRemove?: () => void;
  onCardClick?: () => void;
}) {
  return (
    <div className="relative group">
      <div 
        className="relative cursor-pointer" 
        onClick={onCardClick}
      >
        {anime.coverImage?.large ? (
          <Image
            src={anime.coverImage.large}
            alt={anime.title?.native || anime.title?.romaji || ''}
            width={200}
            height={300}
            className="w-full aspect-[2/3] object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-gradient-to-br from-[#e879d4] to-[#764ba2] rounded-lg flex items-center justify-center">
            <Film className="w-8 h-8 text-white/60" aria-hidden />
          </div>
        )}
        {/* ホバー時のオーバーレイ */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
          <span className="text-white text-sm font-medium">詳細を見る</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
        {anime.title?.native || anime.title?.romaji || 'タイトル不明'}
      </p>
      <div className="mt-1 flex gap-1">
        {isAdded && onRemove ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="flex-1 px-2 py-1 text-xs font-medium rounded transition-colors relative z-10 bg-gray-500 text-white hover:bg-gray-600"
          >
            視聴予定から外す
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd();
            }}
            disabled={isAdded}
            className={`w-full px-2 py-1 text-xs font-medium rounded transition-colors relative z-10 ${
              isAdded
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            {isAdded ? '追加済み' : '視聴予定に追加'}
          </button>
        )}
      </div>
    </div>
  );
}

type SeasonType = 'current' | 'next';

export default function SeasonWatchlistTab() {
  const storage = useStorage();
  const { user } = useAuth();
  const { seasons, setSeasons, expandedSeasons, setExpandedSeasons } = useAnimeDataContext();
  const [selectedSeason, setSelectedSeason] = useState<SeasonType>('current'); // デフォルトは今期
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<WatchlistStatusFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // 並び替え設定
  const [sortOrder, setSortOrder] = useState<'broadcast' | 'created_desc' | 'created_asc' | 'title'>('broadcast');
  
  // 選択モード関連の状態
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 詳細表示関連の状態
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [selectedAnimeMedia, setSelectedAnimeMedia] = useState<AniListMediaWithStreaming | null>(null);
  
  // 視聴済みモーダル（評価・クール選択）
  const [showWatchedModal, setShowWatchedModal] = useState(false);
  const [selectedWatchlistItem, setSelectedWatchlistItem] = useState<WatchlistItem | null>(null);
  const [watchedRating, setWatchedRating] = useState(0);
  const [watchedSeasonYear, setWatchedSeasonYear] = useState(new Date().getFullYear());
  const [watchedSeason, setWatchedSeason] = useState<'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'>('SPRING');
  // 「視聴完了」起因でモーダルを開いたか（true のときはスキップ時も一覧から除去する）
  const [watchedFromCompletion, setWatchedFromCompletion] = useState(false);
  // 視聴済みモーダルの処理中フラグ（記録/スキップの二重実行・競合を防ぐ）
  const [isSavingWatched, setIsSavingWatched] = useState(false);

  const currentSeason = getCurrentSeason();
  const nextSeason = getNextSeason();
  const activeSeason = selectedSeason === 'current' ? currentSeason : nextSeason;
  
  // アニメ一覧の展開/折りたたみ状態
  const [isAnimeListExpanded, setIsAnimeListExpanded] = useState(false);
  const [allSeasonAnime, setAllSeasonAnime] = useState<AniListMediaWithStreaming[]>([]);
  const [displayedAnime, setDisplayedAnime] = useState<AniListMediaWithStreaming[]>([]);
  const [isLoadingAnime, setIsLoadingAnime] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { searchBySeason } = useAnimeSearchWithStreaming();

  // 選択されたシーズンの視聴予定アニメを読み込む
  const loadWatchlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = selectedSeason === 'current'
        ? await storage.getCurrentSeasonWatchlist(filterStatus === 'all' ? undefined : filterStatus)
        : await storage.getNextSeasonWatchlist(filterStatus === 'all' ? undefined : filterStatus);
      setWatchlist(items);
    } catch (error) {
      console.error('Failed to load season watchlist:', error);
      setWatchlist([]);
    } finally {
      setIsLoading(false);
    }
  }, [storage, filterStatus, selectedSeason]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // 選択されたシーズンのアニメを取得（配信情報付き）
  const loadSeasonAnime = useCallback(async () => {
    setIsLoadingAnime(true);
    try {
      // 配信情報付きで検索（最初の50件を取得）
      const results = await searchBySeason(
        activeSeason.season,
        activeSeason.year,
        1,
        50
      );
      
      setAllSeasonAnime(results);
      setDisplayedAnime(results);
    } catch (error) {
      console.error('Failed to load season anime:', error);
      setAllSeasonAnime([]);
      setDisplayedAnime([]);
    } finally {
      setIsLoadingAnime(false);
    }
  }, [activeSeason.season, activeSeason.year, searchBySeason]);

  // 一覧を展開/折りたたみ
  const toggleAnimeList = useCallback(() => {
    if (!isAnimeListExpanded) {
      // 展開時：アニメ一覧を読み込む
      loadSeasonAnime();
    }
    setIsAnimeListExpanded(!isAnimeListExpanded);
  }, [isAnimeListExpanded, loadSeasonAnime]);

  // シーズン切り替え時に一覧を折りたたむ
  useEffect(() => {
    setIsAnimeListExpanded(false);
    setFilterQuery('');
    setAllSeasonAnime([]);
    setDisplayedAnime([]);
  }, [selectedSeason]);

  // フィルタクエリでフィルタリング
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (!filterQuery.trim()) {
        setDisplayedAnime(allSeasonAnime);
      } else {
        const filtered = allSeasonAnime.filter((anime) => {
          const titleNative = (anime.title?.native || '').toLowerCase();
          const titleRomaji = (anime.title?.romaji || '').toLowerCase();
          const queryLower = filterQuery.toLowerCase();
          return titleNative.includes(queryLower) || titleRomaji.includes(queryLower);
        });
        setDisplayedAnime(filtered);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filterQuery, allSeasonAnime]);

  const { showToast, confirmDialog } = useFeedback();

  // 視聴済みモーダルを開く
  // クールの初期値はwatchlist側のシーズン情報を優先(ユーザーの入力ミス防止)
  const openWatchedModal = useCallback((item: WatchlistItem, fromCompletion = false) => {
    setSelectedWatchlistItem(item);
    setWatchedRating(0);
    setWatchedSeasonYear(item.season_year ?? new Date().getFullYear());
    setWatchedSeason(item.season ?? 'SPRING');
    setWatchedFromCompletion(fromCompletion);
    setShowWatchedModal(true);
  }, []);

  // 視聴済みモーダルを閉じる。完了起因(スキップ)なら記録せず一覧から除去する。
  const closeWatchedModal = useCallback(async () => {
    if (isSavingWatched) return; // 記録処理中はスキップ操作を受け付けない
    const completedItem = watchedFromCompletion ? selectedWatchlistItem : null;
    setShowWatchedModal(false);
    setSelectedWatchlistItem(null);
    setWatchedFromCompletion(false);
    if (completedItem) {
      setIsSavingWatched(true);
      try {
        const removed = await storage.removeFromWatchlist(completedItem.anilist_id);
        if (removed) {
          await loadWatchlist();
        } else {
          showToast('一覧からの除去に失敗しました', 'error');
        }
      } finally {
        setIsSavingWatched(false);
      }
    }
  }, [isSavingWatched, watchedFromCompletion, selectedWatchlistItem, storage, loadWatchlist, showToast]);

  // ステータス変更
  const handleStatusChange = useCallback(async (
    anilistId: number,
    newStatus: WatchlistStatus
  ) => {
    try {
      const success = await storage.updateWatchlistItem(anilistId, { status: newStatus });
      if (success) {
        await loadWatchlist();
        showToast('ステータスを更新しました');
        // 視聴完了にしたタイミングで視聴記録化(評価入力)を促す。
        // 完了アイテムは記録化/スキップどちらでも一覧から外す(fromCompletion=true)。
        if (newStatus === 'completed') {
          const completedItem = watchlist.find(item => item.anilist_id === anilistId);
          if (completedItem) {
            openWatchedModal({ ...completedItem, status: 'completed' }, true);
          }
        }
      } else {
        showToast('ステータスの更新に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('ステータスの更新に失敗しました', 'error');
    }
  }, [storage, loadWatchlist, watchlist, openWatchedModal]);

  // 視聴予定に追加
  const handleAddToWatchlist = useCallback(async (anime: AniListMediaWithStreaming) => {
    try {
      // 放送情報を取得
      const broadcastInfo = getBroadcastInfo(anime);
      
      const success = await storage.addToWatchlist({
        anilist_id: anime.id,
        title: anime.title?.native || anime.title?.romaji || '',
        image: anime.coverImage?.large || null,
        status: 'planned',
        season_year: activeSeason.year,
        season: activeSeason.season,
        broadcast_day: broadcastInfo.day,
        broadcast_time: broadcastInfo.time,
        streaming_sites: anime.streamingServices || null,
      });

      if (success) {
        await loadWatchlist();
        showToast('視聴予定に追加しました');
        // 追加後も一覧には表示し続ける（追加済み表示のまま）
      } else {
        showToast('視聴予定の追加に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      showToast('視聴予定の追加に失敗しました', 'error');
    }
  }, [storage, activeSeason.year, activeSeason.season, loadWatchlist]);

  // 追加済みかどうかを判定
  const isAnimeAdded = useCallback((anilistId: number) => {
    return watchlist.some(item => item.anilist_id === anilistId);
  }, [watchlist]);

  // 視聴予定から外す（検索結果の「追加済み」から取り消し）
  const handleRemoveFromWatchlist = useCallback(async (anilistId: number) => {
    try {
      const success = await storage.removeFromWatchlist(anilistId);
      if (success) {
        await loadWatchlist();
        showToast('視聴予定から外しました');
      } else {
        showToast('視聴予定から外す操作に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      showToast('視聴予定から外す操作に失敗しました', 'error');
    }
  }, [storage, loadWatchlist]);

  // 視聴済みにする（評価・クールを設定して animes に追加し、watchlist から削除）
  const handleMarkAsWatched = useCallback(async () => {
    if (!selectedWatchlistItem || !user || isSavingWatched) return;

    setIsSavingWatched(true);
    try {
      const animeData = await getAnimeDetail(selectedWatchlistItem.anilist_id);
      if (!animeData) {
        showToast('アニメ情報の取得に失敗しました', 'error');
        return;
      }

      const seasonName = getSeasonName(watchedSeasonYear, SEASON_QUARTER[watchedSeason]);
      const titleStr = animeData.title?.native || animeData.title?.romaji || selectedWatchlistItem.title;

      const newAnime: Anime = {
        id: animeData.id,
        title: titleStr,
        image: animeData.coverImage?.large || selectedWatchlistItem.image || '',
        rating: watchedRating > 0 ? watchedRating : 0,
        watched: true,
        rewatchCount: 0,
        tags: [],
        seriesName: extractSeriesName(titleStr),
        studios: animeData.studios?.nodes?.map((s) => s.name) || [],
      };

      const existingSeasonIndex = seasons.findIndex((s) => s.name === seasonName);
      let updatedSeasons;

      if (existingSeasonIndex === -1) {
        updatedSeasons = [...seasons, { name: seasonName, animes: [newAnime] }];
      } else {
        updatedSeasons = seasons.map((season, index) =>
          index === existingSeasonIndex ? { ...season, animes: [...season.animes, newAnime] } : season
        );
      }
      const sortedSeasons = sortSeasonsByTime(updatedSeasons);
      setSeasons(sortedSeasons);

      const newExpandedSeasons = new Set(expandedSeasons);
      newExpandedSeasons.add(seasonName);
      setExpandedSeasons(newExpandedSeasons);

      const supabaseData = animeToSupabase(newAnime, seasonName, user.id);
      const { error } = await supabase.from('animes').insert(supabaseData).select();
      if (error) throw error;

      await storage.removeFromWatchlist(selectedWatchlistItem.anilist_id);
      await loadWatchlist();

      setShowWatchedModal(false);
      setSelectedWatchlistItem(null);
      setWatchedFromCompletion(false);
    } catch (error) {
      console.error('視聴済みマークに失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
      showToast(`エラーが発生しました${errorMessage !== 'エラーが発生しました' ? `: ${errorMessage}` : ''}`, 'error');
    } finally {
      setIsSavingWatched(false);
    }
  }, [selectedWatchlistItem, user, isSavingWatched, watchedRating, watchedSeasonYear, watchedSeason, seasons, setSeasons, expandedSeasons, setExpandedSeasons, storage, loadWatchlist, showToast]);

  // フィルタリング
  const filteredWatchlist = useMemo(() => {
    let filtered = watchlist.filter(item => {
      if (filterStatus === 'all') return true;
      return item.status === filterStatus;
    });

    // 並び替え
    filtered = [...filtered].sort((a, b) => {
      switch (sortOrder) {
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
        
        default:
          return 0;
      }
    });

    return filtered;
  }, [watchlist, filterStatus, sortOrder]);

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

  // 一括ステータス変更
  const handleBulkStatusChange = useCallback(async (newStatus: WatchlistStatus) => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);

    // 「視聴完了」は単体と同じく一覧から外す方針。一括では個別の記録化は行わず、
    // 視聴記録を作らずに除去する旨を確認してから削除する。
    if (newStatus === 'completed') {
      const confirmed = await confirmDialog({
        message: `${ids.length}件を視聴完了にして一覧から外しますか？\n(視聴記録は作成されません)`,
        confirmLabel: '視聴完了にする',
      });
      if (!confirmed) return;

      const success = await storage.deleteWatchlistItems(ids);
      if (success) {
        await loadWatchlist();
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        showToast(`${ids.length}件を視聴完了にして一覧から外しました`);
      } else {
        showToast('一覧からの除去に失敗しました', 'error');
      }
      return;
    }

    const success = await storage.updateWatchlistItemsStatus(ids, newStatus);

    if (success) {
      await loadWatchlist();
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      showToast('ステータスの更新に失敗しました', 'error');
    }
  }, [storage, selectedIds, loadWatchlist, confirmDialog, showToast]);

  // 一括削除
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;

    if (!(await confirmDialog({ message: `${selectedIds.size}件のアニメを削除しますか？`, danger: true, confirmLabel: '削除' }))) {
      return;
    }

    const ids = Array.from(selectedIds);
    const success = await storage.deleteWatchlistItems(ids);
    
    if (success) {
      await loadWatchlist();
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      showToast(`${ids.length}件を削除しました`);
    } else {
      showToast('削除に失敗しました', 'error');
    }
  }, [storage, selectedIds, loadWatchlist]);

  return (
    <>
      {/* 説明 */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-xl p-4 mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white mb-1">
          視聴予定
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          今期・来期の視聴予定アニメを管理します。ステータスを変更して進捗を追跡できます。
        </p>
      </div>

      {/* シーズン切り替えタブ */}
      <div className="flex gap-2 mb-4" data-onboarding="step-3">
        <button
          onClick={() => setSelectedSeason('current')}
          className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex flex-col items-center justify-center gap-1 ${
            selectedSeason === 'current'
              ? 'bg-[#e879d4] text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <span className="text-base font-semibold">今期</span>
          <span className="text-sm opacity-90">{currentSeason.year}年 {currentSeason.seasonName}</span>
        </button>
        <button
          onClick={() => setSelectedSeason('next')}
          className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex flex-col items-center justify-center gap-1 ${
            selectedSeason === 'next'
              ? 'bg-[#e879d4] text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <span className="text-base font-semibold">来期</span>
          <span className="text-sm opacity-90">{nextSeason.year}年 {nextSeason.seasonName}</span>
        </button>
      </div>

      {/* アニメから追加ボタン */}
      <div className="mb-4">
        <button
          onClick={toggleAnimeList}
          className="w-full px-4 py-3 bg-[#e879d4] text-white rounded-xl font-medium hover:bg-[#d45dbf] transition-colors flex items-center justify-center gap-2"
        >
          <span>{selectedSeason === 'current' ? '今期' : '来期'}アニメから追加</span>
          <span>{isAnimeListExpanded ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* アニメ一覧エリア（展開時のみ） */}
      {isAnimeListExpanded && (
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          {/* フィルタ検索バー */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="タイトルで絞り込み..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
            />
          </div>

          {/* アニメグリッド */}
          {isLoadingAnime ? (
            <div className="flex items-center justify-center py-12">
              <Spinner label="読み込み中..." />
            </div>
          ) : displayedAnime.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {displayedAnime.map(anime => (
                <SearchResultCard
                  key={anime.id}
                  anime={anime}
                  isAdded={isAnimeAdded(anime.id)}
                  onAdd={() => handleAddToWatchlist(anime)}
                  onRemove={isAnimeAdded(anime.id) ? () => handleRemoveFromWatchlist(anime.id) : undefined}
                  onCardClick={() => setSelectedAnimeMedia(anime)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {filterQuery.trim() ? '検索結果が見つかりませんでした' : 'アニメが見つかりませんでした'}
              </p>
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
              onClick={() => handleBulkStatusChange('watching')}
              disabled={selectedIds.size === 0}
              className="px-3 py-2 text-xs font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              視聴中に変更
            </button>
            <button
              onClick={() => handleBulkStatusChange('completed')}
              disabled={selectedIds.size === 0}
              className="px-3 py-2 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              視聴完了に変更
            </button>
            <button
              onClick={() => handleBulkStatusChange('planned')}
              disabled={selectedIds.size === 0}
              className="px-3 py-2 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              視聴予定に戻す
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

      {/* フィルター/タブ */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide items-center">
        {[
          { id: 'all' as const, label: 'すべて' },
          { id: 'planned' as const, label: '視聴予定' },
          { id: 'watching' as const, label: '視聴中' },
          { id: 'completed' as const, label: '視聴完了' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filterStatus === tab.id
                ? 'bg-[#e879d4] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className="ml-2 text-xs opacity-75">
                ({watchlist.filter(item => item.status === tab.id).length})
              </span>
            )}
          </button>
        ))}
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

      {/* 並び替えセレクトボックス */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
          並び替え:
        </label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
        >
          <option value="broadcast">放送曜日順</option>
          <option value="created_desc">追加日（新しい順）</option>
          <option value="created_asc">追加日（古い順）</option>
          <option value="title">タイトル順</option>
        </select>
      </div>

      {/* ローディング */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">読み込み中...</p>
        </div>
      )}

      {/* 視聴予定アニメ一覧 */}
      {!isLoading && filteredWatchlist.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredWatchlist.map(item => (
            <SeasonWatchlistCard
              key={item.id}
              item={item}
              onStatusChange={handleStatusChange}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={() => toggleSelectItem(item.id)}
              onCardClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-12">
          <Tv className="w-10 h-10 mx-auto mb-3 text-gray-400" aria-hidden />
          <p className="text-gray-500 dark:text-gray-400">
            {filterStatus === 'all' 
              ? `${selectedSeason === 'current' ? '今期' : '来期'}の視聴予定アニメがありません`
              : `${filterStatus === 'planned' ? '視聴予定' : filterStatus === 'watching' ? '視聴中' : '視聴完了'}のアニメがありません`
            }
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {selectedSeason === 'current' ? '今期' : '来期'}アニメから追加できます
          </p>
        </div>
      ) : null}

      {/* 視聴済み確認モーダル（評価・クール選択） */}
      {showWatchedModal && selectedWatchlistItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={watchedFromCompletion ? undefined : closeWatchedModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 dark:text-white">視聴済みにする</h2>
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">評価</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setWatchedRating(rating)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      watchedRating === rating ? 'bg-[#e879d4] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="inline-flex items-center gap-0.5">{rating}<Star className="w-3.5 h-3.5 fill-current" aria-hidden /></span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">評価なしにする場合は「評価なし」を選択してください</p>
              <button
                onClick={() => setWatchedRating(0)}
                className={`mt-2 w-full py-2 rounded-lg font-medium transition-colors ${
                  watchedRating === 0 ? 'bg-gray-400 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                評価なし
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">視聴したクール</label>
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
            <div className="flex gap-3">
              <button
                onClick={closeWatchedModal}
                disabled={isSavingWatched}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {watchedFromCompletion ? '記録せずに完了' : 'キャンセル'}
              </button>
              <button
                onClick={handleMarkAsWatched}
                disabled={isSavingWatched}
                className="flex-1 bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingWatched ? '処理中...' : '視聴済みにする'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 詳細情報ボトムシート */}
      <WatchlistDetailSheet
        item={selectedItem}
        animeMedia={selectedAnimeMedia}
        onClose={() => {
          setSelectedItem(null);
          setSelectedAnimeMedia(null);
        }}
        onUpdate={async () => {
          await loadWatchlist();
          if (selectedItem?.anilist_id) {
            const updatedItems = selectedSeason === 'current'
              ? await storage.getCurrentSeasonWatchlist(filterStatus === 'all' ? undefined : filterStatus)
              : await storage.getNextSeasonWatchlist(filterStatus === 'all' ? undefined : filterStatus);
            const updatedItem = updatedItems.find(item => item.anilist_id === selectedItem.anilist_id);
            if (updatedItem) setSelectedItem(updatedItem);
          }
        }}
        onMarkAsWatched={openWatchedModal}
        onRemove={handleRemoveFromWatchlist}
      />
    </>
  );
}

