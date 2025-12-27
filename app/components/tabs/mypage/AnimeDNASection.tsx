'use client';

import { useState } from 'react';
import type { Anime, Season } from '../../../types';
import { otakuTypes } from '../../../constants';
import { QRCodeSVG } from 'qrcode.react';

// SettingsModalと同じID→ラベルのマッピング
const OTAKU_TYPE_ID_TO_LABEL: { [key: string]: { emoji: string; label: string } } = {
  'analyst': { emoji: '🔍', label: '考察厨' },
  'emotional': { emoji: '😭', label: '感情移入型' },
  'visual': { emoji: '🎨', label: '作画厨' },
  'audio': { emoji: '🎵', label: '音響派' },
  'character': { emoji: '💕', label: 'キャラオタ' },
  'passionate': { emoji: '🔥', label: '熱血派' },
  'story': { emoji: '🎬', label: 'ストーリー重視' },
  'slice_of_life': { emoji: '🌸', label: '日常系好き' },
  'battle': { emoji: '⚔️', label: 'バトル好き' },
  'entertainment': { emoji: '🎪', label: 'エンタメ重視' },
};

interface AnimeDNASectionProps {
  allAnimes: Anime[];
  seasons: Season[];
  userName: string;
  userIcon: string | null;
  userHandle: string | null;
  userOtakuType: string;
  setUserOtakuType: (type: string) => void;
  favoriteAnimeIds: number[];
  setFavoriteAnimeIds: (ids: number[]) => void;
  averageRating: number;
  setShowFavoriteAnimeModal: (show: boolean) => void;
  onOpenDNAModal: () => void;
}

