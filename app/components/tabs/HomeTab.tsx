'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { Anime, Season, User, SupabaseAnimeRow, AniListSearchResult } from '../../types';
import { AnimeCard } from '../AnimeCard';
import { GalleryTab } from './GalleryTab';
import { WatchlistTab } from './WatchlistTab';
import SeasonWatchlistTab from './SeasonWatchlistTab';
import { searchAnimeBySeason } from '../../lib/anilist';
import { translateGenre, sortSeasonsByTime, getNextSeason, isNextSeason } from '../../utils/helpers';
import { getBroadcastInfo } from '../../lib/anilist';
import { useStorage } from '../../hooks/useStorage';
import type { WatchlistItem } from '../../lib/storage/types';
import { supabase } from '../../lib/supabase';

// フィルターの型
type FilterType = 'all' | 'unrated' | 'unwatched';

// YearHeaderコンポーネント
function YearHeader({ 
  year, 
  animes, 
  isExpanded, 
  onToggle 
}: { 
  year: string; 
  animes: Anime[]; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const stats = useMemo(() => {
    const total = animes.length;
    const godTier = animes.filter(a => a.rating === 5).length;
    const avgRating = animes.length > 0 
      ? (animes.reduce((sum, a) => sum + a.rating, 0) / animes.length).toFixed(1)
      : '0.0';
    return { total, godTier, avgRating };
  }, [animes]);

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-3 px-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 rounded-xl transition-all"
    >
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="font-bold text-xl dark:text-white">{year}年</span>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          <span className="font-bold" style={{ color: '#764ba2' }}>{stats.total}</span> 作品
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          平均 <span className="font-bold text-orange-500">{stats.avgRating}</span>
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          神作 <span className="font-bold" style={{ color: '#e879d4' }}>{stats.godTier}</span>
        </span>
      </div>
    </button>
  );
}

// SeasonHeaderコンポーネント
function SeasonHeader({ 
  season, 
  animes, 
  isExpanded, 
  onToggle,
  isEmpty,
  onSearch
}: { 
  season: string; 
  animes: Anime[]; 
  isExpanded: boolean; 
  onToggle: () => void;
  isEmpty?: boolean;
  onSearch?: () => void;
}) {
  const stats = useMemo(() => {
    const total = animes.length;
    const godTier = animes.filter(a => a.rating === 5).length;
    const avgRating = animes.length > 0 
      ? (animes.reduce((sum, a) => sum + a.rating, 0) / animes.length).toFixed(1)
      : '0.0';
    return { total, godTier, avgRating };
  }, [animes]);

  return (
    <div className={`w-full flex items-center justify-between py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ml-4 ${
      isEmpty ? 'border border-dashed border-gray-300 dark:border-gray-600' : ''
    }`}>
      <button
        onClick={onToggle}
        className="flex-1 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className={`font-medium ${isEmpty ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
            {season}
            {isEmpty && <span className="ml-2 text-xs">(未登録)</span>}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          {isEmpty ? (
            <span className="text-gray-400 dark:text-gray-500 text-xs">作品を検索</span>
          ) : (
            <>
              <span className="text-gray-500 dark:text-gray-400">
                <span className="font-medium" style={{ color: '#764ba2' }}>{stats.total}</span> 作品
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                平均 <span className="font-medium text-orange-500">{stats.avgRating}</span>
              </span>
              {stats.godTier > 0 && (
                <span className="text-gray-500 dark:text-gray-400">
                  神作 <span className="font-medium" style={{ color: '#e879d4' }}>{stats.godTier}</span>
                </span>
              )}
            </>
          )}
        </div>
      </button>
      {!isEmpty && onSearch && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSearch();
          }}
          className="ml-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          検索
        </button>
      )}
    </div>
  );
}

