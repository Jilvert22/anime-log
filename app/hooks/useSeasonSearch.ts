import { useState, useCallback, useEffect } from 'react';
import type { Anime, Season, User } from '../types';
import { translateGenre, sortSeasonsByTime, getNextSeason, JA_TO_SEASON } from '../utils/helpers';
import { getBroadcastInfo } from '../lib/api/anilist';
import { insertAnime } from '../lib/api/animes';
import { useStorage } from './useStorage';
import { useAnimeSearchWithStreaming } from './useAnimeSearchWithStreaming';
import type { WatchlistItem } from '../lib/storage/types';
import type { AniListMediaWithStreaming } from '../lib/api/annict';
import { getStartSeason } from '../utils/continuingAnime';

interface UseSeasonSearchParams {
  allAnimes: Anime[];
  seasons: Season[];
  setSeasons: (seasons: Season[]) => void;
  user: User | null;
  extractSeriesName: (title: string) => string | undefined;
}

export function useSeasonSearch({
  allAnimes,
  seasons,
  setSeasons,
  user,
  extractSeriesName,
}: UseSeasonSearchParams) {
  const [seasonSearchResults, setSeasonSearchResults] = useState<
    Map<string, AniListMediaWithStreaming[]>
  >(new Map());
  const [loadingSeasons, setLoadingSeasons] = useState<Set<string>>(new Set());
  const [expandedSeasonSearches, setExpandedSeasonSearches] = useState<Set<string>>(new Set());
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [addedToWatchlistIds, setAddedToWatchlistIds] = useState<Set<number>>(new Set());

  const storage = useStorage();
  const { searchBySeason } = useAnimeSearchWithStreaming();

  // 積みアニメリストを読み込む
  const loadWatchlist = useCallback(async () => {
    try {
      const items = await storage.getWatchlist();
      setWatchlistItems(items);
      setAddedToWatchlistIds(
        new Set(
          items
            .map((item) => item.anilist_id)
            .filter((id) => id !== -1 && id !== null && id !== undefined)
        )
      );
    } catch (error) {
      console.error('積みアニメの読み込みに失敗しました:', error);
      setWatchlistItems([]);
      setAddedToWatchlistIds(new Set());
    }
  }, [storage]);

  // コンポーネントマウント時に積みアニメを読み込む
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // シーズンの作品を検索（配信情報付き）
  const searchSeasonAnimes = useCallback(
    async (year: string, season: string, forceRefresh: boolean = false) => {
      const key = `${year}-${season}`;
      if (!forceRefresh && (loadingSeasons.has(key) || seasonSearchResults.has(key))) {
        return Promise.resolve();
      }

      setLoadingSeasons((prev) => new Set(prev).add(key));

      try {
        // 季節名をAniListの形式に変換
        const anilistSeason = JA_TO_SEASON[season];
        if (!anilistSeason) return Promise.resolve();

        const yearNum = parseInt(year, 10);
        // useAnimeSearchWithStreamingを使用して配信情報付きで検索
        const results = await searchBySeason(anilistSeason, yearNum, 1, 50);

        // 既に登録済みのアニメを除外
        const registeredTitles = new Set(allAnimes.map((a) => a.title.toLowerCase().trim()));

        const filteredResults = results.filter((anime: AniListMediaWithStreaming) => {
          const titleNative = (anime.title?.native || '').toLowerCase().trim();
          const titleRomaji = (anime.title?.romaji || '').toLowerCase().trim();
          return !registeredTitles.has(titleNative) && !registeredTitles.has(titleRomaji);
        });

        setSeasonSearchResults((prev) => {
          const newMap = new Map(prev);
          newMap.set(key, filteredResults);
          return newMap;
        });
        return Promise.resolve();
      } catch (error) {
        console.error('シーズンアニメ検索に失敗しました:', error);
        return Promise.resolve();
      } finally {
        setLoadingSeasons((prev) => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }
    },
    [loadingSeasons, seasonSearchResults, allAnimes, searchBySeason]
  );

  // 登録済みクールの検索ハンドラー（useCallbackでメモ化）
  const handleSeasonSearch = useCallback(
    (year: string, season: string) => {
      const seasonKey = `${year}-${season}`;
      // 登録済みクールの検索
      if (!seasonSearchResults.has(seasonKey) && !loadingSeasons.has(seasonKey)) {
        searchSeasonAnimes(year, season, false).then(() => {
          setExpandedSeasonSearches((prev) => new Set(prev).add(seasonKey));
        });
      } else if (seasonSearchResults.has(seasonKey)) {
        // 既に検索結果がある場合は展開
        setExpandedSeasonSearches((prev) => new Set(prev).add(seasonKey));
      }
    },
    [seasonSearchResults, loadingSeasons, searchSeasonAnimes, setExpandedSeasonSearches]
  );

  // 検索結果から作品を追加
  const addAnimeFromSearch = useCallback(
    async (result: AniListMediaWithStreaming, year: string, season: string) => {
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
        const allAnimeIds = seasons
          .flatMap((s) => s.animes)
          .map((a) => a.id)
          .filter((id) => typeof id === 'number' && !isNaN(id));
        const maxId = allAnimeIds.length > 0 ? Math.max(...allAnimeIds) : 0;
        const seasonName = `${year}年${season}`;

        // タイトルの取得
        const title =
          result.title?.native || result.title?.romaji || result.title?.english || 'タイトル不明';
        const seriesName = extractSeriesName(title);
        const image = result.coverImage?.large || result.coverImage?.medium || '🎬';

        console.log('Adding anime:', {
          anilistId,
          title,
          image,
          result,
          user: user ? 'logged in' : 'not logged in',
        });

        const newAnime: Anime = {
          id: maxId + 1,
          anilistId,
          title: title,
          image: image,
          rating: 0,
          watched: false,
          rewatchCount: 1,
          tags: result.genres?.map((g: string) => translateGenre(g)).slice(0, 3) || [],
          seriesName,
          studios: result.studios?.nodes?.map((s) => s.name) || [],
          streamingSites: result.streamingServices || [],
        };

        // ログインしている場合はSupabaseに保存
        if (user) {
          try {
            await insertAnime(newAnime, seasonName, user.id);
          } catch (error) {
            console.error('アニメの追加に失敗しました:', error);
            const errorMessage = error instanceof Error ? error.message : '不明なエラー';
            alert(
              `アニメの追加に失敗しました${errorMessage !== '不明なエラー' ? `: ${errorMessage}` : ''}`
            );
            return;
          }
        }
        // ログインしていない場合はローカルストレージに保存（useAnimeDataフックが自動的に処理）

        // ローカル状態を更新
        const existingSeasonIndex = seasons.findIndex((s) => s.name === seasonName);
        let updatedSeasons: Season[];

        if (existingSeasonIndex === -1) {
          updatedSeasons = [...seasons, { name: seasonName, animes: [newAnime] }];
        } else {
          updatedSeasons = seasons.map((s, index) =>
            index === existingSeasonIndex ? { ...s, animes: [...s.animes, newAnime] } : s
          );
        }

        updatedSeasons = sortSeasonsByTime(updatedSeasons);
        setSeasons(updatedSeasons);

        // 検索結果から削除（追加したアニメを検索結果から除外）
        const key = `${year}-${season}`;
        setSeasonSearchResults((prev) => {
          const newMap = new Map(prev);
          const results = newMap.get(key) || [];
          const titleNative = (result.title?.native || '').toLowerCase().trim();
          const titleRomaji = (result.title?.romaji || '').toLowerCase().trim();
          const filteredResults = results.filter((r: AniListMediaWithStreaming) => {
            const rTitleNative = (r.title?.native || '').toLowerCase().trim();
            const rTitleRomaji = (r.title?.romaji || '').toLowerCase().trim();
            return (
              r.id !== result.id &&
              rTitleNative !== titleNative &&
              rTitleRomaji !== titleRomaji &&
              rTitleNative !== titleRomaji &&
              rTitleRomaji !== titleNative
            );
          });
          newMap.set(key, filteredResults);

          return newMap;
        });
      } catch (error) {
        console.error('検索結果からのアニメ追加に失敗しました:', error);
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        alert(
          `アニメの追加に失敗しました${errorMessage !== '不明なエラー' ? `: ${errorMessage}` : ''}`
        );
      }
    },
    [user, seasons, setSeasons, extractSeriesName, setSeasonSearchResults]
  );

  // 積みアニメに追加
  const addToWatchlistFromSearch = useCallback(
    async (result: AniListMediaWithStreaming, year?: string, season?: string) => {
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
        const title =
          result.title?.native || result.title?.romaji || result.title?.english || 'タイトル不明';
        const image = result.coverImage?.large || result.coverImage?.medium || null;

        console.log('Adding to watchlist:', { anilistId, title, image });

        const success = await storage.addToWatchlist({
          anilist_id: anilistId,
          title: title,
          image: image,
          streaming_sites: result.streamingServices || null,
        });

        if (success) {
          // 追加済みIDを更新
          setAddedToWatchlistIds((prev) => new Set(prev).add(anilistId));
          // 積みアニメリストを再読み込み
          const updatedWatchlist = await storage.getWatchlist();
          setAddedToWatchlistIds(
            new Set(
              updatedWatchlist
                .map((item) => item.anilist_id)
                .filter((id) => id !== -1 && id !== null && id !== undefined)
            )
          );
          // 検索結果から削除（追加したアニメを検索結果から除外）
          if (year && season) {
            const key = `${year}-${season}`;
            setSeasonSearchResults((prev) => {
              const newMap = new Map(prev);
              const results = newMap.get(key) || [];
              const titleNative = (title || '').toLowerCase().trim();
              newMap.set(
                key,
                results.filter((r: AniListMediaWithStreaming) => {
                  const rTitleNative = (
                    r.title?.native ||
                    r.title?.romaji ||
                    r.title?.english ||
                    ''
                  )
                    .toLowerCase()
                    .trim();
                  return r.id !== anilistId && rTitleNative !== titleNative;
                })
              );
              return newMap;
            });
          }
        } else {
          alert('積みアニメの追加に失敗しました');
        }
      } catch (error) {
        console.error('積みアニメへの追加に失敗しました:', error);
        alert(
          `積みアニメの追加に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
        );
      }
    },
    [storage, setSeasonSearchResults, setAddedToWatchlistIds]
  );

  // 来期の視聴予定に追加
  const addToNextSeasonWatchlist = useCallback(
    async (result: AniListMediaWithStreaming) => {
      try {
        if (!result || !result.id) {
          console.error('無効な検索結果オブジェクト:', result);
          alert('アニメ情報の取得に失敗しました');
          return;
        }

        const nextSeason = getNextSeason();
        // 放送情報を取得
        const broadcastInfo = getBroadcastInfo(result);

        // 作品の開始期で保存 (v1設計: オリジナル開始シーズン基準)。
        // 連続2クール作品で「来期から追加」した場合、AniList上の開始期は前期になる。
        // AniListに開始期情報がなければ来期にフォールバック。
        const start = getStartSeason(result);
        const save = start ?? { year: nextSeason.year, season: nextSeason.season };

        const success = await storage.addToWatchlist({
          anilist_id: result.id,
          title: result.title?.native || result.title?.romaji || '',
          image: result.coverImage?.large || null,
          status: 'planned',
          season_year: save.year,
          season: save.season,
          broadcast_day: broadcastInfo.day,
          broadcast_time: broadcastInfo.time,
          streaming_sites: result.streamingServices || null,
        });

        if (success) {
          // 追加済みIDを更新
          setAddedToWatchlistIds((prev) => new Set(prev).add(result.id));
          alert('来期の視聴予定に追加しました');
        } else {
          alert('視聴予定の追加に失敗しました');
        }
      } catch (error) {
        console.error('来期積みアニメへの追加に失敗しました:', error);
        alert('視聴予定の追加に失敗しました');
      }
    },
    [storage, setAddedToWatchlistIds]
  );

  return {
    seasonSearchResults,
    setSeasonSearchResults,
    loadingSeasons,
    expandedSeasonSearches,
    setExpandedSeasonSearches,
    searchSeasonAnimes,
    handleSeasonSearch,
    addAnimeFromSearch,
    addToWatchlistFromSearch,
    addToNextSeasonWatchlist,
    addedToWatchlistIds,
  };
}
