'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useStorage } from '../../hooks/useStorage';
import { useAnimeSearchWithStreaming } from '../../hooks/useAnimeSearchWithStreaming';
import type { WatchlistItem } from '../../lib/storage/types';
import { getCurrentSeason, getNextSeason } from '../../utils/helpers';
import { getBroadcastInfo, type AniListMedia } from '../../lib/anilist';
import type { AniListMediaWithStreaming } from '../../lib/api/annict';
import { WatchlistDetailSheet } from '../modals/WatchlistDetailSheet';
import { StreamingBadges } from '../common/StreamingBadges';

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
  onStatusChange: (anilistId: number, newStatus: 'planned' | 'watching' | 'completed') => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onCardClick?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const isImageUrl = item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'));

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return '視聴予定';
      case 'watching': return '視聴中';
      case 'completed': return '視聴完了';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-500';
      case 'watching': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getNextStatus = (currentStatus: string | null | undefined): 'planned' | 'watching' | 'completed' | null => {
    switch (currentStatus) {
      case 'planned': return 'watching';
      case 'watching': return 'completed';
      case 'completed': return null; // 完了後は削除またはそのまま
      default: return 'watching'; // statusがnullの場合はwatchingに
    }
  };

  const handleStatusChange = () => {
    const nextStatus = getNextStatus(item.status);
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
            className="w-5 h-5 rounded border-gray-300 text-[#e879d4] focus:ring-[#e879d4] cursor-pointer"
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
        
        {/* ステータスバッジ */}
        {item.status && (
          <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(item.status)}`}>
            {getStatusLabel(item.status)}
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
  onCardClick,
}: {
  anime: AniListMediaWithStreaming;
  isAdded: boolean;
  onAdd: () => void;
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
          <div className="w-full aspect-[2/3] bg-gradient-to-br from-[#e879d4] to-[#764ba2] rounded-lg flex items-center justify-center text-4xl">
            🎬
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
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAdd();
        }}
        disabled={isAdded}
        className={`mt-1 w-full px-2 py-1 text-xs font-medium rounded transition-colors relative z-10 ${
          isAdded
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-purple-500 text-white hover:bg-purple-600'
        }`}
      >
        {isAdded ? '追加済み' : '視聴予定に追加'}
      </button>
    </div>
  );
}

type SeasonType = 'current' | 'next';

export default function SeasonWatchlistTab() {
  const storage = useStorage();
  const [selectedSeason, setSelectedSeason] = useState<SeasonType>('current'); // デフォルトは今期
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'planned' | 'watching' | 'completed' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // 並び替え設定
  const [sortOrder, setSortOrder] = useState<'broadcast' | 'created_desc' | 'created_asc' | 'title'>('broadcast');
  
  // 選択モード関連の状態
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 詳細表示関連の状態
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [selectedAnimeMedia, setSelectedAnimeMedia] = useState<AniListMediaWithStreaming | null>(null);
  
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

  // ステータス変更
  const handleStatusChange = useCallback(async (
    anilistId: number,
    newStatus: 'planned' | 'watching' | 'completed'
  ) => {
    try {
      const success = await storage.updateWatchlistItem(anilistId, { status: newStatus });
      if (success) {
        await loadWatchlist();
      } else {
        alert('ステータスの更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('ステータスの更新に失敗しました');
    }
  }, [storage, loadWatchlist]);

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
        // 追加後も一覧には表示し続ける（追加済み表示のまま）
      } else {
        alert('視聴予定の追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      alert('視聴予定の追加に失敗しました');
    }
  }, [storage, activeSeason.year, activeSeason.season, loadWatchlist]);

  // 追加済みかどうかを判定
  const isAnimeAdded = useCallback((anilistId: number) => {
    return watchlist.some(item => item.anilist_id === anilistId);
  }, [watchlist]);

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
  const handleBulkStatusChange = useCallback(async (newStatus: 'planned' | 'watching' | 'completed') => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    const success = await storage.updateWatchlistItemsStatus(ids, newStatus);
    
    if (success) {
      await loadWatchlist();
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      alert('ステータスの更新に失敗しました');
    }
  }, [storage, selectedIds, loadWatchlist]);

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
      <div className="flex gap-2 mb-4">
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
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[#e879d4] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">読み込み中...</p>
              </div>
            </div>
          ) : displayedAnime.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {displayedAnime.map(anime => (
                <SearchResultCard
                  key={anime.id}
                  anime={anime}
                  isAdded={isAnimeAdded(anime.id)}
                  onAdd={() => handleAddToWatchlist(anime)}
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
          <p className="text-4xl mb-3">📺</p>
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

      {/* 詳細情報ボトムシート */}
      <WatchlistDetailSheet
        item={selectedItem}
        animeMedia={selectedAnimeMedia}
        onClose={() => {
          setSelectedItem(null);
          setSelectedAnimeMedia(null);
        }}
        onUpdate={async () => {
          // リストを更新
          await loadWatchlist();
          // 詳細画面は閉じずに、更新されたアイテムを再取得して設定
          if (selectedItem?.anilist_id) {
            const updatedItems = selectedSeason === 'current'
              ? await storage.getCurrentSeasonWatchlist(filterStatus === 'all' ? undefined : filterStatus)
              : await storage.getNextSeasonWatchlist(filterStatus === 'all' ? undefined : filterStatus);
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

