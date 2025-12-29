'use client';

import { useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import type { Anime, Season } from '../../../types';
import { otakuTypes } from '../../../constants';
import { QRCodeSVG } from 'qrcode.react';
import DNACardForExport from './DNACardForExport';

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
  const [isSaving, setIsSaving] = useState(false);

  // オタクタイプの判定用のタグカウント
  const tagCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    allAnimes.forEach(anime => {
      anime.tags?.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [allAnimes]);

  // オタクタイプから絵文字を除去する関数
  const getOtakuTypeLabel = (type: string): string => {
    return type.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
  };

  // オタクタイプから絵文字を抽出する関数
  const getOtakuTypeEmoji = (type: string): string => {
    const emojiMatch = type.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu);
    return emojiMatch ? emojiMatch[0] : '🎵';
  };

  // オタクタイプの表示テキスト
  const otakuTypeDisplay = useMemo(() => {
    if (!userOtakuType) {
      // 自動判定
      if (tagCounts['考察'] && tagCounts['考察'] >= 3) {
        return '考察厨';
      } else if (tagCounts['泣ける'] && tagCounts['泣ける'] >= 3) {
        return '感情移入型';
      } else if (tagCounts['作画神'] && tagCounts['作画神'] >= 3) {
        return '作画厨';
      } else if (tagCounts['音楽最高'] && tagCounts['音楽最高'] >= 3) {
        return '音響派';
      } else if (tagCounts['キャラ萌え'] && tagCounts['キャラ萌え'] >= 3) {
        return 'キャラオタ';
      } else if (tagCounts['熱い'] && tagCounts['熱い'] >= 3) {
        return '熱血派';
      }
      return '音響派'; // デフォルト
    }
    // ID形式をラベルに変換
    if (OTAKU_TYPE_ID_TO_LABEL[userOtakuType]) {
      return OTAKU_TYPE_ID_TO_LABEL[userOtakuType].label;
    }
    // カスタム入力またはプリセットタイプ（絵文字付きの可能性があるので除去）
    const isPresetType = otakuTypes.some(t => t.value === userOtakuType);
    if (isPresetType) {
      return getOtakuTypeLabel(userOtakuType);
    }
    // カスタムテキストの場合（絵文字が含まれている可能性があるので除去）
    return getOtakuTypeLabel(userOtakuType);
  }, [userOtakuType, tagCounts]);

  // 最推し作品のデータを準備
  const favoriteAnimesData = useMemo(() => {
    return favoriteAnimeIds
      .map(id => allAnimes.find(a => a.id === id))
      .filter((a): a is Anime => a !== undefined)
      .slice(0, 5)
      .map(anime => ({
        id: String(anime.id),
        title: anime.title,
        imageUrl: anime.image && (anime.image.startsWith('http://') || anime.image.startsWith('https://')) ? anime.image : undefined,
      }));
  }, [favoriteAnimeIds, allAnimes]);
  
  // ユーザーが設定したオタクタイプを使用、なければ自動判定（表示用）
  const { otakuTypeValue, otakuTypeLabel, otakuTypeEmoji } = useMemo(() => {
    let value = userOtakuType || '🎵 音響派';
    let label = '音響派';
    let emoji = '🎵';
    
    if (!userOtakuType) {
      // 自動判定
      if (tagCounts['考察'] && tagCounts['考察'] >= 3) {
        value = '🔍 考察厨';
        label = '考察厨';
        emoji = '🔍';
      } else if (tagCounts['泣ける'] && tagCounts['泣ける'] >= 3) {
        value = '😭 感情移入型';
        label = '感情移入型';
        emoji = '😭';
      } else if (tagCounts['作画神'] && tagCounts['作画神'] >= 3) {
        value = '🎨 作画厨';
        label = '作画厨';
        emoji = '🎨';
      } else if (tagCounts['音楽最高'] && tagCounts['音楽最高'] >= 3) {
        value = '🎵 音響派';
        label = '音響派';
        emoji = '🎵';
      } else if (tagCounts['キャラ萌え'] && tagCounts['キャラ萌え'] >= 3) {
        value = '💕 キャラオタ';
        label = 'キャラオタ';
        emoji = '💕';
      } else if (tagCounts['熱い'] && tagCounts['熱い'] >= 3) {
        value = '🔥 熱血派';
        label = '熱血派';
        emoji = '🔥';
      }
    } else {
      // ID形式（slice_of_lifeなど）をラベルに変換
      if (OTAKU_TYPE_ID_TO_LABEL[userOtakuType]) {
        label = OTAKU_TYPE_ID_TO_LABEL[userOtakuType].label;
        emoji = OTAKU_TYPE_ID_TO_LABEL[userOtakuType].emoji;
        value = `${OTAKU_TYPE_ID_TO_LABEL[userOtakuType].emoji} ${OTAKU_TYPE_ID_TO_LABEL[userOtakuType].label}`;
      } else {
        // カスタム入力またはプリセットタイプ（絵文字付き）
        const isPresetType = otakuTypes.some(t => t.value === userOtakuType);
        if (isPresetType) {
          label = getOtakuTypeLabel(userOtakuType);
          emoji = getOtakuTypeEmoji(userOtakuType);
          value = userOtakuType;
        } else {
          // カスタムテキストの場合
          label = userOtakuType;
          value = userOtakuType;
          emoji = getOtakuTypeEmoji(userOtakuType);
        }
      }
    }
    
    return { otakuTypeValue: value, otakuTypeLabel: label, otakuTypeEmoji: emoji };
  }, [userOtakuType, tagCounts]);

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
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src="/dna-icon.png"
                alt="Anime DNA"
                width={56}
                height={56}
                className="rounded-lg"
                style={{
                  backgroundColor: 'transparent',
                  background: 'transparent',
                  imageRendering: 'crisp-edges',
                  display: 'block',
                }}
              />
            </div>
            <h2 className="text-white text-2xl font-black">ANIME DNA</h2>
          </div>
        </div>
        
        {/* プロフィールセクション（1列、横並び） */}
        <div className="flex items-center gap-4 sm:gap-6 mb-6">
          {/* アバター */}
          <div className="flex-shrink-0">
            {userIcon && (userIcon.startsWith('http://') || userIcon.startsWith('https://') || userIcon.startsWith('data:')) ? (
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
                <img
                  src={userIcon}
                  alt="アイコン"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-placeholder')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'fallback-placeholder w-full h-full bg-white/10 flex items-center justify-center';
                      const span = document.createElement('span');
                      span.className = 'text-3xl sm:text-4xl';
                      span.textContent = '👤';
                      placeholder.appendChild(span);
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl bg-white/10 border-2 border-white/30 flex items-center justify-center shadow-lg">
                <span className="text-3xl sm:text-4xl">👤</span>
              </div>
            )}
          </div>

          {/* ユーザー情報 */}
          <div className="flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white" style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}>
              {userName || 'ユーザー'}
            </h2>
            {userHandle && (
              <p className="text-sm sm:text-base text-white/70">
                {!isHandleVisible ? `@${userHandle}` : '@XXXX'}
              </p>
            )}
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white mt-1 w-fit" style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}>
              {otakuTypeDisplay}
            </span>
          </div>
        </div>

        {/* 最推し作品セクション */}
        <div>
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
                <div className="card-title text-base md:text-lg lg:text-xl font-bold text-white flex items-center gap-2 md:gap-3">
                  <span>🏆</span>
                  <span>最推し作品</span>
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
      
      {/* ボタン */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={async () => {
            // 確認ダイアログ
            if (!confirm('ANIME DNAカードを画像として保存しますか？')) {
              return;
            }
            
            setIsSaving(true);

            try {
              // 1. 一時的なコンテナを作成
              const container = document.createElement('div');
              container.style.position = 'absolute';
              container.style.left = '-9999px';
              container.style.top = '0';
              document.body.appendChild(container);

              // 2. 保存用データを準備（統計情報なし）
              const exportData = {
                userName: userName || 'ユーザー',
                userHandle,
                avatarUrl: userIcon,
                otakuTypeDisplay,
                favoriteAnimes: favoriteAnimesData,
              };

              // 3. ReactDOMでレンダリング
              const root = createRoot(container);
              
              await new Promise<void>((resolve) => {
                root.render(<DNACardForExport {...exportData} />);
                // レンダリング完了を待つ
                setTimeout(resolve, 500);
              });

              // 4. 画像を読み込む時間を待つ（プロキシ経由の画像取得を待つ）
              await new Promise(resolve => setTimeout(resolve, 1500));

              // 5. html2canvasで画像化
              const targetElement = container.firstChild as HTMLElement;
              
              if (!targetElement) {
                throw new Error('レンダリングされた要素が見つかりません');
              }

              const canvas = await html2canvas(targetElement, {
                scale: 2, // 高解像度
                useCORS: true, // 外部画像のCORS対応
                allowTaint: false,
                backgroundColor: null,
                logging: false,
              });

              // 6. ダウンロード
              const link = document.createElement('a');
              link.download = `anime-dna-${Date.now()}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();

              // 7. クリーンアップ
              root.unmount();
              document.body.removeChild(container);

            } catch (error) {
              console.error('画像保存エラー:', error);
              const errorMessage = error instanceof Error ? error.message : String(error);
              alert(`画像の保存に失敗しました。\n\nエラー: ${errorMessage}\n\n詳細はブラウザのコンソール（F12）を確認してください。`);
            } finally {
              setIsSaving(false);
            }
          }}
          disabled={isSaving}
          className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 py-3 rounded-xl font-bold shadow-md hover:border-[#e879d4] hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] font-mixed disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? '保存中...' : '画像を保存'}
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
