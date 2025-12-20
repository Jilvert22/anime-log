'use client';

import { useState } from 'react';

// サンプルデータ
const sampleAnimes = [
  { id: 1, title: 'ダンダダン', image: '🎃', rating: 5, watched: true },
  { id: 2, title: '葬送のフリーレン', image: '🧝', rating: 5, watched: true },
  { id: 3, title: 'ぼっち・ざ・ろっく！', image: '🎸', rating: 5, watched: true },
];

// 評価ラベル
const ratingLabels: { [key: number]: { label: string; emoji: string } } = {
  5: { label: '神作', emoji: '🏆' },
  4: { label: '円盤級', emoji: '💿' },
  3: { label: '良作', emoji: '😊' },
  2: { label: '完走', emoji: '🏃' },
  1: { label: '虚無', emoji: '😇' },
};

// アニメの型定義
type Anime = {
  id: number;
  title: string;
  image: string;
  rating: number;
  watched: boolean;
};

// アニメカード
function AnimeCard({ anime, onClick }: { anime: Anime; onClick: () => void }) {
  const rating = ratingLabels[anime.rating];
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer hover:scale-105 hover:shadow-xl transition-all"
    >
      <div className="aspect-[3/4] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl">
        {anime.image}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm truncate">{anime.title}</p>
        {rating && (
          <p className="text-xs text-orange-500 font-bold">
            {rating.emoji} {rating.label}
          </p>
        )}
      </div>
    </div>
  );
}

// メインページ
export default function Home() {
  const [animes] = useState<Anime[]>(sampleAnimes);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            俺のアニメログ
          </h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 統計カード */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white mb-6">
          <p className="text-white/80 text-sm">視聴済み</p>
          <p className="text-4xl font-black">{animes.length}作品</p>
        </div>

        {/* アニメ一覧 */}
        <h2 className="font-bold text-lg mb-3">2024年秋</h2>
        <div className="grid grid-cols-3 gap-3">
          {animes.map((anime) => (
            <AnimeCard 
              key={anime.id} 
              anime={anime}
              onClick={() => setSelectedAnime(anime)}
            />
          ))}
        </div>

        {/* 追加ボタン */}
        <button className="w-full mt-6 py-4 border-2 border-dashed border-indigo-300 rounded-2xl text-indigo-600 font-bold">
          + アニメを追加
        </button>
      </main>

      {/* モーダル */}
      {selectedAnime && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAnime(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <span className="text-6xl">{selectedAnime.image}</span>
              <h3 className="text-xl font-bold mt-2">{selectedAnime.title}</h3>
            </div>
            <button 
              onClick={() => setSelectedAnime(null)}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}