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
  isSearchingUsers,
  handleUserSearch,
  handleViewUserProfile,
  handleToggleFollow,
  userFollowStatus,
  setActiveTab,
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
  isSearchingUsers: boolean;
  handleUserSearch: () => Promise<void>;
  handleViewUserProfile: (userId: string) => Promise<void>;
  handleToggleFollow: (userId: string) => Promise<void>;
  userFollowStatus: { [userId: string]: boolean };
  setActiveTab: (tab: 'home' | 'discover' | 'collection' | 'profile') => void;
}) {
  const [isDNACardVisible, setIsDNACardVisible] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isHandleVisible, setIsHandleVisible] = useState(true);
  const [isIdVisible, setIsIdVisible] = useState(false);
  
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
        
        // オタクタイプから絵文字を除去する関数
        const getOtakuTypeLabel = (type: string): string => {
          // 絵文字を除去（Unicode絵文字の範囲をチェック）
          return type.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
        };
        
        // ユーザーが設定したオタクタイプを使用、なければ自動判定
        let otakuTypeValue = userOtakuType || '🎵 音響派'; // デフォルト
        let otakuTypeLabel = '音響派';
        if (!userOtakuType) {
          // 自動判定
          if (tagCounts['考察'] && tagCounts['考察'] >= 3) {
            otakuTypeValue = '🔍 考察厨';
            otakuTypeLabel = '考察厨';
          } else if (tagCounts['泣ける'] && tagCounts['泣ける'] >= 3) {
            otakuTypeValue = '😭 感情移入型';
            otakuTypeLabel = '感情移入型';
          } else if (tagCounts['作画神'] && tagCounts['作画神'] >= 3) {
            otakuTypeValue = '🎨 作画厨';
            otakuTypeLabel = '作画厨';
          } else if (tagCounts['音楽最高'] && tagCounts['音楽最高'] >= 3) {
            otakuTypeValue = '🎵 音響派';
            otakuTypeLabel = '音響派';
          } else if (tagCounts['キャラ萌え'] && tagCounts['キャラ萌え'] >= 3) {
            otakuTypeValue = '💕 キャラオタ';
            otakuTypeLabel = 'キャラオタ';
          } else if (tagCounts['熱い'] && tagCounts['熱い'] >= 3) {
            otakuTypeValue = '🔥 熱血派';
            otakuTypeLabel = '熱血派';
          }
        } else {
          otakuTypeLabel = getOtakuTypeLabel(userOtakuType);
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
            <div 
              className="dna-card-container relative rounded-3xl p-6 overflow-hidden"
              style={{
                background: `
                  linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0) 50%),
                  linear-gradient(135deg, #7b8ff5 0%, #9b6bc9 25%, #d76bbc 50%, #f586d4 75%, #ffa3e0 100%)
                `,
                boxShadow: '0 0 40px rgba(247, 134, 212, 0.4), 0 0 80px rgba(123, 143, 245, 0.2), 0 20px 40px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="dna-logo-icon"></div>
                  <h2 className="text-white text-xl font-black">ANIME DNA</h2>
                </div>
                <div 
                  className="px-4 py-2 flex items-center justify-center backdrop-blur-md border border-white/50 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <span className="text-white text-sm font-semibold">{new Date().getFullYear()}</span>
                </div>
              </div>
              
              {/* メインコンテンツ */}
              <div className="dna-main-content">
                {/* 上部セクション: プロフィール + 統計（デスクトップで横並び） */}
                <div className="dna-top-section">
                  {/* プロフィールセクション */}
                  <section className="dna-profile-section">
                    <div className="profile-left">
                      {/* アバター */}
                      <div 
                        className="w-[72px] h-[72px] md:w-[76px] md:h-[76px] lg:w-[100px] lg:h-[100px] rounded-[18px] md:rounded-xl lg:rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border-2 border-white/40"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%)',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,0.3)'
                        }}
                      >
                        {userIcon && (userIcon.startsWith('http://') || userIcon.startsWith('https://') || userIcon.startsWith('data:')) ? (
                          <img
                            src={userIcon}
                            alt="アイコン"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                const placeholder = document.createElement('div');
                                placeholder.className = 'w-full h-full';
                                placeholder.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%)';
                                placeholder.style.boxShadow = 'inset 0 2px 0 rgba(255,255,255,0.3)';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        ) : (
                          <div 
                            className="w-full h-full"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%)',
                              boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)'
                            }}
                          ></div>
                        )}
                      </div>
                      
                      {/* タイプバッジ */}
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-sm border border-white/50" style={{
                        background: 'rgba(255, 255, 255, 0.35)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        boxShadow: '0 2px 8px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.3)'
                      }}>
                        <div className="dna-type-icon"></div>
                        <span className="text-white text-sm md:text-[13px] font-semibold">{otakuTypeLabel}</span>
                      </div>
                    </div>
                    
                    {/* ユーザー情報 */}
                    <div className="profile-info text-center md:text-left flex flex-col justify-center">
                      <h1 className="username text-xl md:text-2xl lg:text-[28px] font-bold md:font-[700] mb-1 text-white" style={{
                        textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                      }}>
                        {userName}
                      </h1>
                      {userHandle ? (
                        <p className="handle text-sm md:text-base text-white/70">
                          {!isHandleVisible ? `@${userHandle}` : '@XXXX'}
                        </p>
                      ) : (
                        <p className="handle text-sm md:text-base text-white/70">
                          {!isHandleVisible ? '' : '@XXXX'}
                        </p>
                      )}
                    </div>
                  </section>
                  
                  {/* 統計グリッド */}
                  <section className="dna-stats-grid">
                    <div 
                      className="p-4 md:p-5 lg:p-7 text-center hover:transform hover:-translate-y-1 transition-all cursor-pointer backdrop-blur-md border border-white/50 rounded-xl"
                      style={{
                        background: 'rgba(255, 255, 255, 0.35)',
                        boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                      }}
                    >
                      <p className="stat-value text-2xl md:text-3xl lg:text-[42px] font-black mb-1" style={{ color: '#00d4ff' }}>{count}</p>
                      <p className="stat-label text-xs md:text-[11px] lg:text-[13px] text-white/70 uppercase" style={{ letterSpacing: '0.5px' }}>作品数</p>
                    </div>
                    <div 
                      className="p-4 md:p-5 lg:p-7 text-center hover:transform hover:-translate-y-1 transition-all cursor-pointer backdrop-blur-md border border-white/50 rounded-xl"
                      style={{
                        background: 'rgba(255, 255, 255, 0.35)',
                        boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                      }}
                    >
                      <p className="stat-value text-2xl md:text-3xl lg:text-[42px] font-black mb-1" style={{ color: '#e879d4' }}>{totalRewatchCount}</p>
                      <p className="stat-label text-xs md:text-[11px] lg:text-[13px] text-white/70 uppercase" style={{ letterSpacing: '0.5px' }}>視聴週</p>
                    </div>
                    <div 
                      className="p-4 md:p-5 lg:p-7 text-center hover:transform hover:-translate-y-1 transition-all cursor-pointer backdrop-blur-md border border-white/50 rounded-xl"
                      style={{
                        background: 'rgba(255, 255, 255, 0.35)',
                        boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                      }}
                    >
                      <p className="stat-value text-2xl md:text-3xl lg:text-[42px] font-black mb-1" style={{ color: '#ffd700' }}>
                        {averageRating > 0 ? `${averageRating.toFixed(1)}` : '0.0'}
                      </p>
                      <p className="stat-label text-xs md:text-[11px] lg:text-[13px] text-white/70 uppercase" style={{ letterSpacing: '0.5px' }}>平均評価</p>
                    </div>
                  </section>
                </div>
                
                {/* 下部セクション: カード2枚（均等幅） */}
                <div className="dna-bottom-sections">
              
                  {/* 最推し作品 */}
                  <div 
                    className="content-card p-4 md:p-5 lg:p-6 min-h-[140px] md:min-h-[150px] lg:min-h-[180px] backdrop-blur-md border border-white/30 rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <div className="card-header flex items-center justify-between mb-3 md:mb-4">
                      <div className="card-title text-xs md:text-sm lg:text-[14px] font-semibold text-white flex items-center gap-2 md:gap-2.5">
                        <span className="dna-trophy-icon"></span>
                        最推し作品
                      </div>
                    </div>
                    {favoriteAnimeIds.length > 0 ? (
                      <div className="favorite-content flex items-center gap-3.5 md:gap-4 lg:gap-5 flex-1">
                        {favoriteAnimeIds
                          .map(id => allAnimes.find(a => a.id === id))
                          .filter((a): a is Anime => a !== undefined)
                          .slice(0, 3)
                          .map((anime) => {
                            const isImageUrl = anime.image && (anime.image.startsWith('http://') || anime.image.startsWith('https://'));
                            return (
                              <div
                                key={anime.id}
                                className="favorite-poster w-[52px] h-[72px] md:w-[60px] md:h-[84px] lg:w-[70px] lg:h-[100px] rounded-lg md:rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 backdrop-blur-md border border-white/30"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%)',
                                }}
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
                                        const placeholder = document.createElement('div');
                                        placeholder.className = 'w-full h-full';
                                        placeholder.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%)';
                                        placeholder.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                                        parent.appendChild(placeholder);
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="film-icon w-6 h-5 md:w-7 md:h-5.5 lg:w-7 lg:h-6 border-2 border-white/30 rounded-sm"></div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="favorite-content flex items-center justify-center flex-1">
                        <div className="favorite-empty text-center text-white/70 text-xs md:text-sm lg:text-[15px] leading-relaxed">
                          <div className="favorite-poster w-[52px] h-[72px] md:w-[60px] md:h-[84px] lg:w-[70px] lg:h-[100px] mx-auto mb-3 flex items-center justify-center rounded-lg md:rounded-xl backdrop-blur-md border border-white/30" style={{
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%)',
                          }}>
                            <div className="film-icon w-6 h-5 md:w-7 md:h-5.5 lg:w-7 lg:h-6 border-2 border-white/30 rounded-sm"></div>
                          </div>
                          <p>まだ最推し作品が</p>
                          <p>登録されていません</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* アニメログ */}
                  <div 
                    className="content-card p-4 md:p-5 lg:p-6 min-h-[140px] md:min-h-[150px] lg:min-h-[180px] backdrop-blur-md border border-white/30 rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <div className="card-header flex items-center justify-between mb-3 md:mb-4">
                      <div className="card-title text-xs md:text-sm lg:text-[14px] font-semibold text-white flex items-center gap-2 md:gap-2.5">
                        <span className="dna-chart-icon">
                          <span></span>
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                        アニメログ
                      </div>
                      <a 
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('home');
                        }}
                        className="view-all text-[11px] md:text-xs lg:text-[13px] text-[#00d4ff] hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        すべて見る →
                      </a>
                    </div>
                    <div className="log-content flex flex-col items-center justify-center flex-1 gap-2">
                      <span className="dna-pen-icon"></span>
                      <p className="log-empty-text text-white/70 text-xs md:text-sm lg:text-[15px]">視聴記録を追加しよう</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* ボタン */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={async () => {
                  // 確認ダイアログ
                  if (!confirm('ANIME DNAカードを画像として保存しますか？')) {
                    return;
                  }
                  
                  // html2canvasで画像保存
                  try {
                    const html2canvas = (await import('html2canvas')).default;
                    const cardElement = document.querySelector('.dna-card-container');
                    if (cardElement) {
                      // すべてのスタイルシートを一時的に無効化（oklabを回避）
                      const originalStyleSheets: Array<{ element: HTMLLinkElement | HTMLStyleElement; disabled?: boolean; textContent?: string | null }> = [];
                      const allStyleSheets = document.querySelectorAll('style, link[rel="stylesheet"]');
                      
                      allStyleSheets.forEach((styleSheet) => {
                        if (styleSheet instanceof HTMLStyleElement) {
                          originalStyleSheets.push({
                            element: styleSheet,
                            textContent: styleSheet.textContent,
                          });
                          // oklabを含む場合は空にする
                          if (styleSheet.textContent && styleSheet.textContent.includes('oklab')) {
                            styleSheet.textContent = '';
                          }
                        } else if (styleSheet instanceof HTMLLinkElement) {
                          originalStyleSheets.push({
                            element: styleSheet,
                            disabled: styleSheet.disabled,
                          });
                          // 外部スタイルシートを一時的に無効化
                          styleSheet.disabled = true;
                        }
                      });
                      
                      try {
                        const canvas = await html2canvas(cardElement as HTMLElement, {
                          onclone: (clonedDoc) => {
                            // oklabを含むスタイルシートのみを削除
                            const clonedStyleSheets = clonedDoc.querySelectorAll('style');
                            clonedStyleSheets.forEach((styleSheet) => {
                              if (styleSheet instanceof HTMLStyleElement && styleSheet.textContent && styleSheet.textContent.includes('oklab')) {
                                styleSheet.remove();
                              }
                            });
                            
                            // 外部スタイルシートは保持（Tailwind CSSを維持）
                            const clonedLinks = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
                            clonedLinks.forEach((link) => {
                              // oklabを含む可能性がある場合は無効化
                              if (link instanceof HTMLLinkElement) {
                                // 外部スタイルシートは保持
                              }
                            });
                            
                            // カード要素に必要なスタイルを詳細に再適用
                            const clonedCard = clonedDoc.querySelector('.dna-card-container') as HTMLElement;
                            if (clonedCard) {
                              // カードコンテナのスタイル
                              clonedCard.style.position = 'relative';
                              clonedCard.style.borderRadius = '24px';
                              clonedCard.style.padding = '24px';
                              clonedCard.style.overflow = 'hidden';
                              clonedCard.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
                              
                              // グラスモーフィズムカードのスタイルを確実に適用
                              const glassCards = clonedCard.querySelectorAll('.dna-glass-card');
                              glassCards.forEach((card) => {
                                const htmlCard = card as HTMLElement;
                                htmlCard.style.background = 'rgba(255, 255, 255, 0.08)';
                                htmlCard.style.backdropFilter = 'blur(20px)';
                                htmlCard.style.setProperty('-webkit-backdrop-filter', 'blur(20px)');
                                htmlCard.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                                htmlCard.style.borderRadius = '14px';
                              });
                              
                              // テキストの色を確実に適用
                              const allText = clonedCard.querySelectorAll('h1, h2, h3, p, span, div');
                              allText.forEach((el) => {
                                const htmlEl = el as HTMLElement;
                                const classes = htmlEl.className.toString();
                                
                                // 白いテキスト
                                if (classes.includes('text-white') || 
                                    htmlEl.closest('.dna-glass-card') || 
                                    htmlEl.tagName === 'H1' || 
                                    htmlEl.tagName === 'H2' || 
                                    htmlEl.tagName === 'H3') {
                                  htmlEl.style.color = 'white';
                                }
                                
                                // 半透明の白いテキスト
                                if (classes.includes('text-white/70') || classes.includes('text-white/60')) {
                                  htmlEl.style.color = 'rgba(255, 255, 255, 0.7)';
                                }
                              });
                              
                              // Flexboxレイアウトを再適用
                              const flexElements = clonedCard.querySelectorAll('.flex, .dna-main-content, .dna-top-section, .dna-profile-section, .dna-stats-grid, .dna-bottom-sections, .profile-left, .profile-info, .favorite-content, .log-content, .card-header');
                              flexElements.forEach((el) => {
                                const htmlEl = el as HTMLElement;
                                htmlEl.style.display = 'flex';
                                
                                if (htmlEl.classList.contains('dna-main-content') || 
                                    htmlEl.classList.contains('dna-top-section') || 
                                    htmlEl.classList.contains('dna-profile-section') || 
                                    htmlEl.classList.contains('dna-bottom-sections') || 
                                    htmlEl.classList.contains('log-content')) {
                                  htmlEl.style.flexDirection = 'column';
                                }
                                
                                if (htmlEl.classList.contains('dna-main-content')) {
                                  htmlEl.style.gap = '28px';
                                }
                                if (htmlEl.classList.contains('dna-top-section')) {
                                  htmlEl.style.flexDirection = 'row';
                                  htmlEl.style.alignItems = 'center';
                                  htmlEl.style.gap = '40px';
                                }
                                if (htmlEl.classList.contains('dna-profile-section')) {
                                  htmlEl.style.flexDirection = 'row';
                                  htmlEl.style.alignItems = 'center';
                                  htmlEl.style.gap = '20px';
                                  htmlEl.style.flexShrink = '0';
                                }
                                if (htmlEl.classList.contains('profile-info')) {
                                  htmlEl.style.display = 'flex';
                                  htmlEl.style.flexDirection = 'column';
                                  htmlEl.style.justifyContent = 'center';
                                }
                                if (htmlEl.classList.contains('dna-stats-grid')) {
                                  htmlEl.style.display = 'grid';
                                  htmlEl.style.gridTemplateColumns = 'repeat(3, 1fr)';
                                  htmlEl.style.gap = '20px';
                                  htmlEl.style.flex = '1';
                                }
                                if (htmlEl.classList.contains('dna-bottom-sections')) {
                                  htmlEl.style.display = 'grid';
                                  htmlEl.style.gridTemplateColumns = '1fr 1fr';
                                  htmlEl.style.gap = '24px';
                                }
                                if (htmlEl.classList.contains('favorite-content')) {
                                  htmlEl.style.flexDirection = 'row';
                                  htmlEl.style.alignItems = 'center';
                                  htmlEl.style.gap = '14px';
                                }
                                if (htmlEl.classList.contains('log-content')) {
                                  htmlEl.style.alignItems = 'center';
                                  htmlEl.style.justifyContent = 'center';
                                }
                              });
                              
                              // フォントサイズとウェイト
                              const h1 = clonedCard.querySelectorAll('h1');
                              h1.forEach((el) => {
                                (el as HTMLElement).style.fontSize = '28px';
                                (el as HTMLElement).style.fontWeight = '700';
                                (el as HTMLElement).style.color = 'white';
                              });
                              
                              const h2 = clonedCard.querySelectorAll('h2');
                              h2.forEach((el) => {
                                (el as HTMLElement).style.fontSize = '20px';
                                (el as HTMLElement).style.fontWeight = '900';
                                (el as HTMLElement).style.color = 'white';
                              });
                              
                              const statValues = clonedCard.querySelectorAll('.stat-value');
                              statValues.forEach((el) => {
                                const htmlEl = el as HTMLElement;
                                htmlEl.style.fontSize = '42px';
                                htmlEl.style.fontWeight = '900';
                                htmlEl.style.marginBottom = '4px';
                              });
                              
                              // 間隔とマージン
                              const mb6 = clonedCard.querySelectorAll('.mb-6');
                              mb6.forEach((el) => {
                                (el as HTMLElement).style.marginBottom = '24px';
                              });
                              
                              const mb4 = clonedCard.querySelectorAll('.mb-4');
                              mb4.forEach((el) => {
                                (el as HTMLElement).style.marginBottom = '16px';
                              });
                              
                              const mb3 = clonedCard.querySelectorAll('.mb-3');
                              mb3.forEach((el) => {
                                (el as HTMLElement).style.marginBottom = '12px';
                              });
                              
                              const mb1 = clonedCard.querySelectorAll('.mb-1');
                              mb1.forEach((el) => {
                                (el as HTMLElement).style.marginBottom = '4px';
                              });
                              
                              // パディング
                              const p4 = clonedCard.querySelectorAll('.p-4');
                              p4.forEach((el) => {
                                (el as HTMLElement).style.padding = '16px';
                              });
                              
                              const p6 = clonedCard.querySelectorAll('.p-6');
                              p6.forEach((el) => {
                                (el as HTMLElement).style.padding = '24px';
                              });
                              
                              // テキストアライン
                              const textCenter = clonedCard.querySelectorAll('.text-center');
                              textCenter.forEach((el) => {
                                (el as HTMLElement).style.textAlign = 'center';
                              });
                              
                              // 2025の枠のスタイルを明示的に適用
                              const allGlassCards = clonedCard.querySelectorAll('.dna-glass-card');
                              allGlassCards.forEach((card) => {
                                const htmlCard = card as HTMLElement;
                                // 2025を含むdna-glass-cardを探す
                                if (htmlCard.textContent?.includes('2025')) {
                                  htmlCard.style.display = 'flex';
                                  htmlCard.style.alignItems = 'center';
                                  htmlCard.style.justifyContent = 'center';
                                  htmlCard.style.padding = '8px 16px';
                                }
                              });
                              
                              // プロフィールセクションの高さを揃える
                              const profileSection = clonedCard.querySelector('.dna-profile-section') as HTMLElement;
                              if (profileSection) {
                                profileSection.style.alignItems = 'center';
                                const profileLeft = profileSection.querySelector('.profile-left') as HTMLElement;
                                const profileInfo = profileSection.querySelector('.profile-info') as HTMLElement;
                                if (profileLeft && profileInfo) {
                                  profileLeft.style.display = 'flex';
                                  profileLeft.style.flexDirection = 'column';
                                  profileLeft.style.alignItems = 'center';
                                  profileInfo.style.display = 'flex';
                                  profileInfo.style.flexDirection = 'column';
                                  profileInfo.style.justifyContent = 'center';
                                }
                              }
                            }
                          },
                          ignoreElements: (element) => {
                            // oklabを含むstyle要素を無視
                            if (element instanceof HTMLStyleElement && element.textContent?.includes('oklab')) {
                              return true;
                            }
                            return false;
                          },
                          useCORS: true,
                          allowTaint: false,
                          logging: false,
                          backgroundColor: null, // 透明背景でカードのグラデーションを保持
                          scale: 2,
                          windowWidth: cardElement.scrollWidth,
                          windowHeight: cardElement.scrollHeight,
                        });
                        const url = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.download = 'anime-dna-card.png';
                        link.href = url;
                        link.click();
                      } finally {
                        // スタイルシートを元に戻す
                        originalStyleSheets.forEach(({ element, disabled, textContent }) => {
                          if (element instanceof HTMLStyleElement && textContent !== undefined) {
                            element.textContent = textContent || '';
                          } else if (element instanceof HTMLLinkElement && disabled !== undefined) {
                            element.disabled = disabled;
                          }
                        });
                      }
                    }
                  } catch (error) {
                    console.error('Failed to save image:', error);
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    alert(`画像の保存に失敗しました。\n\nエラー: ${errorMessage}\n\n詳細はブラウザのコンソール（F12）を確認してください。`);
                  }
                }}
                className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                画像を保存
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex-1 bg-[#e879d4] text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:bg-[#f09fe3] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                シェア
              </button>
            </div>
          </>
        );
      })()}
      
      {/* ハンドル表示/非表示切り替え */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
        <span className="dark:text-white font-medium">ハンドルを非表示</span>
        <button
          onClick={() => setIsHandleVisible(!isHandleVisible)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            !isHandleVisible ? 'bg-[#e879d4]' : 'bg-gray-300 dark:bg-gray-600'
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
              <div className="relative p-6 rounded-3xl shadow-xl mb-4" style={{
                background: 'linear-gradient(165deg, rgba(102, 126, 234, 0.92) 0%, rgba(118, 75, 162, 0.95) 35%, rgba(180, 80, 160, 0.92) 65%, rgba(240, 147, 251, 0.88) 100%)',
              }}>
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
                className="w-full text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2" style={{
                  background: '#e879d4',
                }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f09fe3'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#e879d4'; }}
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
                  <span className="text-xl">{tagInfo?.emoji || '🏷️'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium dark:text-white">{tagInfo?.label || tag}</span>
                      <span className="text-gray-500 dark:text-gray-400">{count}回</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ background: '#e879d4', width: `${percentage}%` }}
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
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleUserSearch}
              disabled={isSearchingUsers}
              className="px-6 py-2 text-white rounded-xl font-medium transition-colors disabled:opacity-50" style={{
                background: '#e879d4',
              }} onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#f09fe3'; }} onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#e879d4'; }}
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
        </div>
      </div>
      
      {/* 設定 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
        <h3 className="font-bold text-lg mb-3 text-[#6b5b6e] dark:text-white">設定</h3>
        <div className="space-y-3">
          {/* DNAカード編集 */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full text-left py-2 text-gray-700 dark:text-gray-300 transition-colors"
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e879d4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
          >
            DNAカード編集
          </button>
          
          {/* ご意見・ご感想 */}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLScfwMPJs8-qazTa9kfnDU6b4gqRLJVleDJkDgeCFDeuJjlxUQ/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-left py-2 text-gray-700 dark:text-gray-300 transition-colors block"
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e879d4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
          >
            ご意見・ご感想
          </a>
          
          {/* データをエクスポート */}
          <button
            onClick={() => {}}
            className="w-full text-left py-2 text-gray-700 dark:text-gray-300 transition-colors"
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e879d4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
          >
            データをエクスポート
          </button>
          
          {/* 自分のID表示 */}
          {user && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">自分のID</p>
                  <p className="text-sm font-mono dark:text-white truncate">
                    {isIdVisible ? user.id : 'XXXX'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setIsIdVisible(true);
                    try {
                      await navigator.clipboard.writeText(user.id);
                      alert('IDをクリップボードにコピーしました');
                    } catch (error) {
                      console.error('Failed to copy ID:', error);
                      alert('IDのコピーに失敗しました');
                    }
                  }}
                  className="ml-3 px-3 py-1.5 text-white rounded-lg text-xs font-medium transition-colors shrink-0" style={{
                    background: '#e879d4',
                  }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f09fe3'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#e879d4'; }}
                  title="IDをコピー"
                >
                  コピー
                </button>
              </div>
            </div>
          )}
          
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