export default function AnimeDNASection({
  allAnimes,
  seasons,
  userName,
  userIcon,
  userHandle,
  userOtakuType,
  setUserOtakuType,
  favoriteAnimeIds,
  setFavoriteAnimeIds,
  averageRating,
  setShowFavoriteAnimeModal,
  onOpenDNAModal,
}: AnimeDNASectionProps) {
  const [isHandleVisible, setIsHandleVisible] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingFavoriteAnime, setEditingFavoriteAnime] = useState(false);

  const count = allAnimes.filter(a => a.watched === true).length;
  const totalRewatchCount = allAnimes.reduce((sum, a) => sum + (a.rewatchCount ?? 0), 0);
  const ratings = allAnimes.filter(a => a.rating > 0).map(a => a.rating);
  const calculatedAverageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
  
  // オタクタイプの判定
  const tagCounts: { [key: string]: number } = {};
  allAnimes.forEach(anime => {
    anime.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  // オタクタイプから絵文字を除去する関数
  const getOtakuTypeLabel = (type: string): string => {
    return type.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
  };

  // オタクタイプから絵文字を抽出する関数
  const getOtakuTypeEmoji = (type: string): string => {
    const emojiMatch = type.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu);
    return emojiMatch ? emojiMatch[0] : '🎵';
  };
  
  // ユーザーが設定したオタクタイプを使用、なければ自動判定
  let otakuTypeValue = userOtakuType || '🎵 音響派';
  let otakuTypeLabel = '音響派';
  let otakuTypeEmoji = '🎵';
  if (!userOtakuType) {
    // 自動判定
    if (tagCounts['考察'] && tagCounts['考察'] >= 3) {
      otakuTypeValue = '🔍 考察厨';
      otakuTypeLabel = '考察厨';
      otakuTypeEmoji = '🔍';
    } else if (tagCounts['泣ける'] && tagCounts['泣ける'] >= 3) {
      otakuTypeValue = '😭 感情移入型';
      otakuTypeLabel = '感情移入型';
      otakuTypeEmoji = '😭';
    } else if (tagCounts['作画神'] && tagCounts['作画神'] >= 3) {
      otakuTypeValue = '🎨 作画厨';
      otakuTypeLabel = '作画厨';
      otakuTypeEmoji = '🎨';
    } else if (tagCounts['音楽最高'] && tagCounts['音楽最高'] >= 3) {
      otakuTypeValue = '🎵 音響派';
      otakuTypeLabel = '音響派';
      otakuTypeEmoji = '🎵';
    } else if (tagCounts['キャラ萌え'] && tagCounts['キャラ萌え'] >= 3) {
      otakuTypeValue = '💕 キャラオタ';
      otakuTypeLabel = 'キャラオタ';
      otakuTypeEmoji = '💕';
    } else if (tagCounts['熱い'] && tagCounts['熱い'] >= 3) {
      otakuTypeValue = '🔥 熱血派';
      otakuTypeLabel = '熱血派';
      otakuTypeEmoji = '🔥';
    }
  } else {
    // ID形式（slice_of_lifeなど）をラベルに変換
    if (OTAKU_TYPE_ID_TO_LABEL[userOtakuType]) {
      otakuTypeLabel = OTAKU_TYPE_ID_TO_LABEL[userOtakuType].label;
      otakuTypeEmoji = OTAKU_TYPE_ID_TO_LABEL[userOtakuType].emoji;
      otakuTypeValue = `${OTAKU_TYPE_ID_TO_LABEL[userOtakuType].emoji} ${OTAKU_TYPE_ID_TO_LABEL[userOtakuType].label}`;
    } else {
      // カスタム入力またはプリセットタイプ（絵文字付き）
      const isPresetType = otakuTypes.some(t => t.value === userOtakuType);
      if (isPresetType) {
        otakuTypeLabel = getOtakuTypeLabel(userOtakuType);
        otakuTypeEmoji = getOtakuTypeEmoji(userOtakuType);
        otakuTypeValue = userOtakuType;
      } else {
        // カスタムテキストの場合
        otakuTypeLabel = userOtakuType;
        otakuTypeValue = userOtakuType;
        otakuTypeEmoji = getOtakuTypeEmoji(userOtakuType);
      }
    }
  }

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
        </div>
        
        {/* メインコンテンツ */}
        <div className="dna-main-content">
          {/* 上部セクション: プロフィール + 統計（デスクトップで横並び） */}
          <div className="dna-top-section">
            {/* プロフィールセクション */}
            <section className="dna-profile-section">
              <div className="profile-left relative">
                {/* アバター */}
                <div 
                  className="w-[135px] h-[135px] md:w-[150px] md:h-[150px] lg:w-[180px] lg:h-[180px] rounded-[18px] md:rounded-xl lg:rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border-2 border-white/40"
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
                
                {/* タイプバッジ（表示のみ） */}
                <div
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-sm border border-white/50" 
                  style={{
                    background: 'rgba(255, 255, 255, 0.35)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    boxShadow: '0 2px 8px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.3)'
                  }}
                >
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
                ) : null}
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
                  {calculatedAverageRating > 0 ? `${calculatedAverageRating.toFixed(1)}` : '0.0'}
                </p>
                <p className="stat-label text-xs md:text-[11px] lg:text-[13px] text-white/70 uppercase" style={{ letterSpacing: '0.5px' }}>平均評価</p>
              </div>
            </section>
          </div>
          
          {/* 下部セクション: 最推し作品（全幅） */}
          <div className="dna-bottom-section">
            {/* 最推し作品（クリックで編集） */}
            <div 
              className="content-card p-5 md:p-6 lg:p-8 backdrop-blur-md border border-white/30 rounded-xl cursor-pointer hover:border-white/50 transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.2)'
              }}
              onClick={() => {
                setEditingFavoriteAnime(true);
                setShowFavoriteAnimeModal(true);
              }}
            >
              <div className="card-header flex items-center justify-between mb-4 md:mb-5">
                <div className="card-title text-sm md:text-base lg:text-lg font-semibold text-white flex items-center gap-2 md:gap-3">
                  <span className="dna-trophy-icon"></span>
                  最推し作品
                </div>
              </div>
              {favoriteAnimeIds.length > 0 ? (
                <div className="favorite-content-grid flex flex-wrap justify-center gap-6 md:gap-8">
                  {favoriteAnimeIds
                    .map(id => allAnimes.find(a => a.id === id))
                    .filter((a): a is Anime => a !== undefined)
                    .slice(0, 5)
                    .map((anime) => {
                      const isImageUrl = anime.image && (anime.image.startsWith('http://') || anime.image.startsWith('https://'));
                      return (
                        <div
                          key={anime.id}
                          className="favorite-poster w-[90px] h-[126px] md:w-[105px] md:h-[147px] lg:w-[120px] lg:h-[168px] rounded-lg md:rounded-xl flex items-center justify-center overflow-hidden backdrop-blur-md border border-white/30 relative group"
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFavoriteAnimeIds(favoriteAnimeIds.filter(fid => fid !== anime.id));
                              localStorage.setItem('favoriteAnimeIds', JSON.stringify(favoriteAnimeIds.filter(fid => fid !== anime.id)));
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="favorite-content flex items-center justify-center flex-1 py-8">
                  <div className="favorite-empty text-center text-white/70 text-sm md:text-base lg:text-lg leading-relaxed">
                    <div className="favorite-poster w-[90px] h-[126px] md:w-[105px] md:h-[147px] lg:w-[120px] lg:h-[168px] mx-auto mb-4 flex items-center justify-center rounded-lg md:rounded-xl backdrop-blur-md border border-white/30" style={{
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%)',
                    }}>
                      <div className="film-icon w-6 h-5 md:w-7 md:h-5.5 lg:w-7 lg:h-6 border-2 border-white/30 rounded-sm"></div>
                    </div>
                    <p>クリックして最推し作品を</p>
                    <p>追加しましょう</p>
                  </div>
                </div>
              )}
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
                        const flexElements = clonedCard.querySelectorAll('.flex, .dna-main-content, .dna-top-section, .dna-profile-section, .dna-stats-grid, .dna-bottom-section, .profile-left, .profile-info, .favorite-content, .card-header');
                        flexElements.forEach((el) => {
                          const htmlEl = el as HTMLElement;
                          htmlEl.style.display = 'flex';
                          
                          if (htmlEl.classList.contains('dna-main-content') || 
                              htmlEl.classList.contains('dna-top-section') || 
                              htmlEl.classList.contains('dna-profile-section') || 
                              htmlEl.classList.contains('dna-bottom-section')) {
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
                          if (htmlEl.classList.contains('dna-bottom-section')) {
                            htmlEl.style.display = 'block';
                            htmlEl.style.width = '100%';
                          }
                          if (htmlEl.classList.contains('favorite-content')) {
                            htmlEl.style.flexDirection = 'row';
                            htmlEl.style.alignItems = 'center';
                            htmlEl.style.justifyContent = 'center';
                            htmlEl.style.gap = '16px';
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
                            
                            // プロフィール画像のサイズを保存用に調整（100pxに固定）
                            // profile-leftの最初の子要素がアバター要素
                            if (profileLeft.firstElementChild) {
                              const avatarElement = profileLeft.firstElementChild as HTMLElement;
                              avatarElement.style.width = '100px';
                              avatarElement.style.height = '100px';
                              avatarElement.style.minWidth = '100px';
                              avatarElement.style.minHeight = '100px';
                              avatarElement.style.maxWidth = '100px';
                              avatarElement.style.maxHeight = '100px';
                            }
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
          className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 py-3 rounded-xl font-bold shadow-md hover:border-[#e879d4] hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] font-mixed"
        >
          画像を保存
        </button>
        <button
          onClick={() => setShowShareModal(true)}
          className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 py-3 rounded-xl font-bold shadow-md hover:border-[#e879d4] hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] font-mixed"
        >
          シェア
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
              <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white font-mixed">シェア</h3>
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
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium font-mixed">
                QRコードをスキャンしてプロフィールを開く
              </p>
            </div>

            {/* リンクコピー */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-mixed">プロフィールURL</p>
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
                className="w-full text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 font-mixed" style={{
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
                className="w-full mt-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 font-mixed"
              >
                <span>📤</span>
                <span>アプリでシェア</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
