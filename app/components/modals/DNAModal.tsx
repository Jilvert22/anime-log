'use client';

import type { Anime } from '../../types';

export function DNAModal({
  show,
  onClose,
  allAnimes,
  favoriteAnimeIds,
  count,
  averageRating,
  totalRewatchCount,
  userName,
  userIcon,
  userHandle,
  userOtakuType,
}: {
  show: boolean;
  onClose: () => void;
  allAnimes: Anime[];
  favoriteAnimeIds: number[];
  count: number;
  averageRating: number;
  totalRewatchCount: number;
  userName: string;
  userIcon: string;
  userHandle: string;
  userOtakuType: string;
}) {
  if (!show) return null;

  // オタクタイプから絵文字を除去する関数
  const getOtakuTypeLabel = (type: string): string => {
    return type.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
  };
  
  const otakuTypeLabel = userOtakuType ? getOtakuTypeLabel(userOtakuType) : '音響派';

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* DNAカード */}
        <div 
          className="dna-card-container relative rounded-3xl p-6 shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(165deg, rgba(102, 126, 234, 0.92) 0%, rgba(118, 75, 162, 0.95) 35%, rgba(180, 80, 160, 0.92) 65%, rgba(240, 147, 251, 0.88) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="dna-logo-icon"></div>
              <h2 className="text-white text-xl font-black">ANIME DNA</h2>
            </div>
            <div className="dna-glass-card px-4 py-2">
              <span className="text-white text-sm font-semibold">{new Date().getFullYear()}</span>
            </div>
          </div>
          
          {/* プロフィールセクション */}
          <div className="flex flex-col gap-4 mb-6">
            {/* アバター */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full dna-glass-card flex items-center justify-center overflow-hidden shadow-lg">
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
                        placeholder.className = 'w-full h-full bg-white/20';
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-white/20"></div>
                )}
              </div>
            </div>
            
            {/* タイプバッジ */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl" style={{
                background: 'linear-gradient(135deg, #ff6b9d, #ff8a65)',
                boxShadow: '0 4px 15px rgba(255, 107, 157, 0.4)',
              }}>
                <div className="dna-type-icon"></div>
                <span className="text-white text-base font-semibold">{otakuTypeLabel}</span>
              </div>
            </div>
            
            {/* ユーザー名とハンドル */}
            <div className="text-center">
              <p className="text-white text-xl font-bold mb-1">
                {userName}
              </p>
              {userHandle ? (
                <p className="text-white/70 text-sm">
                  @{userHandle}
                </p>
              ) : null}
            </div>
          </div>
          
          {/* 統計グリッド（3カラム） */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="dna-glass-card p-4 text-center hover:transform hover:-translate-y-1 transition-all cursor-pointer">
              <p className="text-white text-2xl font-black mb-1" style={{ color: '#00d4ff' }}>{count}</p>
              <p className="text-white/70 text-xs">作品数</p>
            </div>
            <div className="dna-glass-card p-4 text-center hover:transform hover:-translate-y-1 transition-all cursor-pointer">
              <p className="text-white text-2xl font-black mb-1" style={{ color: '#ff6b9d' }}>{totalRewatchCount}</p>
              <p className="text-white/70 text-xs">視聴週</p>
            </div>
            <div className="dna-glass-card p-4 text-center hover:transform hover:-translate-y-1 transition-all cursor-pointer">
              <p className="text-white text-2xl font-black mb-1" style={{ color: '#ffd700' }}>
                {averageRating > 0 ? `${averageRating.toFixed(1)}` : '0.0'}
              </p>
              <p className="text-white/70 text-xs">平均評価</p>
            </div>
          </div>
          
          {/* 最推し作品 & アニメログ */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* 最推し作品 */}
            <div className="flex-1 dna-glass-card p-4 min-h-[200px]">
              <div className="flex items-center mb-4">
                <div className="dna-trophy-icon"></div>
                <h3 className="text-white text-base font-semibold">最推し作品</h3>
              </div>
              {favoriteAnimeIds.length > 0 ? (
                <div className="flex justify-center gap-3">
                  {favoriteAnimeIds
                    .map(id => allAnimes.find(a => a.id === id))
                    .filter((a): a is Anime => a !== undefined)
                    .slice(0, 3)
                    .map((anime) => {
                      const isImageUrl = anime.image && (anime.image.startsWith('http://') || anime.image.startsWith('https://'));
                      return (
                        <div
                          key={anime.id}
                          className="dna-glass-card w-20 h-28 flex items-center justify-center overflow-hidden"
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
                                  placeholder.className = 'w-full h-full bg-white/10';
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-white/10"></div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-20 dna-glass-card mx-auto mb-3 flex items-center justify-center">
                      <div className="w-full h-full bg-white/10"></div>
                    </div>
                    <p className="text-white/70 text-sm">まだ最推し作品が</p>
                    <p className="text-white/70 text-sm">登録されていません</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* アニメログ */}
            <div className="flex-1 dna-glass-card p-4 min-h-[200px]">
              <div className="flex items-center mb-4">
                <div className="dna-chart-icon">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <h3 className="text-white text-base font-semibold">アニメログ</h3>
              </div>
              <div className="flex flex-col items-center justify-center h-full">
                <div className="dna-pen-icon mb-3"></div>
                <p className="text-white/70 text-sm text-center mb-4">視聴記録を追加しよう</p>
                <button className="text-white/80 text-xs hover:text-white transition-colors">
                  すべて見る →
                </button>
              </div>
            </div>
          </div>
          
          {/* フッター */}
          <div className="text-center pt-4 border-t border-white/15">
            <p className="text-white/60 text-xs">SCAN TO VIEW PROFILE</p>
          </div>
        </div>
        
        {/* ボタン */}
        <div className="flex gap-3">
          <button
            onClick={() => {}}
            className="flex-1 dna-glass-card text-white py-3 rounded-xl font-bold hover:bg-white/15 transition-colors"
          >
            保存
          </button>
          <button
            onClick={() => {}}
            className="flex-1 dna-glass-card text-white py-3 rounded-xl font-bold hover:bg-white/15 transition-colors"
          >
            シェア
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-500 dark:text-gray-400 text-sm"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
