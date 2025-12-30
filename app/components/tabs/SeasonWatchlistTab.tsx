'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import { getSeasonWatchlist, getCurrentSeasonWatchlist, getNextSeasonWatchlist, updateWatchlistItem, addToWatchlist, type WatchlistItem } from '../../lib/supabase';
import { getCurrentSeason, getNextSeason } from '../../utils/helpers';
import { searchAnimeBySeasonAll, type AniListMedia } from '../../lib/anilist';

// 視聴予定アニメカード
function SeasonWatchlistCard({ 
  item, 
  onStatusChange,
}: { 
  item: WatchlistItem; 
  onStatusChange: (anilistId: number, newStatus: 'planned' | 'watching' | 'completed') => void;
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden group">
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
        
        {/* ホバー時のステータス変更ボタン */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-2">
          {item.status && getNextStatus(item.status) && (
            <button
              onClick={handleStatusChange}
              className="w-full py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {getStatusLabel(getNextStatus(item.status) || '')}にする
            </button>
          )}
        </div>
      </div>
      
      <div className="p-2">
        <p className="text-sm font-medium text-gray-800 dark:text-white line-clamp-2">{item.title}</p>
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
}: {
  anime: AniListMedia;
  isAdded: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="relative group">
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
        className={`mt-1 w-full px-2 py-1 text-xs font-medium rounded transition-colors ${
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

export function SeasonWatchlistTab({
  user,
}: {
  user: User | null;
}) {
  const [selectedSeason, setSelectedSeason] = useState<SeasonType>('next'); // デフォルトは来期
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'planned' | 'watching' | 'completed' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  const currentSeason = getCurrentSeason();
  const nextSeason = getNextSeason();
  const activeSeason = selectedSeason === 'current' ? currentSeason : nextSeason;
  
  // アニメ一覧の展開/折りたたみ状態
  const [isAnimeListExpanded, setIsAnimeListExpanded] = useState(false);
  const [allSeasonAnime, setAllSeasonAnime] = useState<AniListMedia[]>([]);
  const [displayedAnime, setDisplayedAnime] = useState<AniListMedia[]>([]);
  const [isLoadingAnime, setIsLoadingAnime] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 選択されたシーズンの視聴予定アニメを読み込む
  const loadWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const items = selectedSeason === 'current'
        ? await getCurrentSeasonWatchlist(user.id, filterStatus === 'all' ? undefined : filterStatus)
        : await getNextSeasonWatchlist(user.id, filterStatus === 'all' ? undefined : filterStatus);
      setWatchlist(items);
    } catch (error) {
      console.error('Failed to load season watchlist:', error);
      setWatchlist([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, filterStatus, selectedSeason]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // 選択されたシーズンのアニメを全件取得
  const loadSeasonAnime = useCallback(async () => {
    setIsLoadingAnime(true);
    try {
      // 全件取得（ページネーション処理込み）
      const allMedia = await searchAnimeBySeasonAll(
        activeSeason.season,
        activeSeason.year,
        50
      );
      
      setAllSeasonAnime(allMedia);
      setDisplayedAnime(allMedia);
    } catch (error) {
      console.error('Failed to load season anime:', error);
      setAllSeasonAnime([]);
      setDisplayedAnime([]);
    } finally {
      setIsLoadingAnime(false);
    }
  }, [activeSeason.season, activeSeason.year]);

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
    if (!user) return;
    
    const success = await updateWatchlistItem(anilistId, { status: newStatus });
    if (success) {
      await loadWatchlist();
    } else {
      alert('ステータスの更新に失敗しました');
    }
  }, [user, loadWatchlist]);

  // 視聴予定に追加
  const handleAddToWatchlist = useCallback(async (anime: AniListMedia) => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    try {
      const success = await addToWatchlist({
        anilist_id: anime.id,
        title: anime.title?.native || anime.title?.romaji || '',
        image: anime.coverImage?.large || null,
        status: 'planned',
        season_year: activeSeason.year,
        season: activeSeason.season,
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
  }, [user, activeSeason.year, activeSeason.season, loadWatchlist]);

  // 追加済みかどうかを判定
  const isAnimeAdded = useCallback((anilistId: number) => {
    return watchlist.some(item => item.anilist_id === anilistId);
  }, [watchlist]);

  // フィルタリング
  const filteredWatchlist = watchlist.filter(item => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

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
          className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
            selectedSeason === 'current'
              ? 'bg-[#e879d4] text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          今期（{currentSeason.year}年 {currentSeason.seasonName}）
        </button>
        <button
          onClick={() => setSelectedSeason('next')}
          className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
            selectedSeason === 'next'
              ? 'bg-[#e879d4] text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          来期（{nextSeason.year}年 {nextSeason.seasonName}）
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

      {/* フィルター/タブ */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
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
    </>
  );
}

