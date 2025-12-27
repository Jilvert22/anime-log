'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import type { Anime } from '../../types';
import { searchAnime, searchAnimeBySeason } from '../../lib/anilist';
import { getWatchlist, addToWatchlist, removeFromWatchlist, updateWatchlistItem, type WatchlistItem as SupabaseWatchlistItem } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';

// 積みアニメカード
function WatchlistCard({ 
  item, 
  onRemove,
  onMarkAsWatched,
}: { 
  item: SupabaseWatchlistItem; 
  onRemove: () => void;
  onMarkAsWatched: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const isImageUrl = item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'));

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
        
        {/* ホバー時のアクションボタン */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-2">
          <button
            onClick={onMarkAsWatched}
            className="w-full py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            視聴済みにする
          </button>
          <button
            onClick={onRemove}
            className="w-full py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            削除
          </button>
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

export function WatchlistTab({
  setSelectedAnime,
  onOpenAddForm,
  user,
}: {
  setSelectedAnime: (anime: Anime | null) => void;
  onOpenAddForm: () => void;
  user: User | null;
}) {
  const [watchlist, setWatchlist] = useState<SupabaseWatchlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchMode, setSearchMode] = useState<'name' | 'season'>('name');
  const [seasonYear, setSeasonYear] = useState<number>(new Date().getFullYear());
  const [season, setSeason] = useState<'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'>('SPRING');

  // Supabaseから積みアニメを読み込む
  const loadWatchlist = useCallback(async () => {
    if (!user) return;
    
    try {
      const items = await getWatchlist(user.id);
      setWatchlist(items);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    }
  }, [user]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // AniList APIで名前検索
  const handleSearchAnime = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchAnime(searchQuery);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // AniList APIでシーズン検索
  const handleSearchBySeason = useCallback(async () => {
    setIsSearching(true);
    try {
      const result = await searchAnimeBySeason(season, seasonYear, 1, 20);
      setSearchResults(result.media || []);
    } catch (error) {
      console.error('Season search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [season, seasonYear]);

  // 積みアニメに追加（重複チェックなし、複数登録可能）
  const handleAddToWatchlist = useCallback(async (anime: any) => {
    if (!user) return;
    
    const success = await addToWatchlist({
      anilist_id: anime.id,
      title: anime.title.native || anime.title.romaji,
      image: anime.coverImage?.large || null,
    });
    
    if (success) {
      await loadWatchlist();
      // 検索フォームは開いたままにする（追加後も続けて検索できるように）
    } else {
      alert('積みアニメの追加に失敗しました');
    }
  }, [user, loadWatchlist]);

  // 積みアニメから削除
  const handleRemoveFromWatchlist = useCallback(async (anilistId: number) => {
    if (!user) return;
    
    const success = await removeFromWatchlist(anilistId);
    if (success) {
      await loadWatchlist();
    } else {
      alert('削除に失敗しました');
    }
  }, [user, loadWatchlist]);

  // 視聴済みにする（将来的にはクール別に移動する処理を追加）
  const markAsWatched = useCallback((item: SupabaseWatchlistItem) => {
    // TODO: アニメ追加モーダルを開いて、クール別に追加する処理
    // 今は単純に積みアニメから削除
    handleRemoveFromWatchlist(item.anilist_id);
    alert(`「${item.title}」を視聴済みにしました。\n※実際の実装では、アニメ追加画面に遷移します。`);
  }, [handleRemoveFromWatchlist]);

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
          className="w-full mb-4 py-4 border-2 border-dashed border-[#e879d4] rounded-xl text-[#e879d4] font-bold hover:border-[#d45dbf] hover:text-[#d45dbf] hover:bg-[#e879d4]/5 transition-colors"
          disabled={!user}
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
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="アニメを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchAnime()}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
              />
              <button
                onClick={handleSearchAnime}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-[#e879d4] text-white rounded-lg text-sm font-medium hover:bg-[#d45dbf] transition-colors disabled:opacity-50"
              >
                {isSearching ? '検索中...' : '検索'}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setSearchQuery(''); setSearchResults([]); }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-3">
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
                <button
                  onClick={handleSearchBySeason}
                  disabled={isSearching}
                  className="px-4 py-2 bg-[#e879d4] text-white rounded-lg text-sm font-medium hover:bg-[#d45dbf] transition-colors disabled:opacity-50"
                >
                  {isSearching ? '検索中...' : '検索'}
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setSearchResults([]); }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
          
          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map(anime => (
                <button
                  key={anime.id}
                  onClick={() => handleAddToWatchlist(anime)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-14 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden shrink-0 relative">
                    {anime.coverImage?.large && (
                      <Image
                        src={anime.coverImage.large}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                        unoptimized
                      />
                    )}
                  </div>
                  <span className="text-sm text-gray-800 dark:text-white line-clamp-2">
                    {anime.title.native || anime.title.romaji}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 積みアニメ一覧 */}
      {watchlist.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {watchlist.map(item => (
            <WatchlistCard
              key={item.id}
              item={item}
              onRemove={() => handleRemoveFromWatchlist(item.anilist_id)}
              onMarkAsWatched={() => markAsWatched(item)}
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
    </>
  );
}

