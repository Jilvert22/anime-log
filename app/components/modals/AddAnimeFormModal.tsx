'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import type { Anime, Season } from '../../types';
import { searchAnime, searchAnimeBySeason, type AniListMedia } from '../../lib/anilist';
import { supabase } from '../../lib/supabase';
import { translateGenre, sortSeasonsByTime } from '../../utils/helpers';
import { availableTags } from '../../constants';

export function AddAnimeFormModal({
  show,
  onClose,
  seasons,
  setSeasons,
  expandedSeasons,
  setExpandedSeasons,
  user,
  extractSeriesName,
  getSeasonName,
  animeToSupabase,
}: {
  show: boolean;
  onClose: () => void;
  seasons: Season[];
  setSeasons: (seasons: Season[]) => void;
  expandedSeasons: Set<string>;
  setExpandedSeasons: (seasons: Set<string>) => void;
  user: User | null;
  extractSeriesName: (title: string) => string | undefined;
  getSeasonName: (season: string) => string;
  animeToSupabase: (anime: Anime, seasonName: string, userId: string) => {
    user_id: string;
    season_name: string;
    title: string;
    image: string | null;
    rating: number | null;
    watched: boolean;
    rewatch_count: number;
    tags: string[] | null;
    songs: Anime['songs'] | null;
    quotes: Anime['quotes'] | null;
    series_name: string | null;
    studios: string[] | null;
  };
}) {
  const [addModalMode, setAddModalMode] = useState<'search' | 'season'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AniListMedia[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchAnimeIds, setSelectedSearchAnimeIds] = useState<Set<number>>(new Set());
  const [selectedSeason, setSelectedSeason] = useState<'SPRING' | 'SUMMER' | 'FALL' | 'WINTER' | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [seasonSearchResults, setSeasonSearchResults] = useState<AniListMedia[]>([]);
  const [selectedSeasonAnimeIds, setSelectedSeasonAnimeIds] = useState<Set<number>>(new Set());
  const [isSeasonSearching, setIsSeasonSearching] = useState(false);

  if (!show) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
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

  const handleClose = () => {
    onClose();
    setSearchQuery('');
    setSearchResults([]);
    setSelectedSearchAnimeIds(new Set());
    setAddModalMode('search');
    setSelectedSeason(null);
    setSelectedYear(new Date().getFullYear());
    setSeasonSearchResults([]);
    setSelectedSeasonAnimeIds(new Set());
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleClose}
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
                ? 'bg-[#e879d4] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            タイトル検索
          </button>
          <button
            onClick={() => setAddModalMode('season')}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              addModalMode === 'season'
                ? 'bg-[#e879d4] text-white'
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
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
                  setSelectedSeasonAnimeIds(new Set());
                  try {
                    const result = await searchAnimeBySeason(selectedSeason, selectedYear, 1, 50);
                    setSeasonSearchResults(result.media);
                  } catch (error) {
                    console.error('Failed to search anime by season:', error);
                  } finally {
                    setIsSeasonSearching(false);
                  }
                }
              }}
              disabled={!selectedSeason || isSeasonSearching}
              className="w-full px-4 py-3 bg-[#e879d4] text-white rounded-xl font-bold hover:bg-[#f09fe3] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                    className="text-xs text-[#e879d4] dark:text-[#e879d4] hover:underline"
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
                            ? 'border-[#e879d4] bg-[#e879d4]/10 dark:bg-[#e879d4]/10/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-[#e879d4] dark:hover:border-[#e879d4]'
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
                          className="w-5 h-5 text-[#e879d4] rounded focus:ring-[#e879d4]"
                        />
                        {result.coverImage?.large || result.coverImage?.medium ? (
                          <div className="relative w-16 h-24 shrink-0">
                            <Image
                              src={result.coverImage.large || result.coverImage.medium}
                              alt={result.title?.native || result.title?.romaji || ''}
                              width={64}
                              height={96}
                              className="object-cover rounded"
                              unoptimized
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="96"><rect fill="%23ddd" width="64" height="96"/></svg>';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-24 flex items-center justify-center text-2xl shrink-0">🎬</div>
                        )}
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
                          rewatchCount: 1, // デフォルトで1周
                          tags: result.genres?.map((g: string) => translateGenre(g)).slice(0, 3) || [],
                          seriesName,
                          studios: result.studios?.nodes?.map((s: { name: string }) => s.name) || [],
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
                      
                      // 時系列順にソート
                      updatedSeasons = sortSeasonsByTime(updatedSeasons);
                      
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
                          
                          const { error } = await supabase
                            .from('animes')
                            .insert(supabaseData)
                            .select();
                          
                          if (error) throw error;
                        } catch (error: unknown) {
                          const errorMessage = error instanceof Error ? error.message : 
                            (typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: string }).message) : 
                            (typeof error === 'object' && error !== null && 'details' in error ? String((error as { details?: string }).details) :
                            (typeof error === 'object' && error !== null && 'hint' in error ? String((error as { hint?: string }).hint) :
                            String(error)))) || '不明なエラー';
                          alert(`アニメの保存に失敗しました\n\nエラー: ${errorMessage}\n\n詳細はコンソール（F12）を確認してください。`);
                        }
                      }
                      
                      setSeasons(updatedSeasons);
                      handleClose();
                    }}
                    className="w-full px-4 py-3 bg-[#e879d4] text-white rounded-xl font-bold hover:bg-[#f09fe3] transition-colors"
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
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                  placeholder="アニメタイトルで検索"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="px-4 py-2 bg-[#e879d4] text-white rounded-xl font-bold hover:bg-[#f09fe3] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSearching ? '検索中...' : '検索'}
                </button>
              </div>
            </div>

            {/* 検索結果 */}
            {isSearching && (
              <div className="mb-4 text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#e879d4]"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">検索中...</p>
              </div>
            )}

            {searchResults.length > 0 && !isSearching && (
              <div className="mb-4 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between mb-2 sticky top-0 bg-white dark:bg-gray-800 py-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">検索結果: {searchResults.length}件</p>
                  <button
                    onClick={() => {
                      if (selectedSearchAnimeIds.size === searchResults.length) {
                        setSelectedSearchAnimeIds(new Set());
                      } else {
                        setSelectedSearchAnimeIds(new Set(searchResults.map(r => r.id)));
                      }
                    }}
                    className="text-xs text-[#e879d4] dark:text-[#e879d4] hover:underline"
                  >
                    {selectedSearchAnimeIds.size === searchResults.length ? 'すべて解除' : 'すべて選択'}
                  </button>
                </div>
                <div className="space-y-2">
                  {searchResults.map((result) => {
                    const isSelected = selectedSearchAnimeIds.has(result.id);
                    return (
                      <label
                        key={result.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#e879d4] bg-[#e879d4]/10 dark:bg-[#e879d4]/10/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-[#e879d4] dark:hover:border-[#e879d4]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(selectedSearchAnimeIds);
                            if (e.target.checked) {
                              newSet.add(result.id);
                            } else {
                              newSet.delete(result.id);
                            }
                            setSelectedSearchAnimeIds(newSet);
                          }}
                          className="w-5 h-5 text-[#e879d4] rounded focus:ring-[#e879d4]"
                        />
                        {result.coverImage?.large || result.coverImage?.medium ? (
                          <div className="relative w-16 h-24 shrink-0">
                            <Image
                              src={result.coverImage.large || result.coverImage.medium}
                              alt={result.title?.native || result.title?.romaji || ''}
                              width={64}
                              height={96}
                              className="object-cover rounded"
                              unoptimized
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="96"><rect fill="%23ddd" width="64" height="96"/></svg>';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-24 flex items-center justify-center text-2xl shrink-0">🎬</div>
                        )}
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
                      </label>
                    );
                  })}
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
            {selectedSearchAnimeIds.size > 0 && (
              <div className="flex gap-3">
                <button 
                  onClick={handleClose}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button 
                  onClick={async () => {
                    if (selectedSearchAnimeIds.size === 0) {
                      alert('アニメを選択してください');
                      return;
                    }
                    
                    const selectedAnimes = searchResults.filter(r => selectedSearchAnimeIds.has(r.id));
                    const maxId = Math.max(...seasons.flatMap(s => s.animes).map(a => a.id), 0);
                    
                    // 選択されたアニメを処理
                    const newAnimes: Anime[] = selectedAnimes.map((result, index) => {
                      const title = result.title?.native || result.title?.romaji || '';
                      const image = result.coverImage?.large || result.coverImage?.medium || '🎬';
                      
                      // ジャンルをタグとして取得
                      const tags: string[] = [];
                      if (result?.genres && result.genres.length > 0) {
                        result.genres.forEach((genre: string) => {
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
                      if (result?.studios?.nodes && Array.isArray(result.studios.nodes)) {
                        studios.push(...result.studios.nodes.map((s: { name: string }) => s.name));
                      }
                      
                      return {
                        id: maxId + index + 1,
                        title: title,
                        image: image,
                        rating: 0,
                        watched: false,
                        rewatchCount: 1, // デフォルトで1周
                        tags: tags.length > 0 ? tags : undefined,
                        seriesName: seriesName,
                        studios: studios.length > 0 ? studios : undefined,
                      };
                    });
                    
                    // 各アニメを適切なシーズンに追加
                    let updatedSeasons: Season[] = [...seasons];
                    
                    newAnimes.forEach((anime) => {
                      // シーズン名を取得（各アニメの情報から）
                      const result = selectedAnimes.find(r => 
                        (r.title?.native || r.title?.romaji) === anime.title
                      );
                      let seasonName = '未分類';
                      if (result?.seasonYear && result?.season) {
                        const seasonNameMap: { [key: string]: string } = {
                          'SPRING': '春',
                          'SUMMER': '夏',
                          'FALL': '秋',
                          'WINTER': '冬',
                        };
                        seasonName = `${result.seasonYear}年${seasonNameMap[result.season]}`;
                      }
                      
                      const existingSeasonIndex = updatedSeasons.findIndex(s => s.name === seasonName);
                      
                      if (existingSeasonIndex === -1) {
                        updatedSeasons.push({ name: seasonName, animes: [anime] });
                      } else {
                        updatedSeasons[existingSeasonIndex].animes.push(anime);
                      }
                    });
                    
                    // 時系列順にソート
                    updatedSeasons = sortSeasonsByTime(updatedSeasons);
                    
                    // 新しいシーズンが追加された場合は展開状態にする
                    const newExpandedSeasons = new Set(expandedSeasons);
                    newAnimes.forEach((anime) => {
                      const result = selectedAnimes.find(r => 
                        (r.title?.native || r.title?.romaji) === anime.title
                      );
                      let seasonName = '未分類';
                      if (result?.seasonYear && result?.season) {
                        const seasonNameMap: { [key: string]: string } = {
                          'SPRING': '春',
                          'SUMMER': '夏',
                          'FALL': '秋',
                          'WINTER': '冬',
                        };
                        seasonName = `${result.seasonYear}年${seasonNameMap[result.season]}`;
                      }
                      if (!seasons.find(s => s.name === seasonName)) {
                        newExpandedSeasons.add(seasonName);
                      } else {
                        newExpandedSeasons.add(seasonName);
                      }
                    });
                    setExpandedSeasons(newExpandedSeasons);
                    
                    // Supabaseに保存（ログイン時のみ）
                    if (user) {
                      try {
                        const supabaseData: ReturnType<typeof animeToSupabase>[] = [];
                        newAnimes.forEach((anime) => {
                          const result = selectedAnimes.find(r => 
                            (r.title?.native || r.title?.romaji) === anime.title
                          );
                          let seasonName = '未分類';
                          if (result?.seasonYear && result?.season) {
                            const seasonNameMap: { [key: string]: string } = {
                              'SPRING': '春',
                              'SUMMER': '夏',
                              'FALL': '秋',
                              'WINTER': '冬',
                            };
                            seasonName = `${result.seasonYear}年${seasonNameMap[result.season]}`;
                          }
                          supabaseData.push(animeToSupabase(anime, seasonName, user.id));
                        });
                        
                        const { error } = await supabase
                          .from('animes')
                          .insert(supabaseData)
                          .select();
                        
                        if (error) throw error;
                      } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : 
                          (typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: string }).message) : 
                          (typeof error === 'object' && error !== null && 'details' in error ? String((error as { details?: string }).details) :
                          (typeof error === 'object' && error !== null && 'hint' in error ? String((error as { hint?: string }).hint) :
                          String(error)))) || '不明なエラー';
                        alert(`アニメの保存に失敗しました\n\nエラー: ${errorMessage}\n\n詳細はコンソール（F12）を確認してください。`);
                      }
                    }
                    
                    setSeasons(updatedSeasons);
                    handleClose();
                  }}
                  className="flex-1 px-4 py-3 bg-[#e879d4] text-white rounded-xl font-bold hover:bg-[#f09fe3] transition-colors"
                >
                  {selectedSearchAnimeIds.size}件のアニメを登録
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