export function HomeTab({
  homeSubTab,
  setHomeSubTab,
  count,
  totalRewatchCount,
  averageRating,
  seasons,
  expandedYears,
  setExpandedYears,
  expandedSeasons,
  setExpandedSeasons,
  onOpenAddForm,
  setSelectedAnime,
  allAnimes,
  user,
  setSeasons,
  extractSeriesName,
  getSeasonName,
  animeToSupabase,
  supabaseToAnime,
}: {
  homeSubTab: 'seasons' | 'series' | 'gallery' | 'watchlist' | 'current-season';
  setHomeSubTab: (tab: 'seasons' | 'series' | 'gallery' | 'watchlist' | 'current-season') => void;
  count: number;
  totalRewatchCount: number;
  averageRating: number;
  seasons: Season[];
  expandedYears: Set<string>;
  setExpandedYears: (years: Set<string>) => void;
  expandedSeasons: Set<string>;  // "2024-春" のような形式
  setExpandedSeasons: (seasons: Set<string>) => void;
  onOpenAddForm: () => void;
  setSelectedAnime: (anime: Anime | null) => void;
  allAnimes: Anime[];
  user: User | null;
  setSeasons: (seasons: Season[]) => void;
  extractSeriesName: (title: string) => string | undefined;
  getSeasonName: (season: string) => string;
  animeToSupabase: (anime: Anime, seasonName: string, userId: string) => SupabaseAnimeRow;
  supabaseToAnime: (row: SupabaseAnimeRow) => Anime;
}) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAllSeasons, setShowAllSeasons] = useState(false); // すべての年・季節を表示するか
  const [seasonSearchResults, setSeasonSearchResults] = useState<Map<string, AniListSearchResult[]>>(new Map()); // シーズン検索結果
  const [loadingSeasons, setLoadingSeasons] = useState<Set<string>>(new Set()); // ローディング中のシーズン
  const [expandedSeasonSearches, setExpandedSeasonSearches] = useState<Set<string>>(new Set()); // 展開されている検索結果
  const [showUnregisteredOnly, setShowUnregisteredOnly] = useState(false); // 未登録シーズンのみ表示
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]); // 積みアニメリスト
  const [addedToWatchlistIds, setAddedToWatchlistIds] = useState<Set<number>>(new Set()); // 追加済みのAniList ID
  const seasonOrder = ['冬', '春', '夏', '秋'];

  // 積みアニメリストを読み込む
  const storage = useStorage();
  const loadWatchlist = useCallback(async () => {
    try {
      const items = await storage.getWatchlist();
      setWatchlistItems(items);
      setAddedToWatchlistIds(new Set(items.map(item => item.anilist_id).filter(id => id !== -1 && id !== null && id !== undefined)));
    } catch (error) {
      console.error('積みアニメの読み込みに失敗しました:', error);
      setWatchlistItems([]);
      setAddedToWatchlistIds(new Set());
    }
  }, [storage]);

  // コンポーネントマウント時とuser変更時に積みアニメを読み込む
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // フィルター適用
  const filterAnime = useCallback((anime: Anime): boolean => {
    switch (filter) {
      case 'unrated':
        return !anime.rating || anime.rating === 0;
      case 'unwatched':
        return !anime.rewatchCount || anime.rewatchCount === 0;
      default:
        return true;
    }
  }, [filter]);

  // 年→季節→アニメの階層データを生成（フィルター適用済み）
  const yearSeasonData = useMemo(() => {
    const data = new Map<string, Map<string, Anime[]>>();
    
    seasons.forEach(season => {
      season.animes.forEach(anime => {
        // フィルター適用
        if (!filterAnime(anime)) return;
        
        // season.name から年と季節を抽出（例: "2024年春" → year: "2024", seasonName: "春"）
        const match = season.name.match(/(\d{4})年(冬|春|夏|秋)/);
        if (match) {
          const year = match[1];
          const seasonName = match[2];
          
          if (!data.has(year)) {
            data.set(year, new Map());
          }
          if (!data.get(year)!.has(seasonName)) {
            data.get(year)!.set(seasonName, []);
          }
          data.get(year)!.get(seasonName)!.push(anime);
        }
      });
    });
    
    // すべて表示モードの場合、1970年から現在年+1年までのすべての年・季節を含める
    const currentYear = new Date().getFullYear();
    const startYear = 1970; // アニメのクールは1970年代から始まる
    const endYear = currentYear + 1; // 来年まで表示（来クールの準備）
    
    if (showAllSeasons) {
      for (let year = endYear; year >= startYear; year--) {
        const yearStr = year.toString();
        if (!data.has(yearStr)) {
          data.set(yearStr, new Map());
        }
        // すべての季節を追加（登録がない場合でも）
        seasonOrder.forEach(seasonName => {
          if (!data.get(yearStr)!.has(seasonName)) {
            data.get(yearStr)!.set(seasonName, []);
          }
        });
      }
    }
    
    // 年を降順でソート
    const sortedYears = Array.from(data.keys())
      .filter(year => {
        if (showAllSeasons) {
          const yearNum = Number(year);
          return yearNum >= startYear && yearNum <= endYear;
        }
        return true;
      })
      .sort((a, b) => Number(b) - Number(a));
    
    return sortedYears
      .map(year => ({
        year,
        seasons: seasonOrder
          .filter(s => {
            if (showAllSeasons) {
              // すべて表示モード: すべての季節を表示
              if (showUnregisteredOnly) {
                // 未登録シーズンのみ表示
                return !data.get(year)!.has(s) || data.get(year)!.get(s)!.length === 0;
              }
              return true;
            } else {
              // 登録済みのみ表示モード: 作品がある季節のみ表示
              return data.get(year)!.has(s) && data.get(year)!.get(s)!.length > 0;
            }
          })
          .map(s => ({
            season: s,
            animes: data.get(year)!.get(s) || [],
          })),
        allAnimes: Array.from(data.get(year)!.values()).flat(),
      }))
      .filter(y => {
        if (showAllSeasons) {
          // すべて表示モード: すべての年を表示
          if (showUnregisteredOnly) {
            // 未登録シーズンがある年のみ表示
            return y.seasons.length > 0;
          }
          return true;
        } else {
          // 登録済みのみ表示モード: 作品がある年のみ表示
          return y.allAnimes.length > 0;
        }
      });
  }, [seasons, filterAnime, seasonOrder, showAllSeasons, showUnregisteredOnly]);

  // 全展開/全折りたたみ
  const expandAll = useCallback(() => {
    const allYears = new Set<string>();
    const allSeasons = new Set<string>();
    yearSeasonData.forEach(y => {
      // 作品がある年のみ展開
      const hasAnimes = y.seasons.some(s => s.animes.length > 0);
      if (hasAnimes) {
        allYears.add(y.year);
        // 作品がある季節のみ展開
        y.seasons.forEach(s => {
          if (s.animes.length > 0) {
            allSeasons.add(`${y.year}-${s.season}`);
          }
        });
      }
    });
    setExpandedYears(allYears);
    setExpandedSeasons(allSeasons);
  }, [yearSeasonData, setExpandedYears, setExpandedSeasons]);

  const collapseAll = useCallback(() => {
    setExpandedYears(new Set());
    setExpandedSeasons(new Set());
  }, [setExpandedYears, setExpandedSeasons]);

  // 作品があるクールのみを対象に展開状態を判定
  const isAllExpanded = useMemo(() => {
    const yearsWithAnimes = yearSeasonData.filter(y => 
      y.seasons.some(s => s.animes.length > 0)
    );
    const seasonsWithAnimes = yearsWithAnimes.flatMap(y => 
      y.seasons.filter(s => s.animes.length > 0).map(s => `${y.year}-${s.season}`)
    );
    
    return yearsWithAnimes.length > 0 &&
           yearsWithAnimes.every(y => expandedYears.has(y.year)) &&
           seasonsWithAnimes.every(key => expandedSeasons.has(key));
  }, [yearSeasonData, expandedYears, expandedSeasons]);

  // 年の展開切り替え
  const toggleYear = useCallback((year: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
      // 年を閉じたら、その年の季節も閉じる
      const newSeasons = new Set(expandedSeasons);
      yearSeasonData.find(y => y.year === year)?.seasons.forEach(s => {
        newSeasons.delete(`${year}-${s.season}`);
      });
      setExpandedSeasons(newSeasons);
    } else {
      newExpanded.add(year);
      // 年を開いたら、登録済みの作品がある季節も自動的に開く
      const newSeasons = new Set(expandedSeasons);
      const yearData = yearSeasonData.find(y => y.year === year);
      if (yearData) {
        yearData.seasons.forEach(s => {
          // 登録済みの作品がある季節のみ展開
          if (s.animes.length > 0) {
            newSeasons.add(`${year}-${s.season}`);
          }
        });
        setExpandedSeasons(newSeasons);
      }
    }
    setExpandedYears(newExpanded);
  }, [expandedYears, expandedSeasons, yearSeasonData, setExpandedYears, setExpandedSeasons]);

  // シーズンの作品を検索
  const searchSeasonAnimes = useCallback(async (year: string, season: string, forceRefresh: boolean = false) => {
    const key = `${year}-${season}`;
    if (!forceRefresh && (loadingSeasons.has(key) || seasonSearchResults.has(key))) {
      return Promise.resolve();
    }

    setLoadingSeasons(prev => new Set(prev).add(key));

    try {
      // 季節名をAniListの形式に変換
      const seasonMap: Record<string, 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER'> = {
        '春': 'SPRING',
        '夏': 'SUMMER',
        '秋': 'FALL',
        '冬': 'WINTER',
      };
      const anilistSeason = seasonMap[season];
      if (!anilistSeason) return Promise.resolve();

      const yearNum = parseInt(year, 10);
      const result = await searchAnimeBySeason(anilistSeason, yearNum, 1, 50);
      
      // 既に登録済みのアニメを除外
      const registeredTitles = new Set(
        allAnimes.map(a => a.title.toLowerCase().trim())
      );
      
      const filteredResults = result.media.filter((anime: AniListSearchResult) => {
        const titleNative = (anime.title?.native || '').toLowerCase().trim();
        const titleRomaji = (anime.title?.romaji || '').toLowerCase().trim();
        return !registeredTitles.has(titleNative) && !registeredTitles.has(titleRomaji);
      });
      
      setSeasonSearchResults(prev => {
        const newMap = new Map(prev);
        newMap.set(key, filteredResults);
        return newMap;
      });
      return Promise.resolve();
    } catch (error) {
      console.error('シーズンアニメ検索に失敗しました:', error);
      return Promise.resolve();
    } finally {
      setLoadingSeasons(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  }, [loadingSeasons, seasonSearchResults, allAnimes]);

  // 季節の展開切り替え
  const toggleSeason = useCallback((year: string, season: string) => {
    const key = `${year}-${season}`;
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
      // 未登録のシーズンの場合、検索を実行
      const yearData = yearSeasonData.find(y => y.year === year);
      const seasonData = yearData?.seasons.find(s => s.season === season);
      if (seasonData && seasonData.animes.length === 0 && !seasonSearchResults.has(key) && !loadingSeasons.has(key)) {
        // 検索を実行し、完了後に自動的に展開
        searchSeasonAnimes(year, season, false).then(() => {
          // 検索完了後、自動的に検索結果も展開
          setExpandedSeasonSearches(prev => new Set(prev).add(key));
        });
      } else if (seasonData && seasonData.animes.length === 0 && seasonSearchResults.has(key)) {
        // 既に検索結果がある場合は、自動的に展開
        setExpandedSeasonSearches(prev => new Set(prev).add(key));
      }
    }
    setExpandedSeasons(newExpanded);
  }, [expandedSeasons, setExpandedSeasons, yearSeasonData, seasonSearchResults, loadingSeasons, searchSeasonAnimes, setExpandedSeasonSearches]);

  // 検索結果から作品を追加
  const addAnimeFromSearch = useCallback(async (result: AniListSearchResult, year: string, season: string) => {
    try {
      // 必須フィールドの検証
      if (!result) {
        console.error('検索結果がnullまたはundefinedです');
        alert('アニメ情報が取得できませんでした');
        return;
      }

      const anilistId = result.id;
      if (!anilistId || typeof anilistId !== 'number' || isNaN(anilistId)) {
        console.error('無効なAniList ID:', anilistId, result);
        alert('アニメIDが無効です');
        return;
      }

      // 有効なIDのみを取得して最大値を計算
      const allAnimeIds = seasons.flatMap(s => s.animes).map(a => a.id).filter(id => typeof id === 'number' && !isNaN(id));
      const maxId = allAnimeIds.length > 0 ? Math.max(...allAnimeIds) : 0;
      const seasonName = `${year}年${season}`;
      
      // タイトルの取得
      const title = result.title?.native || result.title?.romaji || result.title?.english || 'タイトル不明';
      const seriesName = extractSeriesName(title);
      const image = result.coverImage?.large || result.coverImage?.medium || '🎬';
      
      console.log('Adding anime:', { anilistId, title, image, result, user: user ? 'logged in' : 'not logged in' });
      
      const newAnime: Anime = {
        id: maxId + 1,
        title: title,
        image: image,
        rating: 0,
        watched: false,
        rewatchCount: 1,
        tags: result.genres?.map((g: string) => translateGenre(g)).slice(0, 3) || [],
        seriesName,
        studios: result.studios?.nodes?.map((s) => s.name) || [],
      };

      // ログインしている場合はSupabaseに保存
      if (user) {
        const supabaseData = animeToSupabase(newAnime, seasonName, user.id);
        const { error } = await supabase
          .from('animes')
          .insert(supabaseData);

        if (error) {
          console.error('アニメの追加に失敗しました:', error);
          const errorMessage = error.message || '不明なエラー';
          alert(`アニメの追加に失敗しました${errorMessage !== '不明なエラー' ? `: ${errorMessage}` : ''}`);
          return;
        }
      }
      // ログインしていない場合はローカルストレージに保存（useAnimeDataフックが自動的に処理）

      // ローカル状態を更新
      const existingSeasonIndex = seasons.findIndex(s => s.name === seasonName);
      let updatedSeasons: Season[];

      if (existingSeasonIndex === -1) {
        updatedSeasons = [...seasons, { name: seasonName, animes: [newAnime] }];
      } else {
        updatedSeasons = seasons.map((s, index) =>
          index === existingSeasonIndex
            ? { ...s, animes: [...s.animes, newAnime] }
            : s
        );
      }

      updatedSeasons = sortSeasonsByTime(updatedSeasons);
      setSeasons(updatedSeasons);

      // 検索結果から削除（追加したアニメを検索結果から除外）
      const key = `${year}-${season}`;
      setSeasonSearchResults(prev => {
        const newMap = new Map(prev);
        const results = newMap.get(key) || [];
        const titleNative = (result.title?.native || '').toLowerCase().trim();
        const titleRomaji = (result.title?.romaji || '').toLowerCase().trim();
        const filteredResults = results.filter((r: AniListSearchResult) => {
          const rTitleNative = (r.title?.native || '').toLowerCase().trim();
          const rTitleRomaji = (r.title?.romaji || '').toLowerCase().trim();
          return r.id !== result.id && 
                 rTitleNative !== titleNative && 
                 rTitleRomaji !== titleRomaji &&
                 rTitleNative !== titleRomaji &&
                 rTitleRomaji !== titleNative;
        });
        newMap.set(key, filteredResults);
        
        // 未登録シーズンのみ表示モードで、検索結果が空になった場合、次の未登録シーズンに自動移動
        // この機能は後で実装（yearSeasonDataの依存関係を避けるため）
        
        return newMap;
      });
    } catch (error) {
      console.error('検索結果からのアニメ追加に失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      alert(`アニメの追加に失敗しました${errorMessage !== '不明なエラー' ? `: ${errorMessage}` : ''}`);
    }
  }, [user, seasons, setSeasons, extractSeriesName, animeToSupabase]);

  // 積みアニメに追加
  const addToWatchlistFromSearch = useCallback(async (result: AniListSearchResult, year?: string, season?: string) => {
    try {
      // resultオブジェクトが正しく渡されているか確認
      if (!result) {
        console.error('検索結果がnullまたはundefinedです');
        alert('アニメ情報が取得できませんでした');
        return;
      }

      const anilistId = result.id;
      if (!anilistId || typeof anilistId !== 'number' || isNaN(anilistId)) {
        console.error('無効なAniList ID:', anilistId, result);
        alert('アニメIDが無効です');
        return;
      }

      // タイトルの取得
      const title = result.title?.native || result.title?.romaji || result.title?.english || 'タイトル不明';
      const image = result.coverImage?.large || result.coverImage?.medium || null;

      console.log('Adding to watchlist:', { anilistId, title, image });

      const success = await storage.addToWatchlist({
        anilist_id: anilistId,
        title: title,
        image: image,
      });

      if (success) {
        // 追加済みIDを更新
        setAddedToWatchlistIds(prev => new Set(prev).add(anilistId));
        // 積みアニメリストを再読み込み
        const updatedWatchlist = await storage.getWatchlist();
        setAddedToWatchlistIds(new Set(updatedWatchlist.map(item => item.anilist_id).filter(id => id !== -1 && id !== null && id !== undefined)));
        // 検索結果から削除（追加したアニメを検索結果から除外）
        if (year && season) {
          const key = `${year}-${season}`;
          setSeasonSearchResults(prev => {
            const newMap = new Map(prev);
            const results = newMap.get(key) || [];
            const titleNative = (title || '').toLowerCase().trim();
            newMap.set(key, results.filter((r: any) => {
              const rTitleNative = (r.title?.native || r.title?.romaji || r.title?.english || '').toLowerCase().trim();
              return r.id !== anilistId && rTitleNative !== titleNative;
            }));
            return newMap;
          });
        }
      } else {
        alert('積みアニメの追加に失敗しました');
      }
    } catch (error) {
      console.error('積みアニメへの追加に失敗しました:', error);
      alert(`積みアニメの追加に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }, [storage]);

  // 来期の視聴予定に追加
  const addToNextSeasonWatchlist = useCallback(async (result: AniListSearchResult) => {
    try {
      if (!result || !result.id) {
        console.error('無効な検索結果オブジェクト:', result);
        alert('アニメ情報の取得に失敗しました');
        return;
      }

      const nextSeason = getNextSeason();
      // 放送情報を取得
      const broadcastInfo = getBroadcastInfo(result);
      
      const success = await storage.addToWatchlist({
        anilist_id: result.id,
        title: result.title?.native || result.title?.romaji || '',
        image: result.coverImage?.large || null,
        status: 'planned',
        season_year: nextSeason.year,
        season: nextSeason.season,
        broadcast_day: broadcastInfo.day,
        broadcast_time: broadcastInfo.time,
      });

      if (success) {
        // 追加済みIDを更新
        setAddedToWatchlistIds(prev => new Set(prev).add(result.id));
        alert('来期の視聴予定に追加しました');
      } else {
        alert('視聴予定の追加に失敗しました');
      }
    } catch (error) {
      console.error('来期積みアニメへの追加に失敗しました:', error);
      alert('視聴予定の追加に失敗しました');
    }
  }, [storage]);

  // フィルター後の統計
  const filteredStats = useMemo(() => {
    const filteredAnimes = allAnimes.filter(filterAnime);
    return {
      count: filteredAnimes.length,
      totalCount: allAnimes.length,
    };
  }, [allAnimes, filterAnime]);

  return (
    <>
      {/* サブタブ */}
      <div className="flex gap-2 md:gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'seasons', label: 'クール別' },
          { id: 'watchlist', label: '積みアニメ' },
          { id: 'current-season', label: '来期視聴予定' },
          { id: 'series', label: 'シリーズ' },
          { id: 'gallery', label: 'ギャラリー' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setHomeSubTab(tab.id as typeof homeSubTab)}
            className={`px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap transition-all ${
              homeSubTab === tab.id
                ? 'bg-[#e879d4] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {homeSubTab === 'seasons' && (
        <>
          {/* 統計カード */}
          <div 
            className="rounded-2xl p-5 text-white mb-6 relative"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 35%, #e879d4 65%, #f093fb 100%)'
            }}
          >
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

          {/* コントロールバー */}
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <button 
              onClick={onOpenAddForm}
              className="py-3 px-6 border-2 border-dashed border-[#e879d4] rounded-xl text-[#e879d4] font-bold hover:border-[#d45dbf] hover:text-[#d45dbf] hover:bg-[#e879d4]/5 transition-colors"
            >
              + アニメを追加
            </button>
            
            <div className="flex items-center gap-2">
              {/* フィルター */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
              >
                <option value="all">すべて</option>
                <option value="unrated">未評価</option>
                <option value="unwatched">周回未登録</option>
              </select>
              
              {/* 未登録のクールも含めて表示するトグル */}
              <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAllSeasons}
                  onChange={(e) => {
                    setShowAllSeasons(e.target.checked);
                    if (!e.target.checked) {
                      setShowUnregisteredOnly(false);
                    }
                  }}
                  className="w-4 h-4 text-[#e879d4] rounded focus:ring-[#e879d4]"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  未登録のクールも含めて表示
                </span>
              </label>
              
              {/* 未登録シーズンのみ表示トグル */}
              {showAllSeasons && (
                <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnregisteredOnly}
                    onChange={(e) => setShowUnregisteredOnly(e.target.checked)}
                    className="w-4 h-4 text-[#e879d4] rounded focus:ring-[#e879d4]"
                  />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    未登録シーズンのみ表示
                  </span>
                </label>
              )}
              
              {/* 全展開/全折りたたみ（上部ヘッダーに移動） */}
              <button
                onClick={isAllExpanded ? collapseAll : expandAll}
                className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-600 dark:text-gray-300"
              >
                {isAllExpanded ? '全て折りたたむ' : '全て展開'}
              </button>
            </div>
          </div>

          {/* フィルター適用中の表示 */}
          {filter !== 'all' && (
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {filteredStats.count} / {filteredStats.totalCount} 作品を表示中
            </div>
          )}

          {/* 年別リスト */}
          <div className="space-y-3 relative">
            {yearSeasonData.map(({ year, seasons: yearSeasons, allAnimes }) => (
              <div key={year} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <YearHeader
                  year={year}
                  animes={allAnimes}
                  isExpanded={expandedYears.has(year)}
                  onToggle={() => toggleYear(year)}
                />
                
                {expandedYears.has(year) && (
                  <div className="px-2 pb-3 space-y-2">
                    {yearSeasons.map(({ season, animes }) => {
                      const seasonKey = `${year}-${season}`;
                      const isEmpty = animes.length === 0;
                      const isExpanded = expandedSeasons.has(seasonKey);
                      const searchResults = seasonSearchResults.get(seasonKey) || [];
                      const isLoading = loadingSeasons.has(seasonKey);
                      const isSearchExpanded = expandedSeasonSearches.has(seasonKey);
                      
                      return (
                        <div key={seasonKey}>
                          <SeasonHeader
                            season={season}
                            animes={animes}
                            isExpanded={isExpanded}
                            onToggle={() => toggleSeason(year, season)}
                            isEmpty={isEmpty}
                            onSearch={!isEmpty ? () => {
                              // 登録済みクールの検索
                              if (!seasonSearchResults.has(seasonKey) && !loadingSeasons.has(seasonKey)) {
                                searchSeasonAnimes(year, season, false).then(() => {
                                  setExpandedSeasonSearches(prev => new Set(prev).add(seasonKey));
                                });
                              } else if (seasonSearchResults.has(seasonKey)) {
                                // 既に検索結果がある場合は展開
                                setExpandedSeasonSearches(prev => new Set(prev).add(seasonKey));
                              }
                            } : undefined}
                          />
                          
                          {isExpanded && (
                            <>
                              {/* 登録済み作品の表示 */}
                              {animes.length > 0 && (
                                <>
                                  <div className="ml-8 mt-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-2">
                                    {animes.map((anime, index) => (
                                      <AnimeCard 
                                        key={anime.id && typeof anime.id === 'number' && !isNaN(anime.id) ? anime.id : `anime-${year}-${season}-${index}`} 
                                        anime={anime}
                                        onClick={() => setSelectedAnime(anime)}
                                      />
                                    ))}
                                  </div>
                                  
                                  {/* 登録済みクールの検索結果表示 */}
                                  {isSearchExpanded && (
                                    <div className="ml-8 mt-4 px-2">
                                      {searchResults.length > 0 ? (
                                        <SearchResultsSection
                                          searchResults={searchResults}
                                          seasonKey={seasonKey}
                                          expandedSeasons={expandedSeasons}
                                          setExpandedSeasons={setExpandedSeasons}
                                          expandedSeasonSearches={expandedSeasonSearches}
                                          setExpandedSeasonSearches={setExpandedSeasonSearches}
                                          addedToWatchlistIds={addedToWatchlistIds}
                                          addAnimeFromSearch={addAnimeFromSearch}
                                          addToWatchlistFromSearch={addToWatchlistFromSearch}
                                          addToNextSeasonWatchlist={addToNextSeasonWatchlist}
                                          year={year}
                                          season={season}
                                        />
                                      ) : (
                                        <div className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                          このクールの他の作品が見つかりませんでした
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {/* 未登録シーズンの検索結果表示 */}
                              {isEmpty && (
                                <div className="ml-8 mt-2 px-2">
                                  {isLoading ? (
                                    <div className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                      作品を検索中...
                                    </div>
                                  ) : searchResults.length > 0 ? (
                                    <SearchResultsSection
                                      searchResults={searchResults}
                                      seasonKey={seasonKey}
                                      expandedSeasons={expandedSeasons}
                                      setExpandedSeasons={setExpandedSeasons}
                                      expandedSeasonSearches={expandedSeasonSearches}
                                      setExpandedSeasonSearches={setExpandedSeasonSearches}
                                      addedToWatchlistIds={addedToWatchlistIds}
                                      addAnimeFromSearch={addAnimeFromSearch}
                                      addToWatchlistFromSearch={addToWatchlistFromSearch}
                                      addToNextSeasonWatchlist={addToNextSeasonWatchlist}
                                      year={year}
                                      season={season}
                                    />
                                  ) : (
                                    <div className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                      作品が見つかりませんでした
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 作品がない場合 */}
          {yearSeasonData.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {filter !== 'all' ? '該当する作品がありません' : 'アニメが登録されていません'}
            </p>
          )}
        </>
      )}

      {homeSubTab === 'series' && (
        <SeriesView seasons={seasons} setSelectedAnime={setSelectedAnime} onOpenAddForm={onOpenAddForm} />
      )}

      {homeSubTab === 'gallery' && (
        <GalleryTab
          allAnimes={allAnimes}
          setSelectedAnime={setSelectedAnime}
        />
      )}

      {homeSubTab === 'watchlist' && (
        <WatchlistTab
          setSelectedAnime={setSelectedAnime}
          onOpenAddForm={onOpenAddForm}
          user={user}
          seasons={seasons}
          setSeasons={setSeasons}
          expandedSeasons={expandedSeasons}
          setExpandedSeasons={setExpandedSeasons}
        />
      )}

      {homeSubTab === 'current-season' && (
        <SeasonWatchlistTab />
      )}
    </>
  );
}

// シリーズビューコンポーネント（計算をメモ化）
function SeriesView({ 
  seasons, 
  setSelectedAnime,
  onOpenAddForm
}: { 
  seasons: Season[]; 
  setSelectedAnime: (anime: Anime | null) => void;
  onOpenAddForm: () => void;
}) {
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [expandedStandalone, setExpandedStandalone] = useState(false);
  const [suggestedSeasons, setSuggestedSeasons] = useState<Map<string, any[]>>(new Map());
  const [loadingSuggestions, setLoadingSuggestions] = useState<Set<string>>(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(() => {
    // localStorageから非表示にした提案を読み込む
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dismissedAnimeSuggestions');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    }
    return new Set<string>();
  });

  // タイトルから期数を取得する関数
  const getSeasonNumber = (title: string): number | null => {
    const patterns = [
      /第(\d+)期/,
      /第(\d+)シーズン/i,
      /(\d+)期/,
      /Season\s*(\d+)/i,
      /S(\d+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    
    return null;
  };

  // シリーズごとのグループ化とソートをメモ化
  const { seriesArray, standaloneAnimes } = useMemo(() => {
    // すべてのアニメを取得
    const allAnimes = seasons.flatMap(s => s.animes);
    
    // シリーズごとにグループ化
    const seriesMap = new Map<string, Anime[]>();
    const standalone: Anime[] = [];
    
    allAnimes.forEach(anime => {
      if (anime.seriesName) {
        if (!seriesMap.has(anime.seriesName)) {
          seriesMap.set(anime.seriesName, []);
        }
        seriesMap.get(anime.seriesName)!.push(anime);
      } else {
        standalone.push(anime);
      }
    });
    
    // 1作品のみのシリーズは単発作品に移動
    const filteredSeriesMap = new Map<string, Anime[]>();
    seriesMap.forEach((animes, seriesName) => {
      if (animes.length > 1) {
        filteredSeriesMap.set(seriesName, animes);
      } else {
        standalone.push(...animes);
      }
    });
    
    // シリーズ内を時系列順にソート（期数とシーズン名から判断）
    filteredSeriesMap.forEach((animes) => {
      animes.sort((a, b) => {
        // 期数でソート
        const aSeasonNum = getSeasonNumber(a.title);
        const bSeasonNum = getSeasonNumber(b.title);
        
        if (aSeasonNum !== null && bSeasonNum !== null) {
          return aSeasonNum - bSeasonNum;
        }
        if (aSeasonNum !== null) return -1;
        if (bSeasonNum !== null) return 1;
        
        // 期数がない場合はシーズン名でソート
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
    
    return {
      seriesArray: Array.from(filteredSeriesMap.entries()),
      standaloneAnimes: standalone,
    };
  }, [seasons]);

  // 未登録シーズンの提案を取得
  const fetchSuggestions = async (seriesName: string, registeredTitles: Set<string>) => {
    if (loadingSuggestions.has(seriesName) || suggestedSeasons.has(seriesName)) {
      return;
    }

    setLoadingSuggestions(prev => new Set(prev).add(seriesName));

    try {
      const { searchAnime } = await import('../../lib/anilist');
      const results = await searchAnime(seriesName);
      
      // 登録済みでない作品をフィルタリング（タイトルで比較）
      const unregistered = results.filter((anime: AniListSearchResult) => {
        const animeId = anime.id.toString();
        // 非表示にした提案を除外
        if (dismissedSuggestions.has(animeId)) {
          return false;
        }
        
        const titleRomaji = anime.title?.romaji?.toLowerCase() || '';
        const titleNative = anime.title?.native?.toLowerCase() || '';
        
        // 登録済みタイトルと比較
        return !Array.from(registeredTitles).some(registeredTitle => {
          const lowerRegistered = registeredTitle.toLowerCase();
          return titleRomaji.includes(lowerRegistered) || 
                 titleNative.includes(lowerRegistered) ||
                 lowerRegistered.includes(titleRomaji) ||
                 lowerRegistered.includes(titleNative);
        });
      });

      if (unregistered.length > 0) {
        setSuggestedSeasons(prev => {
          const newMap = new Map(prev);
          newMap.set(seriesName, unregistered);
          return newMap;
        });
      }
    } catch (error) {
      console.error('提案の取得に失敗しました:', error);
    } finally {
      setLoadingSuggestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(seriesName);
        return newSet;
      });
    }
  };

  const toggleSeries = (seriesName: string, registeredTitles: Set<string>) => {
    const newExpanded = new Set(expandedSeries);
    if (newExpanded.has(seriesName)) {
      newExpanded.delete(seriesName);
    } else {
      newExpanded.add(seriesName);
      // 展開時に提案を取得
      fetchSuggestions(seriesName, registeredTitles);
    }
    setExpandedSeries(newExpanded);
  };

  // 提案を非表示にする
  const dismissSuggestion = (animeId: string) => {
    const newDismissed = new Set(dismissedSuggestions);
    newDismissed.add(animeId);
    setDismissedSuggestions(newDismissed);
    
    // localStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissedAnimeSuggestions', JSON.stringify(Array.from(newDismissed)));
    }
    
    // 提案リストから削除
    setSuggestedSeasons(prev => {
      const newMap = new Map(prev);
      newMap.forEach((suggestions, key) => {
        const filtered = suggestions.filter((s: AniListSearchResult) => s.id.toString() !== animeId);
        if (filtered.length === 0) {
          newMap.delete(key);
        } else {
          newMap.set(key, filtered);
        }
      });
      return newMap;
    });
  };

  return (
    <div className="space-y-6">
      {/* シリーズ一覧 */}
      {seriesArray.map(([seriesName, animes]) => {
        const isExpanded = expandedSeries.has(seriesName);
        const registeredTitles = new Set(animes.map(a => a.title));
        const suggestions = suggestedSeasons.get(seriesName) || [];
        const isLoading = loadingSuggestions.has(seriesName);

        return (
          <div key={seriesName} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
            <button
              onClick={() => toggleSeries(seriesName, registeredTitles)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">
                  {isExpanded ? '▼' : '▶'}
                </span>
                <h2 className="text-xl font-bold dark:text-white">{seriesName}</h2>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                全{animes.length}作品
              </span>
            </button>
            
            {isExpanded && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {animes.map((anime, index) => {
                    const seasonNum = getSeasonNumber(anime.title);
                    return (
                      <div key={anime.id} className="relative">
                        {seasonNum !== null && (
                          <div className="absolute -top-1 -right-1 bg-[#e879d4] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                            第{seasonNum}期
                          </div>
                        )}
                        <AnimeCard anime={anime} onClick={() => setSelectedAnime(anime)} />
                      </div>
                    );
                  })}
                </div>

                {/* 未登録シーズンの提案 */}
                {suggestions.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      このシリーズの他の作品が見つかりました
                    </p>
                    <div className="space-y-2">
                      {suggestions.slice(0, 3).map((suggestion: AniListSearchResult) => (
                        <div
                          key={suggestion.id}
                          className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => {
                            onOpenAddForm();
                            // ここで選択された作品の情報をAddAnimeFormModalに渡す必要がある
                            // 現時点ではモーダルを開くだけ
                          }}
                        >
                          {suggestion.coverImage?.medium && (
                            <img
                              src={suggestion.coverImage.medium}
                              alt={suggestion.title.romaji || suggestion.title.native || ''}
                              className="w-12 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {suggestion.title.romaji || suggestion.title.native}
                            </p>
                            {suggestion.seasonYear && suggestion.season && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {suggestion.seasonYear}年{suggestion.season === 'SPRING' ? '春' : suggestion.season === 'SUMMER' ? '夏' : suggestion.season === 'FALL' ? '秋' : '冬'}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissSuggestion(suggestion.id.toString());
                              }}
                              className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                              title="間違っている"
                            >
                              ×
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAddForm();
                              }}
                              className="px-3 py-1 text-xs bg-[#e879d4] text-white rounded hover:bg-[#d45dbf] transition-colors"
                            >
                              追加
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isLoading && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      他の作品を検索中...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* 単発作品 */}
      {standaloneAnimes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
          <button
            onClick={() => setExpandedStandalone(!expandedStandalone)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">
                {expandedStandalone ? '▼' : '▶'}
              </span>
              <h2 className="text-xl font-bold dark:text-white">単発作品</h2>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              全{standaloneAnimes.length}作品
            </span>
          </button>
          
          {expandedStandalone && (
            <div className="px-4 pb-4">
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
        </div>
      )}
      
      {seriesArray.length === 0 && standaloneAnimes.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          アニメが登録されていません
        </p>
      )}
    </div>
  );
}

// 検索結果セクションコンポーネント
function SearchResultsSection({
  searchResults,
  seasonKey,
  expandedSeasons,
  setExpandedSeasons,
  expandedSeasonSearches,
  setExpandedSeasonSearches,
  addedToWatchlistIds,
  addAnimeFromSearch,
  addToWatchlistFromSearch,
  addToNextSeasonWatchlist,
  year,
  season,
}: {
  searchResults: AniListSearchResult[];
  seasonKey: string;
  expandedSeasons: Set<string>;
  setExpandedSeasons: (seasons: Set<string>) => void;
  expandedSeasonSearches: Set<string>;
  setExpandedSeasonSearches: (searches: Set<string>) => void;
  addedToWatchlistIds: Set<number>;
  addAnimeFromSearch: (result: AniListSearchResult, year: string, season: string) => Promise<void>;
  addToWatchlistFromSearch: (result: AniListSearchResult, year?: string, season?: string) => Promise<void>;
  addToNextSeasonWatchlist: (result: AniListSearchResult) => Promise<void>;
  year: string;
  season: string;
}) {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  
  const handleClose = useCallback(() => {
    const newExpandedSeasons = new Set(expandedSeasons);
    newExpandedSeasons.delete(seasonKey);
    setExpandedSeasons(newExpandedSeasons);
    const newExpandedSearches = new Set(expandedSeasonSearches);
    newExpandedSearches.delete(seasonKey);
    setExpandedSeasonSearches(newExpandedSearches);
  }, [seasonKey, expandedSeasons, setExpandedSeasons, expandedSeasonSearches, setExpandedSeasonSearches]);

  return (
    <div className="relative">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 pb-2 mb-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {searchResults.length}件の作品が見つかりました
          </p>
          <button
            onClick={handleClose}
            className="px-3 py-1.5 bg-[#e879d4] text-white text-xs font-medium rounded-lg hover:bg-[#f09fe3] transition-colors shadow-md"
          >
            閉じる
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-4">
        {searchResults.map((result: AniListSearchResult) => {
          const anilistId = result?.id;
          const isValidId = anilistId && typeof anilistId === 'number' && !isNaN(anilistId);
          const isLoading = loadingIds.has(anilistId);
          const title = result?.title?.native || result?.title?.romaji || result?.title?.english || 'タイトル不明';
          const imageUrl = result?.coverImage?.large || result?.coverImage?.medium;
          
          // 無効なIDの場合はスキップ
          if (!isValidId) {
            console.warn('Invalid anime data:', result);
            return null;
          }

          return (
            <div
              key={anilistId}
              className="relative group"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full aspect-[2/3] object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-gradient-to-br from-[#e879d4] to-[#764ba2] rounded-lg flex items-center justify-center text-4xl">
                  🎬
                </div>
              )}
              <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
                {title}
              </p>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isLoading) return;
                  
                  console.log('Add anime clicked:', { anilistId, title, result });
                  setLoadingIds(prev => new Set(prev).add(anilistId));
                  try {
                    await addAnimeFromSearch(result, year, season);
                  } catch (error) {
                    console.error('アニメの追加に失敗しました:', error);
                  } finally {
                    setLoadingIds(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(anilistId);
                      return newSet;
                    });
                  }
                }}
                disabled={isLoading}
                className="mt-2 w-full px-2 py-1 text-xs font-medium bg-[#e879d4] text-white rounded hover:bg-[#d45dbf] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '追加中...' : '追加'}
              </button>
              <div className="mt-1 space-y-1">
                {addedToWatchlistIds.has(anilistId) ? (
                  <button
                    disabled
                    className="w-full px-2 py-1 text-xs font-medium bg-gray-400 text-white rounded cursor-not-allowed"
                  >
                    積みアニメに追加済み
                  </button>
                ) : (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isLoading) return;
                      
                      console.log('Add to watchlist clicked:', { anilistId, title, result });
                      setLoadingIds(prev => new Set(prev).add(anilistId));
                      try {
                        await addToWatchlistFromSearch(result, year, season);
                      } catch (error) {
                        console.error('積みアニメへの追加に失敗しました:', error);
                      } finally {
                        setLoadingIds(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(anilistId);
                          return newSet;
                        });
                      }
                    }}
                    disabled={isLoading}
                    className="w-full px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '追加中...' : '積みアニメに追加'}
                  </button>
                )}
                {(() => {
                  // 検索結果のアニメが来期シーズンかどうかを判定
                  const seasonYear = parseInt(year, 10);
                  const seasonEnum = season as 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
                  const isNext = isNextSeason(seasonYear, seasonEnum);
                  
                  if (!isNext) return null;
                  
                  return (
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isLoading) return;
                        
                        console.log('Add to next season watchlist clicked:', { anilistId, title, result });
                        setLoadingIds(prev => new Set(prev).add(anilistId));
                        try {
                          await addToNextSeasonWatchlist(result);
                        } catch (error) {
                          console.error('来期積みアニメへの追加に失敗しました:', error);
                        } finally {
                          setLoadingIds(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(anilistId);
                            return newSet;
                          });
                        }
                      }}
                      disabled={isLoading}
                      className="w-full px-2 py-1 text-xs font-medium bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? '追加中...' : '視聴予定に追加'}
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
      {/* 検索結果エリアの右下にstickyで「閉じる」ボタン */}
      <div className="sticky bottom-4 flex justify-end z-10">
        <button
          onClick={handleClose}
          className="bg-gray-800 dark:bg-slate-700 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-slate-600 transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
