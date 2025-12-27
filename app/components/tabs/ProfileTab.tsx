'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Anime, Season } from '../../types';
import type { UserProfile } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { availableTags } from '../../constants';
import { UserCard } from '../UserCard';

export function ProfileTab({
  allAnimes,
  seasons,
  userName,
  userIcon,
  userHandle,
  averageRating,
  isDarkMode,
  setIsDarkMode,
  setShowSettings,
  handleLogout,
  userOtakuType,
  favoriteAnimeIds,
  setFavoriteAnimeIds,
  setShowFavoriteAnimeModal,
  followCounts,
  setShowFollowListModal,
  setFollowListType,
  setFollowListUsers,
  user,
  setUserName,
  setUserIcon,
  setUserOtakuType,
  isProfilePublic,
  setIsProfilePublic,
  userBio,
  setUserBio,
  upsertUserProfile,
  userSearchQuery,
  setUserSearchQuery,
  searchedUsers,
  recommendedUsers,
  isSearchingUsers,
  handleUserSearch,
  handleViewUserProfile,
  handleToggleFollow,
  userFollowStatus,
}: {
  allAnimes: Anime[];
  seasons: Season[];
  userName: string;
  userIcon: string;
  userHandle: string;
  averageRating: number;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  setShowSettings: (value: boolean) => void;
  handleLogout: () => void;
  userOtakuType: string;
  favoriteAnimeIds: number[];
  setFavoriteAnimeIds: (ids: number[]) => void;
  setShowFavoriteAnimeModal: (show: boolean) => void;
  followCounts: { following: number; followers: number };
  setShowFollowListModal: (show: boolean) => void;
  setFollowListType: (type: 'following' | 'followers') => void;
  setFollowListUsers: (users: UserProfile[]) => void;
  user: User | null;
  setUserName: (name: string) => void;
  setUserIcon: (icon: string) => void;
  setUserOtakuType: (type: string) => void;
  isProfilePublic: boolean;
  setIsProfilePublic: (isPublic: boolean) => void;
  userBio: string;
  setUserBio: (bio: string) => void;
  upsertUserProfile: (profile: { username: string; bio?: string; is_public?: boolean }) => Promise<boolean>;
  userSearchQuery: string;
  setUserSearchQuery: (query: string) => void;
  searchedUsers: UserProfile[];
  recommendedUsers: UserProfile[];
  isSearchingUsers: boolean;
  handleUserSearch: () => Promise<void>;
  handleViewUserProfile: (userId: string) => Promise<void>;
  handleToggleFollow: (userId: string) => Promise<void>;
  userFollowStatus: { [userId: string]: boolean };
}) {
  const [isDNACardVisible, setIsDNACardVisible] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isHandleVisible, setIsHandleVisible] = useState(true);
  
  const handleSaveProfile = async () => {
    if (user) {
      await upsertUserProfile({
        username: userName,
        bio: userBio,
        is_public: isProfilePublic,
      });
    }
    localStorage.setItem('userName', userName);
    localStorage.setItem('userIcon', userIcon);
    if (userOtakuType) {
      localStorage.setItem('userOtakuType', userOtakuType);
    } else {
      localStorage.removeItem('userOtakuType');
    }
    localStorage.setItem('favoriteAnimeIds', JSON.stringify(favoriteAnimeIds));
  };
  
  const watchedCount = allAnimes.filter(a => a.watched).length;
  const totalRewatchCount = allAnimes.reduce((sum, a) => sum + (a.rewatchCount ?? 0), 0);
  
  // タグの集計
  const tagCounts: { [key: string]: number } = {};
  allAnimes.forEach(anime => {
    anime.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const mostPopularTag = sortedTags[0] ? availableTags.find(t => t.value === sortedTags[0][0]) : null;
  
  // 制作会社を実際のアニメデータから集計
  const allAnimesForProfile = seasons.flatMap(season => season.animes);
  const studioCounts: { [key: string]: number } = {};
  allAnimesForProfile.forEach(anime => {
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
  
  return (
    <div className="space-y-6">
      {/* DNAカード */}
      {isDNACardVisible && (() => {
        const allAnimes = seasons.flatMap(s => s.animes);
        const count = allAnimes.filter(a => a.watched).length;
        const totalRewatchCount = allAnimes.reduce((sum, a) => sum + (a.rewatchCount ?? 0), 0);
        const ratings = allAnimes.filter(a => a.rating > 0).map(a => a.rating);
        const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
        
        // オタクタイプの判定
        const tagCounts: { [key: string]: number } = {};
        allAnimes.forEach(anime => {
          anime.tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
        
        // ユーザーが設定したオタクタイプを使用、なければ自動判定
        let otakuType = userOtakuType || '🎵 音響派'; // デフォルト
        if (!userOtakuType) {
          // 自動判定
          if (tagCounts['考察'] && tagCounts['考察'] >= 3) {
            otakuType = '🔍 考察厨';
          } else if (tagCounts['泣ける'] && tagCounts['泣ける'] >= 3) {
            otakuType = '😭 感情移入型';
          } else if (tagCounts['作画神'] && tagCounts['作画神'] >= 3) {
            otakuType = '🎨 作画厨';
          } else if (tagCounts['音楽最高'] && tagCounts['音楽最高'] >= 3) {
            otakuType = '🎵 音響派';
          } else if (tagCounts['キャラ萌え'] && tagCounts['キャラ萌え'] >= 3) {
            otakuType = '💕 キャラオタ';
          } else if (tagCounts['熱い'] && tagCounts['熱い'] >= 3) {
            otakuType = '🔥 熱血派';
          }
        }
        
        // お気に入り曲
        const favoriteSongs = allAnimes
          .flatMap(anime => [
            anime.songs?.op?.isFavorite ? anime.songs.op : null,
            anime.songs?.ed?.isFavorite ? anime.songs.ed : null,
          ])
          .filter(song => song !== null);
        
        return (
          <>
            <div className="bg-linear-to-br from-purple-500 via-pink-500 to-purple-600 rounded-2xl p-6 shadow-lg">
              {/* タイトル */}
              <div className="text-center mb-4">
                <h2 className="text-white text-xl font-black mb-1">MY ANIME DNA {new Date().getFullYear()}</h2>
              </div>
              
              {/* プロフィール画像と名前（Twitter風） */}
              <div className="text-center mb-4">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl mx-auto mb-2 shadow-lg">
                  {userIcon}
                </div>
                <p className="text-white text-lg font-bold">
                  {userName}
                </p>
                {userHandle ? (
                  <p className="text-white/80 text-sm mt-1">
                    {!isHandleVisible ? `@${userHandle}` : '@XXXX'}
                  </p>
                ) : (
                  <p className="text-white/80 text-sm mt-1">
                    {!isHandleVisible ? '' : '@XXXX'}
                  </p>
                )}
              </div>
              
              {/* オタクタイプ */}
              <div className="text-center mb-6">
                <p className="text-white text-4xl font-black">
                  {otakuType}
                </p>
              </div>
              
              {/* 統計 */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg py-2">
                  <p className="text-white text-2xl font-black">{count}</p>
                  <p className="text-white/80 text-xs mt-1">作品</p>
                </div>
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg py-2">
                  <p className="text-white text-2xl font-black">{totalRewatchCount}</p>
                  <p className="text-white/80 text-xs mt-1">周</p>
                </div>
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg py-2">
                  <p className="text-white text-2xl font-black">
                    {averageRating > 0 ? `${averageRating.toFixed(1)}` : '0.0'}
                  </p>
                  <p className="text-white/80 text-xs mt-1">平均</p>
                </div>
              </div>
              
              {/* 最推し作品 */}
              <div className="mb-4">
                <p className="text-white/90 text-xs font-medium mb-2 text-center">最推し作品</p>
                <div className="flex justify-center gap-3">
                  {(favoriteAnimeIds.length > 0
                    ? favoriteAnimeIds
                        .map(id => allAnimes.find(a => a.id === id))
                        .filter((a): a is Anime => a !== undefined)
                        .slice(0, 3)
                    : allAnimes
                        .filter(a => a.rating > 0)
                        .sort((a, b) => b.rating - a.rating)
                        .slice(0, 3)
                  ).map((anime, index) => {
                      const isImageUrl = anime.image && (anime.image.startsWith('http://') || anime.image.startsWith('https://'));
                      return (
                        <div
                          key={anime.id}
                          className="bg-white/20 backdrop-blur-sm rounded-lg w-16 h-20 flex items-center justify-center overflow-hidden relative"
                        >
                          {isImageUrl ? (
                            <img
                              src={anime.image}
                              alt={anime.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  parent.innerHTML = '<span class="text-3xl">🎬</span>';
                                }
                              }}
                            />
                          ) : (
                            <span className="text-3xl">{anime.image || '🎬'}</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
              
              {/* お気に入り曲 */}
              {favoriteSongs.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/90 text-xs font-medium mb-2 text-center">お気に入り曲</p>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-white text-sm font-bold text-center">
                      {favoriteSongs[0].title}
                    </p>
                    <p className="text-white/80 text-xs text-center mt-1">
                      {favoriteSongs[0].artist}
                    </p>
                  </div>
                </div>
              )}
              
              {/* ロゴ */}
              <div className="text-center pt-2 border-t border-white/20">
                <p className="text-white/80 text-xs font-bold">アニメログ</p>
              </div>
            </div>
            
            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  // html2canvasで画像保存
                  try {
                    const html2canvas = (await import('html2canvas')).default;
                    const cardElement = document.querySelector('.bg-linear-to-br.from-purple-500');
                    if (cardElement) {
                      const canvas = await html2canvas(cardElement as HTMLElement);
                      const url = canvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.download = 'anime-dna-card.png';
                      link.href = url;
                      link.click();
                    }
                  } catch (error) {
                    console.error('Failed to save image:', error);
                  }
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>📥</span>
                <span>画像を保存</span>
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>📤</span>
                <span>シェア</span>
              </button>
            </div>
          </>
        );
      })()}
      
      {/* ハンドル表示/非表示切り替え */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔒</span>
          <span className="dark:text-white font-medium">ハンドルを表示</span>
        </div>
        <button
          onClick={() => setIsHandleVisible(!isHandleVisible)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            !isHandleVisible ? 'bg-[#ffc2d1]' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              !isHandleVisible ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* シェアモーダル */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold dark:text-white">シェア</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            {/* QRコード */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative bg-gradient-to-br from-[#ffc2d1] via-[#ffb07c] to-[#ffc2d1] p-6 rounded-3xl shadow-xl mb-4">
                <div className="bg-white p-4 rounded-2xl">
                  <QRCodeSVG
                    value={typeof window !== 'undefined' ? window.location.href : ''}
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#1f2937"
                    bgColor="#ffffff"
                  />
                </div>
                {/* 装飾的な角 */}
                <div className="absolute top-2 left-2 w-4 h-4 border-2 border-white/50 rounded-tl-3xl"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-2 border-white/50 rounded-tr-3xl"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-2 border-white/50 rounded-bl-3xl"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-2 border-white/50 rounded-br-3xl"></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium">
                QRコードをスキャンしてプロフィールを開く
              </p>
            </div>

            {/* リンクコピー */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">プロフィールURL</p>
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                    {typeof window !== 'undefined' ? window.location.href : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
                    alert('リンクをクリップボードにコピーしました');
                  } catch (error) {
                    console.error('Failed to copy link:', error);
                    alert('リンクのコピーに失敗しました');
                  }
                }}
                className="w-full bg-[#ffc2d1] text-white py-3 rounded-xl font-bold hover:bg-[#ffb07c] transition-colors flex items-center justify-center gap-2"
              >
                <span>📋</span>
                <span>リンクをコピー</span>
              </button>
            </div>

            {/* Web Share API（モバイル対応） */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: `${userName}のアニメDNA`,
                      text: `${userName}のアニメログをチェック！`,
                      url: typeof window !== 'undefined' ? window.location.href : '',
                    });
                  } catch (error) {
                    // ユーザーがキャンセルした場合はエラーを無視
                    if ((error as Error).name !== 'AbortError') {
                      console.error('Share failed:', error);
                    }
                  }
                }}
                className="w-full mt-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>📤</span>
                <span>アプリでシェア</span>
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* お気に入りジャンル */}
      {sortedTags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          <h3 className="font-bold text-lg mb-3 text-[#6b5b6e] dark:text-white">お気に入りジャンル</h3>
          <div className="space-y-2">
            {sortedTags.map(([tag, count]) => {
              const tagInfo = availableTags.find(t => t.value === tag);
              const maxCount = sortedTags[0][1];
              const percentage = (count / maxCount) * 100;
              
              return (
                <div key={tag} className="flex items-center gap-3">
                  <span className="text-xl">{tagInfo?.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium dark:text-white">{tagInfo?.label}</span>
                      <span className="text-gray-500 dark:text-gray-400">{count}回</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-[#ffc2d1] h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* ユーザー検索 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
        <h3 className="font-bold text-lg mb-3 text-[#6b5b6e] dark:text-white">ユーザー検索</h3>
        <div className="space-y-4">
          {/* 検索バー */}
          <div className="flex gap-2">
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleUserSearch();
                }
              }}
              placeholder="ユーザー名または@ハンドルで検索..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleUserSearch}
              disabled={isSearchingUsers}
              className="px-6 py-2 bg-[#ffc2d1] text-white rounded-xl font-medium hover:bg-[#ffb07c] transition-colors disabled:opacity-50"
            >
              {isSearchingUsers ? '検索中...' : '検索'}
            </button>
          </div>
          
          {/* 検索結果 */}
          {userSearchQuery.trim() && searchedUsers.length > 0 && (
            <div>
              <h4 className="font-bold text-sm mb-2 dark:text-white">検索結果</h4>
              <div className="space-y-2">
                {searchedUsers.map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    onUserClick={() => handleViewUserProfile(u.id)}
                    onFollowClick={() => handleToggleFollow(u.id)}
                    isFollowing={userFollowStatus[u.id] || false}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* おすすめユーザー */}
          <div>
            <h4 className="font-bold text-sm mb-2 dark:text-white">おすすめユーザー</h4>
            {recommendedUsers.length > 0 ? (
              <div className="space-y-2">
                {recommendedUsers.map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    onUserClick={() => handleViewUserProfile(u.id)}
                    onFollowClick={() => handleToggleFollow(u.id)}
                    isFollowing={userFollowStatus[u.id] || false}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                公開プロフィールのユーザーがいません
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* 設定 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
        <h3 className="font-bold text-lg mb-3 text-[#6b5b6e] dark:text-white">設定</h3>
        <div className="space-y-3">
          {/* 自分のID表示 */}
          {user && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">自分のID</p>
                  <p className="text-sm font-mono dark:text-white truncate">{user.id}</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(user.id);
                      alert('IDをクリップボードにコピーしました');
                    } catch (error) {
                      console.error('Failed to copy ID:', error);
                      alert('IDのコピーに失敗しました');
                    }
                  }}
                  className="ml-3 px-3 py-1.5 bg-[#ffc2d1] text-white rounded-lg text-xs font-medium hover:bg-[#ffb07c] transition-colors shrink-0"
                  title="IDをコピー"
                >
                  コピー
                </button>
              </div>
            </div>
          )}
          
          {/* DNAカード編集 */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎨</span>
              <span className="dark:text-white font-medium">DNAカード編集</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>
          
          {/* ダークモード切り替え */}
          <div className="flex items-center justify-between">
            <span className="dark:text-white">ダークモード</span>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isDarkMode ? 'bg-[#ffc2d1]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          
          {/* データをエクスポート */}
          <button
            onClick={() => {}}
            className="w-full text-left py-2 text-gray-700 dark:text-gray-300 hover:text-[#ffc2d1] dark:hover:text-indigo-400 transition-colors"
          >
            データをエクスポート
          </button>
          
          {/* ログアウト */}
          <button
            onClick={handleLogout}
            className="w-full text-left py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>

    </div>
  );
}
