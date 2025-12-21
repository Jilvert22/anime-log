'use client';

import { useState, useEffect } from 'react';

// シーズンの型定義
type Season = {
  name: string;
  animes: Anime[];
};

// アニメの型定義
type Anime = {
  id: number;
  title: string;
  image: string;
  rating: number;
  watched: boolean;
  rewatchCount?: number;
  tags?: string[];
  songs?: {
    op?: { title: string; artist: string; rating: number; isFavorite: boolean };
    ed?: { title: string; artist: string; rating: number; isFavorite: boolean };
  };
  quotes?: { text: string; character?: string }[];
};

// タグ一覧
const availableTags = [
  { emoji: '😭', label: '泣ける', value: '泣ける' },
  { emoji: '🔥', label: '熱い', value: '熱い' },
  { emoji: '🤣', label: '笑える', value: '笑える' },
  { emoji: '🤔', label: '考察', value: '考察' },
  { emoji: '✨', label: '作画神', value: '作画神' },
  { emoji: '🎵', label: '音楽最高', value: '音楽最高' },
  { emoji: '💕', label: 'キャラ萌え', value: 'キャラ萌え' },
];

// 実績の型定義
type Achievement = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: number;
};

// 布教リストの型定義
type EvangelistList = {
  id: number;
  title: string;
  description: string;
  animeIds: number[];
  createdAt: Date;
};

// 推しキャラの型定義
type FavoriteCharacter = {
  id: number;
  name: string;
  animeId: number;
  animeName: string;
  image: string;
  category: string;
  tags: string[];
};

// プリセットカテゴリ
const characterCategories = [
  { emoji: '❤️', label: 'シンプルに好き', value: 'シンプルに好き' },
  { emoji: '💒', label: '嫁/婿', value: '嫁/婿' },
  { emoji: '💕', label: '推し', value: '推し' },
  { emoji: '🛡️', label: '守りたい系', value: '守りたい系' },
  { emoji: '🔥', label: 'かっこいい系', value: 'かっこいい系' },
  { emoji: '😇', label: '尊い系', value: '尊い系' },
  { emoji: '🎭', label: 'ギャップ萌え', value: 'ギャップ萌え' },
  { emoji: '💀', label: '闇属性', value: '闇属性' },
  { emoji: '🤡', label: '推せる馬鹿', value: '推せる馬鹿' },
];

// プリセットタグ
const characterPresetTags = [
  'ツンデレ', 'ヤンデレ', 'クーデレ', '天然',
  '幼馴染', '先輩', '後輩', 'ライバル',
  'メガネ', '黒髪', '銀髪', 'ケモミミ',
  'お嬢様', 'ギャル', '清楚', 'ボクっ娘',
];

// サンプルデータ（推しキャラ）
const sampleFavoriteCharacters: FavoriteCharacter[] = [
  { id: 1, name: 'モモ', animeId: 1, animeName: 'ダンダダン', image: '👻', category: '推し', tags: ['ギャル', '天然'] },
  { id: 2, name: 'フリーレン', animeId: 2, animeName: '葬送のフリーレン', image: '🧝', category: '尊い系', tags: ['クーデレ', '銀髪'] },
  { id: 3, name: '後藤ひとり', animeId: 4, animeName: 'ぼっち・ざ・ろっく！', image: '🎸', category: '守りたい系', tags: ['黒髪', '天然'] },
];

// 実績データ
const achievements: Achievement[] = [
  { id: 'first', name: '初めの一歩', desc: '初めてアニメを登録', icon: '🌱', rarity: 'common', condition: 1 },
  { id: 'ten', name: '駆け出しオタク', desc: '10作品視聴', icon: '📺', rarity: 'common', condition: 10 },
  { id: 'fifty', name: '中堅オタク', desc: '50作品視聴', icon: '🎖️', rarity: 'rare', condition: 50 },
  { id: 'hundred', name: '歴戦の猛者', desc: '100作品視聴', icon: '🏅', rarity: 'epic', condition: 100 },
  { id: 'rewatch3', name: '反復横跳び', desc: '1作品を3周', icon: '🔄', rarity: 'common', condition: 3 },
  { id: 'rewatch10', name: '周回の鬼', desc: '1作品を10周', icon: '🌀', rarity: 'legendary', condition: 10 },
  { id: 'godtaste', name: '神の舌', desc: '⭐5を10作品つける', icon: '👑', rarity: 'rare', condition: 10 },
];

// サンプルデータ
const sampleSeasons: Season[] = [
  {
    name: '2024年秋',
    animes: [
      {
        id: 1,
        title: 'ダンダダン',
        image: '🎃',
        rating: 5,
        watched: true,
        rewatchCount: 2,
        tags: ['熱い', '作画神'],
        songs: {
          op: { title: 'オトノケ', artist: 'Creepy Nuts', rating: 5, isFavorite: true },
          ed: { title: 'TAIDADA', artist: 'ずっと真夜中でいいのに。', rating: 4, isFavorite: false },
        },
        quotes: [
          { text: 'オカルンって呼んでいい？', character: 'モモ' },
        ],
      },
      {
        id: 2,
        title: '葬送のフリーレン',
        image: '🧝',
        rating: 5,
        watched: true,
        rewatchCount: 5,
        tags: ['泣ける', '考察'],
        songs: {
          op: { title: '勇者', artist: 'YOASOBI', rating: 5, isFavorite: true },
          ed: { title: 'Anytime Anywhere', artist: 'milet', rating: 5, isFavorite: true },
        },
        quotes: [
          { text: '人間の寿命は短いね', character: 'フリーレン' },
          { text: '魔法はイメージだ', character: 'フリーレン' },
        ],
      },
    ],
  },
  {
    name: '2024年夏',
    animes: [
      { id: 3, title: '推しの子 2期', image: '🌟', rating: 5, watched: true, rewatchCount: 3 },
    ],
  },
  {
    name: '2024年冬',
    animes: [
      {
        id: 4,
        title: 'ぼっち・ざ・ろっく！',
        image: '🎸',
        rating: 5,
        watched: true,
        rewatchCount: 8,
        tags: ['笑える', '音楽最高'],
        songs: {
          op: { title: '青春コンプレックス', artist: '結束バンド', rating: 5, isFavorite: true },
          ed: { title: 'カラカラ', artist: '結束バンド', rating: 5, isFavorite: false },
        },
        quotes: [
          { text: 'ギターと友達になれたんだね', character: '虹夏' },
        ],
      },
    ],
  },
];

// 評価ラベル
const ratingLabels: { [key: number]: { label: string; emoji: string } } = {
  5: { label: '神作', emoji: '🏆' },
  4: { label: '円盤級', emoji: '💿' },
  3: { label: '良作', emoji: '😊' },
  2: { label: '完走', emoji: '🏃' },
  1: { label: '虚無', emoji: '😇' },
};

// マイページタブコンポーネント
function ProfileTab({
  allAnimes,
  userName,
  userIcon,
  averageRating,
  isDarkMode,
  setIsDarkMode,
  setShowSettings,
  evangelistLists,
  setEvangelistLists,
  setSelectedAnime,
  favoriteCharacters,
  setFavoriteCharacters,
}: {
  allAnimes: Anime[];
  userName: string;
  userIcon: string;
  averageRating: number;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  setShowSettings: (value: boolean) => void;
  evangelistLists: EvangelistList[];
  setEvangelistLists: (lists: EvangelistList[]) => void;
  setSelectedAnime: (anime: Anime | null) => void;
  favoriteCharacters: FavoriteCharacter[];
  setFavoriteCharacters: (characters: FavoriteCharacter[]) => void;
}) {
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [selectedList, setSelectedList] = useState<EvangelistList | null>(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedAnimeIds, setSelectedAnimeIds] = useState<number[]>([]);
  const [editingList, setEditingList] = useState<EvangelistList | null>(null);
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterAnimeId, setNewCharacterAnimeId] = useState<number | null>(null);
  const [newCharacterImage, setNewCharacterImage] = useState('👤');
  const [newCharacterCategory, setNewCharacterCategory] = useState('');
  const [newCharacterTags, setNewCharacterTags] = useState<string[]>([]);
  const [newCustomTag, setNewCustomTag] = useState('');
  const watchedCount = allAnimes.filter(a => a.watched).length;
  const totalRewatchCount = allAnimes.reduce((sum, a) => sum + (a.rewatchCount ?? 1), 0);
  
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
  
  // ダミーの制作会社データ
  const studios = [
    { name: 'MAPPA', count: 3 },
    { name: '京アニ', count: 2 },
    { name: 'ufotable', count: 1 },
  ];
  
  return (
    <div className="space-y-6">
      {/* プロフィールカード */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col items-center mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl mb-3 shadow-lg">
            {userIcon}
          </div>
          <h2 className="text-xl font-bold dark:text-white mb-2">{userName}</h2>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            プロフィール編集
          </button>
        </div>
      </div>
      
      {/* 統計セクション */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
        <h3 className="font-bold text-lg mb-3 dark:text-white">統計</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">視聴作品数</p>
            <p className="text-2xl font-black dark:text-white">{watchedCount}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">累計周回数</p>
            <p className="text-2xl font-black dark:text-white">{totalRewatchCount}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">平均評価</p>
            <p className="text-2xl font-black dark:text-white">
              {averageRating > 0 ? `⭐${averageRating.toFixed(1)}` : '⭐0.0'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">一番多いタグ</p>
            <p className="text-lg font-bold dark:text-white">
              {mostPopularTag ? `${mostPopularTag.emoji} ${mostPopularTag.label}` : '-'}
            </p>
          </div>
        </div>
      </div>
      
      {/* お気に入りジャンル */}
      {sortedTags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          <h3 className="font-bold text-lg mb-3 dark:text-white">お気に入りジャンル</h3>
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
                        className="bg-indigo-600 h-2 rounded-full transition-all"
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
      
      {/* よく見る制作会社 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
        <h3 className="font-bold text-lg mb-3 dark:text-white">よく見る制作会社</h3>
        <div className="space-y-2">
          {studios.map((studio) => (
            <div key={studio.name} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-0">
              <span className="font-medium dark:text-white">{studio.name}</span>
              <span className="text-gray-500 dark:text-gray-400">{studio.count}作品</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 名言コレクション */}
      {(() => {
        const allQuotes: Array<{ text: string; character?: string; animeTitle: string }> = [];
        allAnimes.forEach((anime) => {
          anime.quotes?.forEach((quote) => {
            allQuotes.push({ ...quote, animeTitle: anime.title });
          });
        });

        return allQuotes.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
            <h3 className="font-bold text-lg mb-3 dark:text-white">名言コレクション</h3>
            <div className="space-y-3">
              {allQuotes.map((quote, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-indigo-500"
                >
                  <p className="text-sm dark:text-white mb-2">「{quote.text}」</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {quote.character ? `${quote.character} / ` : ''}{quote.animeTitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* 推しキャラ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg dark:text-white">推しキャラ</h3>
          <button
            onClick={() => {
              setNewCharacterName('');
              setNewCharacterAnimeId(null);
              setNewCharacterImage('👤');
              setNewCharacterCategory('');
              setNewCharacterTags([]);
              setNewCustomTag('');
              setShowAddCharacterModal(true);
            }}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + 推しを追加
          </button>
        </div>
        
        {favoriteCharacters.length > 0 ? (
          <div className="space-y-4">
            {characterCategories.map((category) => {
              const categoryCharacters = favoriteCharacters.filter(char => char.category === category.value);
              if (categoryCharacters.length === 0) return null;
              
              return (
                <div key={category.value} className="mb-4">
                  <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                    {category.emoji} {category.label}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {categoryCharacters.map((character) => (
                      <div
                        key={character.id}
                        className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl p-3"
                      >
                        <div className="text-center mb-2">
                          <div className="text-4xl mb-1">{character.image}</div>
                          <p className="font-bold text-sm dark:text-white">{character.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{character.animeName}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center mt-2">
                          {character.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-white/50 dark:bg-gray-700/50 px-2 py-0.5 rounded-full text-gray-700 dark:text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            推しキャラが登録されていません
          </p>
        )}
      </div>

      {/* 布教リスト */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg dark:text-white">布教リスト</h3>
          <button
            onClick={() => {
              setNewListTitle('');
              setNewListDescription('');
              setSelectedAnimeIds([]);
              setEditingList(null);
              setShowCreateListModal(true);
            }}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + 新しいリストを作成
          </button>
        </div>
        
        {evangelistLists.length > 0 ? (
          <div className="space-y-3">
            {evangelistLists.map((list) => (
              <button
                key={list.id}
                onClick={() => setSelectedList(list)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-left shadow-md hover:shadow-lg transition-all"
              >
                <h4 className="font-bold mb-1">{list.title}</h4>
                <p className="text-sm text-white/80 mb-2">{list.description}</p>
                <p className="text-xs text-white/70">{list.animeIds.length}作品</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            リストがありません
          </p>
        )}
      </div>

      {/* 設定 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
        <h3 className="font-bold text-lg mb-3 dark:text-white">設定</h3>
        <div className="space-y-3">
          {/* ダークモード切り替え */}
          <div className="flex items-center justify-between">
            <span className="dark:text-white">ダークモード</span>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'
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
            className="w-full text-left py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            データをエクスポート
          </button>
          
          {/* ログアウト */}
          <button
            onClick={() => {}}
            className="w-full text-left py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* リスト作成・編集モーダル */}
      {showCreateListModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateListModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 dark:text-white">
              {editingList ? 'リストを編集' : '新しいリストを作成'}
            </h2>
            
            {/* タイトル入力 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                タイトル
              </label>
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="初心者におすすめ5選"
              />
            </div>

            {/* 説明入力 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                説明
              </label>
              <textarea
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="アニメ入門にぴったり"
                rows={3}
              />
            </div>

            {/* アニメ選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                アニメを選択
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allAnimes.map((anime) => (
                  <label
                    key={anime.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAnimeIds.includes(anime.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAnimeIds([...selectedAnimeIds, anime.id]);
                        } else {
                          setSelectedAnimeIds(selectedAnimeIds.filter(id => id !== anime.id));
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm dark:text-white">{anime.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateListModal(false);
                  setNewListTitle('');
                  setNewListDescription('');
                  setSelectedAnimeIds([]);
                  setEditingList(null);
                }}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (newListTitle.trim() && selectedAnimeIds.length > 0) {
                    if (editingList) {
                      // 編集
                      const updatedLists = evangelistLists.map(list =>
                        list.id === editingList.id
                          ? {
                              ...list,
                              title: newListTitle.trim(),
                              description: newListDescription.trim(),
                              animeIds: selectedAnimeIds,
                            }
                          : list
                      );
                      setEvangelistLists(updatedLists);
                    } else {
                      // 新規作成
                      const newList: EvangelistList = {
                        id: Date.now(),
                        title: newListTitle.trim(),
                        description: newListDescription.trim(),
                        animeIds: selectedAnimeIds,
                        createdAt: new Date(),
                      };
                      setEvangelistLists([...evangelistLists, newList]);
                    }
                    setShowCreateListModal(false);
                    setNewListTitle('');
                    setNewListDescription('');
                    setSelectedAnimeIds([]);
                    setEditingList(null);
                  }
                }}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                {editingList ? '更新' : '作成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* リスト詳細モーダル */}
      {selectedList && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedList(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 dark:text-white">{selectedList.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedList.description}</p>
            
            {/* アニメ一覧 */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {selectedList.animeIds.length}作品
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {selectedList.animeIds.map((animeId) => {
                  const anime = allAnimes.find(a => a.id === animeId);
                  if (!anime) return null;
                  return (
                    <div
                      key={animeId}
                      onClick={() => {
                        setSelectedAnime(anime);
                        setSelectedList(null);
                      }}
                      className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-3 text-white text-center cursor-pointer hover:scale-105 transition-transform"
                    >
                      <div className="text-3xl mb-1">{anime.image}</div>
                      <p className="text-xs font-bold truncate">{anime.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {}}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                📤 シェア
              </button>
              <button
                onClick={() => {
                  setEditingList(selectedList);
                  setNewListTitle(selectedList.title);
                  setNewListDescription(selectedList.description);
                  setSelectedAnimeIds(selectedList.animeIds);
                  setSelectedList(null);
                  setShowCreateListModal(true);
                }}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                編集
              </button>
              <button
                onClick={() => {
                  setEvangelistLists(evangelistLists.filter(list => list.id !== selectedList.id));
                  setSelectedList(null);
                }}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                削除
              </button>
            </div>
            
            <button
              onClick={() => setSelectedList(null)}
              className="w-full mt-3 text-gray-500 dark:text-gray-400 text-sm"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 推しキャラ追加モーダル */}
      {showAddCharacterModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddCharacterModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 dark:text-white">推しを追加</h2>
            
            {/* キャラ名入力 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                キャラ名
              </label>
              <input
                type="text"
                value={newCharacterName}
                onChange={(e) => setNewCharacterName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="キャラクター名"
              />
            </div>

            {/* アニメ選択 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                アニメ
              </label>
              <select
                value={newCharacterAnimeId || ''}
                onChange={(e) => setNewCharacterAnimeId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">選択してください</option>
                {allAnimes.map((anime) => (
                  <option key={anime.id} value={anime.id}>
                    {anime.title}
                  </option>
                ))}
              </select>
            </div>

            {/* アイコン選択 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                アイコン
              </label>
              <div className="grid grid-cols-8 gap-2">
                {['👤', '👻', '🧝', '🎸', '👑', '🦄', '🌟', '💫', '⚡', '🔥', '💕', '❤️', '🎭', '🛡️', '😇', '🤡', '💀', '🎪', '🎨', '🎯', '🎬', '🎮'].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewCharacterImage(icon)}
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      newCharacterImage === icon
                        ? 'bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* カテゴリ選択 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                カテゴリ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {characterCategories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setNewCharacterCategory(category.value)}
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${
                      newCharacterCategory === category.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category.emoji} {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* タグ選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                タグ
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {characterPresetTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (newCharacterTags.includes(tag)) {
                        setNewCharacterTags(newCharacterTags.filter(t => t !== tag));
                      } else {
                        setNewCharacterTags([...newCharacterTags, tag]);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      newCharacterTags.includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              {/* カスタムタグ追加 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCustomTag}
                  onChange={(e) => setNewCustomTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newCustomTag.trim() && !newCharacterTags.includes(newCustomTag.trim())) {
                      setNewCharacterTags([...newCharacterTags, newCustomTag.trim()]);
                      setNewCustomTag('');
                    }
                  }}
                  className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="新しいタグを入力してEnter"
                />
              </div>
              
              {/* 選択中のタグ表示 */}
              {newCharacterTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {newCharacterTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full text-xs"
                    >
                      {tag}
                      <button
                        onClick={() => setNewCharacterTags(newCharacterTags.filter((_, i) => i !== index))}
                        className="hover:text-red-500"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddCharacterModal(false);
                  setNewCharacterName('');
                  setNewCharacterAnimeId(null);
                  setNewCharacterImage('👤');
                  setNewCharacterCategory('');
                  setNewCharacterTags([]);
                  setNewCustomTag('');
                }}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (newCharacterName.trim() && newCharacterAnimeId) {
                    const selectedAnime = allAnimes.find(a => a.id === newCharacterAnimeId);
                    if (selectedAnime) {
                      const newCharacter: FavoriteCharacter = {
                        id: Date.now(),
                        name: newCharacterName.trim(),
                        animeId: newCharacterAnimeId,
                        animeName: selectedAnime.title,
                        image: newCharacterImage,
                        category: newCharacterCategory,
                        tags: newCharacterTags,
                      };
                      setFavoriteCharacters([...favoriteCharacters, newCharacter]);
                      setShowAddCharacterModal(false);
                      setNewCharacterName('');
                      setNewCharacterAnimeId(null);
                      setNewCharacterImage('👤');
                      setNewCharacterCategory('');
                      setNewCharacterTags([]);
                      setNewCustomTag('');
                    }
                  }
                }}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 実績タブコンポーネント
function AchievementsTab({ allAnimes, achievements }: { allAnimes: Anime[]; achievements: Achievement[] }) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  // 実績の解除判定
  const checkAchievement = (achievement: Achievement): boolean => {
    const watchedCount = allAnimes.filter(a => a.watched).length;
    const maxRewatchCount = Math.max(...allAnimes.map(a => a.rewatchCount ?? 1), 0);
    const godTasteCount = allAnimes.filter(a => a.rating === 5).length;
    
    switch (achievement.id) {
      case 'first':
        return watchedCount >= achievement.condition;
      case 'ten':
      case 'fifty':
      case 'hundred':
        return watchedCount >= achievement.condition;
      case 'rewatch3':
      case 'rewatch10':
        return maxRewatchCount >= achievement.condition;
      case 'godtaste':
        return godTasteCount >= achievement.condition;
      default:
        return false;
    }
  };
  
  const unlockedCount = achievements.filter(a => checkAchievement(a)).length;
  
  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-400 dark:bg-gray-500';
      case 'rare':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'epic':
        return 'bg-purple-500 dark:bg-purple-600';
      case 'legendary':
        return 'bg-yellow-500 dark:bg-yellow-600';
      default:
        return 'bg-gray-400';
    }
  };
  
  return (
    <>
      {/* 進捗表示 */}
      <div className="mb-6 text-center">
        <p className="text-2xl font-black dark:text-white">
          {unlockedCount}/{achievements.length} 解除済み
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* バッジグリッド */}
      <div className="grid grid-cols-3 gap-4">
        {achievements.map((achievement) => {
          const isUnlocked = checkAchievement(achievement);
          const rarityColor = getRarityColor(achievement.rarity);
          
          return (
            <button
              key={achievement.id}
              onClick={() => setSelectedAchievement(achievement)}
              className={`relative aspect-square rounded-2xl p-4 flex flex-col items-center justify-center transition-all ${
                isUnlocked
                  ? `${rarityColor} ${achievement.rarity === 'legendary' ? 'animate-pulse' : ''} shadow-lg hover:scale-105`
                  : 'bg-gray-200 dark:bg-gray-700 opacity-50'
              }`}
            >
              {!isUnlocked && (
                <span className="absolute top-1 right-1 text-xs">🔒</span>
              )}
              <span className="text-4xl mb-2">{achievement.icon}</span>
              <span className={`text-xs font-bold text-center ${isUnlocked ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {achievement.name}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* 詳細モーダル */}
      {selectedAchievement && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAchievement(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <span className="text-6xl mb-2 block">{selectedAchievement.icon}</span>
              <h3 className="text-xl font-bold dark:text-white mb-1">{selectedAchievement.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAchievement.desc}</p>
            </div>
            
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-bold">解除条件:</span> {selectedAchievement.desc}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                レア度: {selectedAchievement.rarity}
              </p>
            </div>
            
            <button 
              onClick={() => setSelectedAchievement(null)}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// 主題歌タブコンポーネント
function MusicTab({
  allAnimes,
  seasons,
  setSeasons,
}: {
  allAnimes: Anime[];
  seasons: Season[];
  setSeasons: (seasons: Season[]) => void;
}) {
  // すべての曲を取得
  const allSongs: Array<{
  title: string;
    artist: string;
  rating: number;
    isFavorite: boolean;
    animeTitle: string;
    type: 'op' | 'ed';
    animeId: number;
  }> = [];

  allAnimes.forEach((anime) => {
    if (anime.songs?.op) {
      allSongs.push({
        ...anime.songs.op,
        animeTitle: anime.title,
        type: 'op',
        animeId: anime.id,
      });
    }
    if (anime.songs?.ed) {
      allSongs.push({
        ...anime.songs.ed,
        animeTitle: anime.title,
        type: 'ed',
        animeId: anime.id,
      });
    }
  });

  // お気に入り曲
  const favoriteSongs = allSongs.filter((song) => song.isFavorite);

  // 高評価TOP10
  const topRatedSongs = [...allSongs]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  // よく聴くアーティスト
  const artistCounts: { [key: string]: number } = {};
  allSongs.forEach((song) => {
    artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
  });
  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* お気に入り曲 */}
      {favoriteSongs.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-3 dark:text-white">お気に入り曲</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {favoriteSongs.map((song, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-48 rounded-xl p-4 text-white shadow-lg ${
                  song.type === 'op'
                    ? 'bg-gradient-to-br from-orange-500 to-red-500'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">
                    {song.type.toUpperCase()}
                  </span>
                  <span className="text-lg">❤️</span>
                </div>
                <p className="font-bold text-sm mb-1">{song.title}</p>
                <p className="text-xs text-white/80 mb-2">{song.artist}</p>
                <p className="text-xs text-white/70">{song.animeTitle}</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-yellow-300 text-sm">
                    {'⭐'.repeat(song.rating)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 高評価TOP10 */}
      <div>
        <h2 className="font-bold text-lg mb-3 dark:text-white">高評価 TOP10</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          {topRatedSongs.map((song, index) => (
            <div
              key={index}
              className="flex items-center gap-3 py-3 border-b dark:border-gray-700 last:border-0"
            >
              <span className="text-2xl font-black text-gray-300 dark:text-gray-600 w-8">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="font-bold text-sm dark:text-white">{song.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {song.artist} / {song.animeTitle}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {song.type.toUpperCase()}
                </span>
                <span className="text-yellow-400 text-sm">
                  {'⭐'.repeat(song.rating)}
                </span>
                {song.isFavorite && <span className="text-red-500">❤️</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* よく聴くアーティスト */}
      <div>
        <h2 className="font-bold text-lg mb-3 dark:text-white">よく聴くアーティスト</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          {topArtists.map(([artist, count], index) => (
            <div
              key={artist}
              className="flex items-center justify-between py-3 border-b dark:border-gray-700 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-gray-300 dark:text-gray-600 w-6">
                  {index + 1}
                </span>
                <span className="font-bold dark:text-white">{artist}</span>
              </div>
              <span className="text-gray-500 dark:text-gray-400">{count}曲</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// アニメカード
function AnimeCard({ anime, onClick }: { anime: Anime; onClick: () => void }) {
  const rating = ratingLabels[anime.rating];
  const rewatchCount = anime.rewatchCount ?? 1;
  
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:shadow-gray-900/50 overflow-hidden cursor-pointer hover:scale-105 hover:shadow-2xl transition-all relative"
    >
      <div className="aspect-[3/4] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl relative">
        {/* 周回数バッジ */}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
          <span className="text-xs">🔄</span>
          <span className="text-white text-xs font-bold">{rewatchCount}周</span>
        </div>
        
        {/* 視聴済みチェックマーク */}
        {anime.watched && (
          <div className="absolute top-2 right-2 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        )}
        
        {anime.image}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm truncate dark:text-white">{anime.title}</p>
        {rating && (
          <p className="text-xs text-orange-500 dark:text-orange-400 font-bold">
            {rating.emoji} {rating.label}
          </p>
        )}
        {/* タグ表示（最大2個まで） */}
        {anime.tags && anime.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {anime.tags.slice(0, 2).map((tag, index) => {
              const tagInfo = availableTags.find(t => t.value === tag);
              return (
                <span
                  key={index}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                >
                  {tagInfo?.emoji} {tagInfo?.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// メインページ
export default function Home() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [count, setCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDNAModal, setShowDNAModal] = useState(false);
  const [newAnimeTitle, setNewAnimeTitle] = useState('');
  const [newAnimeIcon, setNewAnimeIcon] = useState('🎬');
  const [newAnimeRating, setNewAnimeRating] = useState(0);
  const [userName, setUserName] = useState<string>('ユーザー');
  const [userIcon, setUserIcon] = useState<string>('👤');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'music' | 'achievements' | 'profile'>('home');
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [evangelistLists, setEvangelistLists] = useState<EvangelistList[]>([]);
  const [favoriteCharacters, setFavoriteCharacters] = useState<FavoriteCharacter[]>([]);

  // localStorageから初期値を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('userName');
      const savedIcon = localStorage.getItem('userIcon');
      const savedDarkMode = localStorage.getItem('darkMode');
      const savedSeasons = localStorage.getItem('animeSeasons');
      const savedLists = localStorage.getItem('evangelistLists');
      const savedCharacters = localStorage.getItem('favoriteCharacters');
      
      if (savedName) setUserName(savedName);
      if (savedIcon) setUserIcon(savedIcon);
      if (savedDarkMode === 'true') setIsDarkMode(true);
      
      // 布教リストを読み込む
      if (savedLists) {
        try {
          const parsedLists = JSON.parse(savedLists);
          // Date型に変換
          const listsWithDates = parsedLists.map((list: any) => ({
            ...list,
            createdAt: new Date(list.createdAt),
          }));
          setEvangelistLists(listsWithDates);
        } catch (e) {
          console.error('Failed to parse evangelist lists', e);
        }
      }
      
      // 推しキャラを読み込む
      if (savedCharacters) {
        try {
          const parsedCharacters = JSON.parse(savedCharacters);
          setFavoriteCharacters(parsedCharacters);
        } catch (e) {
          console.error('Failed to parse favorite characters', e);
          // エラーの場合はサンプルデータを使用
          setFavoriteCharacters(sampleFavoriteCharacters);
        }
      } else {
        // 保存データがない場合はサンプルデータを使用
        setFavoriteCharacters(sampleFavoriteCharacters);
      }
      
      // アニメデータを読み込む（保存済みがあればそれを使い、なければサンプルデータ）
      if (savedSeasons) {
        try {
          const parsedSeasons = JSON.parse(savedSeasons);
          setSeasons(parsedSeasons);
          if (parsedSeasons.length > 0) {
            setExpandedSeasons(new Set([parsedSeasons[0].name]));
          }
        } catch (e) {
          // パースエラーの場合はサンプルデータを使用
          setSeasons(sampleSeasons);
          setExpandedSeasons(new Set([sampleSeasons[0].name]));
        }
      } else {
        // 保存データがない場合はサンプルデータを使用
        setSeasons(sampleSeasons);
        setExpandedSeasons(new Set([sampleSeasons[0].name]));
      }
    }
  }, []);

  // ダークモードの適用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('darkMode', isDarkMode.toString());
    }
  }, [isDarkMode]);

  // ユーザー情報をlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userName', userName);
      localStorage.setItem('userIcon', userIcon);
    }
  }, [userName, userIcon]);

  // アニメデータをlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined' && seasons.length > 0) {
      localStorage.setItem('animeSeasons', JSON.stringify(seasons));
    }
  }, [seasons]);

  // 布教リストをlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('evangelistLists', JSON.stringify(evangelistLists));
    }
  }, [evangelistLists]);

  // 推しキャラをlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined' && favoriteCharacters.length > 0) {
      localStorage.setItem('favoriteCharacters', JSON.stringify(favoriteCharacters));
    }
  }, [favoriteCharacters]);

  // すべてのアニメを取得
  const allAnimes = seasons.flatMap(season => season.animes);

  // 平均評価を計算
  const averageRating = allAnimes.length > 0 && allAnimes.some(a => a.rating > 0)
    ? allAnimes.filter(a => a.rating > 0).reduce((sum, a) => sum + a.rating, 0) / allAnimes.filter(a => a.rating > 0).length
    : 0;

  // カウントアップアニメーション
  useEffect(() => {
    const targetCount = allAnimes.length;
    const duration = 1500; // 1.5秒
    const steps = 60;
    const increment = targetCount / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const nextCount = Math.min(Math.ceil(increment * currentStep), targetCount);
      setCount(nextCount);
      
      if (nextCount >= targetCount) {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [allAnimes.length]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            俺のアニメログ
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-2xl">{userIcon}</span>
              <span className="font-bold text-sm dark:text-white">{userName}</span>
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-md mx-auto px-4 py-6 pb-24">
        {activeTab === 'home' && (
          <>
        {/* 統計カード */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white mb-6 relative">
              {/* オタクタイプ */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-white/90 text-sm font-medium">
                  あなたは 🎵 音響派
                </p>
                <button 
                  onClick={() => setShowDNAModal(true)}
                  className="text-white/80 hover:text-white transition-colors text-sm font-bold"
                >
                  DNA
                </button>
              </div>
              
              {/* 統計情報 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-black">{count}</p>
                  <p className="text-white/80 text-xs mt-1">作品</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black">12</p>
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

        {/* アニメ一覧 */}
            {seasons.map((season) => {
              const isExpanded = expandedSeasons.has(season.name);
              const watchedCount = season.animes.filter(a => a.watched).length;
              
              return (
                <div key={season.name} className="mb-6">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedSeasons);
                      if (isExpanded) {
                        newExpanded.delete(season.name);
                      } else {
                        newExpanded.add(season.name);
                      }
                      setExpandedSeasons(newExpanded);
                    }}
                    className="w-full flex items-center justify-between mb-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <h2 className="font-bold text-lg dark:text-white">{season.name}</h2>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {watchedCount}/{season.animes.length}作品
                    </span>
                  </button>
                  
                  {isExpanded && (
        <div className="grid grid-cols-3 gap-3">
                      {season.animes.map((anime) => (
            <AnimeCard 
              key={anime.id} 
              anime={anime}
              onClick={() => setSelectedAnime(anime)}
            />
          ))}
        </div>
                  )}
                </div>
              );
            })}

        {/* 追加ボタン */}
            <button 
              onClick={() => setShowAddForm(true)}
              className="w-full mt-6 py-4 border-2 border-dashed border-indigo-300 dark:border-indigo-600 rounded-2xl text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
          + アニメを追加
        </button>
          </>
        )}
        
        {activeTab === 'music' && (
          <MusicTab allAnimes={allAnimes} seasons={seasons} setSeasons={setSeasons} />
        )}
        
        {activeTab === 'achievements' && (
          <AchievementsTab 
            allAnimes={allAnimes}
            achievements={achievements}
          />
        )}
        
        {activeTab === 'profile' && (
          <ProfileTab
            allAnimes={allAnimes}
            userName={userName}
            userIcon={userIcon}
            averageRating={averageRating}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setShowSettings={setShowSettings}
            evangelistLists={evangelistLists}
            setEvangelistLists={setEvangelistLists}
            setSelectedAnime={setSelectedAnime}
            favoriteCharacters={favoriteCharacters}
            setFavoriteCharacters={setFavoriteCharacters}
          />
        )}
      </main>

      {/* アニメ追加フォームモーダル */}
      {showAddForm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddForm(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 dark:text-white">新しいアニメを追加</h2>
            
            {/* タイトル入力 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                タイトル
              </label>
              <input
                type="text"
                value={newAnimeTitle}
                onChange={(e) => setNewAnimeTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="アニメのタイトルを入力"
              />
            </div>

            {/* アイコン選択 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                アイコン
              </label>
              <div className="grid grid-cols-8 gap-2">
                {['🎬', '🎭', '🎪', '🎨', '🎯', '🎮', '🎸', '🎵', '🎹', '🎤', '🎧', '🎺', '🎷', '🥁', '🎲', '🎰', '🎃', '🧝', '👻', '🤖', '👽', '🦄', '🐉', '🦁'].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewAnimeIcon(icon)}
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      newAnimeIcon === icon
                        ? 'bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* 評価選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                評価
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setNewAnimeRating(rating)}
                    className={`text-3xl transition-transform hover:scale-110 ${
                      newAnimeRating >= rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              {newAnimeRating > 0 && (
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {ratingLabels[newAnimeRating]?.emoji} {ratingLabels[newAnimeRating]?.label}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setNewAnimeTitle('');
                  setNewAnimeIcon('🎬');
                  setNewAnimeRating(0);
                }}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
              <button 
                onClick={() => {
                  if (newAnimeTitle.trim()) {
                    const maxId = Math.max(...seasons.flatMap(s => s.animes).map(a => a.id), 0);
                    const newAnime: Anime = {
                      id: maxId + 1,
                      title: newAnimeTitle.trim(),
                      image: newAnimeIcon,
                      rating: newAnimeRating,
                      watched: true,
                      rewatchCount: 1,
                    };
                    // 最新のシーズン（最初のシーズン）に追加
                    const updatedSeasons = [...seasons];
                    updatedSeasons[0] = {
                      ...updatedSeasons[0],
                      animes: [...updatedSeasons[0].animes, newAnime],
                    };
                    setSeasons(updatedSeasons);
                    setShowAddForm(false);
                    setNewAnimeTitle('');
                    setNewAnimeIcon('🎬');
                    setNewAnimeRating(0);
                  }
                }}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 設定モーダル */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 dark:text-white">プロフィール設定</h2>
            
            {/* ユーザー名入力 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ユーザー名
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="ユーザー名を入力"
              />
            </div>

            {/* アイコン選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                アイコン
              </label>
              <div className="grid grid-cols-8 gap-2">
                {['👤', '😊', '🎮', '🎬', '📺', '🎨', '⚡', '🔥', '🌟', '💫', '🎯', '🚀', '🎪', '🎭', '🎸', '🎵', '🎹', '🎤', '🎧', '🎺', '🎷', '🥁', '🎲', '🎰'].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setUserIcon(icon)}
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      userIcon === icon
                        ? 'bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* アニメ詳細モーダル */}
      {selectedAnime && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAnime(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <span className="text-6xl">{selectedAnime.image}</span>
              <h3 className="text-xl font-bold mt-2 dark:text-white">{selectedAnime.title}</h3>
            </div>
            
            {/* 評価ボタン */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">評価を選択</p>
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => {
                      const updatedSeasons = seasons.map(season => ({
                        ...season,
                        animes: season.animes.map((anime) =>
                          anime.id === selectedAnime.id
                            ? { ...anime, rating }
                            : anime
                        ),
                      }));
                      setSeasons(updatedSeasons);
                      setSelectedAnime({ ...selectedAnime, rating });
                    }}
                    className={`text-3xl transition-all hover:scale-110 active:scale-95 ${
                      selectedAnime.rating >= rating
                        ? 'text-yellow-400 drop-shadow-sm'
                        : 'text-gray-300 hover:text-gray-400'
                    }`}
                    title={`${rating}つ星`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              {selectedAnime.rating > 0 ? (
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                  {ratingLabels[selectedAnime.rating]?.emoji} {ratingLabels[selectedAnime.rating]?.label}
                </p>
              ) : (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-2">
                  評価を選択してください
                </p>
              )}
            </div>

            {/* タグ選択 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">タグ</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {availableTags.map((tag) => {
                  const isSelected = selectedAnime.tags?.includes(tag.value) ?? false;
                  return (
                    <button
                      key={tag.value}
                      onClick={() => {
                        const currentTags = selectedAnime.tags ?? [];
                        const newTags = isSelected
                          ? currentTags.filter(t => t !== tag.value)
                          : [...currentTags, tag.value];
                        const updatedSeasons = seasons.map(season => ({
                          ...season,
                          animes: season.animes.map((anime) =>
                            anime.id === selectedAnime.id
                              ? { ...anime, tags: newTags }
                              : anime
                          ),
                        }));
                        setSeasons(updatedSeasons);
                        setSelectedAnime({ ...selectedAnime, tags: newTags });
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 主題歌 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center font-medium">主題歌</p>
              
              {/* OP */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">OP</p>
                {selectedAnime.songs?.op ? (
                  <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm dark:text-white">{selectedAnime.songs.op.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{selectedAnime.songs.op.artist}</p>
                      </div>
                      <button
                        onClick={() => {
                          const updatedSeasons = seasons.map(season => ({
                            ...season,
                            animes: season.animes.map((anime) =>
                              anime.id === selectedAnime.id
                                ? {
                                    ...anime,
                                    songs: {
                                      ...anime.songs,
                                      op: anime.songs?.op
                                        ? { ...anime.songs.op, isFavorite: !anime.songs.op.isFavorite }
                                        : undefined,
                                    },
                                  }
                                : anime
                            ),
                          }));
                          setSeasons(updatedSeasons);
                          setSelectedAnime({
                            ...selectedAnime,
                            songs: {
                              ...selectedAnime.songs,
                              op: selectedAnime.songs?.op
                                ? { ...selectedAnime.songs.op, isFavorite: !selectedAnime.songs.op.isFavorite }
                                : undefined,
                            },
                          });
                        }}
                        className="text-xl"
                      >
                        {selectedAnime.songs.op.isFavorite ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => {
                            const updatedSeasons = seasons.map(season => ({
                              ...season,
                              animes: season.animes.map((anime) =>
                                anime.id === selectedAnime.id
                                  ? {
                                      ...anime,
                                      songs: {
                                        ...anime.songs,
                                        op: anime.songs?.op
                                          ? { ...anime.songs.op, rating }
                                          : undefined,
                                      },
                                    }
                                  : anime
                              ),
                            }));
                            setSeasons(updatedSeasons);
                            setSelectedAnime({
                              ...selectedAnime,
                              songs: {
                                ...selectedAnime.songs,
                                op: selectedAnime.songs?.op
                                  ? { ...selectedAnime.songs.op, rating }
                                  : undefined,
                              },
                            });
                          }}
                          className={`text-sm ${
                            (selectedAnime.songs?.op?.rating ?? 0) >= rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">未登録</p>
                )}
              </div>

              {/* ED */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">ED</p>
                {selectedAnime.songs?.ed ? (
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm dark:text-white">{selectedAnime.songs.ed.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{selectedAnime.songs.ed.artist}</p>
                      </div>
                      <button
                        onClick={() => {
                          const updatedSeasons = seasons.map(season => ({
                            ...season,
                            animes: season.animes.map((anime) =>
                              anime.id === selectedAnime.id
                                ? {
                                    ...anime,
                                    songs: {
                                      ...anime.songs,
                                      ed: anime.songs?.ed
                                        ? { ...anime.songs.ed, isFavorite: !anime.songs.ed.isFavorite }
                                        : undefined,
                                    },
                                  }
                                : anime
                            ),
                          }));
                          setSeasons(updatedSeasons);
                          setSelectedAnime({
                            ...selectedAnime,
                            songs: {
                              ...selectedAnime.songs,
                              ed: selectedAnime.songs?.ed
                                ? { ...selectedAnime.songs.ed, isFavorite: !selectedAnime.songs.ed.isFavorite }
                                : undefined,
                            },
                          });
                        }}
                        className="text-xl"
                      >
                        {selectedAnime.songs.ed.isFavorite ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => {
                            const updatedSeasons = seasons.map(season => ({
                              ...season,
                              animes: season.animes.map((anime) =>
                                anime.id === selectedAnime.id
                                  ? {
                                      ...anime,
                                      songs: {
                                        ...anime.songs,
                                        ed: anime.songs?.ed
                                          ? { ...anime.songs.ed, rating }
                                          : undefined,
                                      },
                                    }
                                  : anime
                              ),
                            }));
                            setSeasons(updatedSeasons);
                            setSelectedAnime({
                              ...selectedAnime,
                              songs: {
                                ...selectedAnime.songs,
                                ed: selectedAnime.songs?.ed
                                  ? { ...selectedAnime.songs.ed, rating }
                                  : undefined,
                              },
                            });
                          }}
                          className={`text-sm ${
                            (selectedAnime.songs?.ed?.rating ?? 0) >= rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">未登録</p>
                )}
              </div>
            </div>

            {/* 名言 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">名言</p>
                <button
                  onClick={() => {
                    const newQuoteText = prompt('セリフを入力してください:');
                    if (newQuoteText) {
                      const newQuoteCharacter = prompt('キャラクター名（任意）:') || undefined;
                      const updatedSeasons = seasons.map(season => ({
                        ...season,
                        animes: season.animes.map((anime) =>
                          anime.id === selectedAnime.id
                            ? {
                                ...anime,
                                quotes: [...(anime.quotes || []), { text: newQuoteText, character: newQuoteCharacter }],
                              }
                            : anime
                        ),
                      }));
                      setSeasons(updatedSeasons);
                      setSelectedAnime({
                        ...selectedAnime,
                        quotes: [...(selectedAnime.quotes || []), { text: newQuoteText, character: newQuoteCharacter }],
                      });
                    }
                  }}
                  className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  + 名言を追加
                </button>
              </div>
              
              {selectedAnime.quotes && selectedAnime.quotes.length > 0 ? (
                <div className="space-y-2">
                  {selectedAnime.quotes.map((quote, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-indigo-500 relative"
                    >
                      <p className="text-sm dark:text-white mb-1">「{quote.text}」</p>
                      {quote.character && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">— {quote.character}</p>
                      )}
                      <button
                        onClick={() => {
                          const updatedQuotes = selectedAnime.quotes?.filter((_, i) => i !== index) || [];
                          const updatedSeasons = seasons.map(season => ({
                            ...season,
                            animes: season.animes.map((anime) =>
                              anime.id === selectedAnime.id
                                ? { ...anime, quotes: updatedQuotes }
                                : anime
                            ),
                          }));
                          setSeasons(updatedSeasons);
                          setSelectedAnime({ ...selectedAnime, quotes: updatedQuotes });
                        }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">名言が登録されていません</p>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const updatedSeasons = seasons.map(season => ({
                    ...season,
                    animes: season.animes.filter((anime) => anime.id !== selectedAnime.id),
                  }));
                  setSeasons(updatedSeasons);
                  setSelectedAnime(null);
                }}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                削除
              </button>
            <button 
              onClick={() => setSelectedAnime(null)}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              閉じる
            </button>
            </div>
          </div>
        </div>
      )}

      {/* DNAモーダル */}
      {showDNAModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDNAModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* DNAカード */}
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-2xl p-6 mb-4 shadow-lg">
              {/* タイトル */}
              <div className="text-center mb-4">
                <h2 className="text-white text-xl font-black mb-1">MY ANIME DNA</h2>
                <span className="text-2xl">✨</span>
              </div>
              
              {/* オタクタイプ */}
              <div className="text-center mb-6">
                <p className="text-white text-4xl font-black">
                  🎵 音響派
                </p>
              </div>
              
              {/* 統計 */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg py-2">
                  <p className="text-white text-2xl font-black">{count}</p>
                  <p className="text-white/80 text-xs mt-1">作品</p>
                </div>
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg py-2">
                  <p className="text-white text-2xl font-black">12</p>
                  <p className="text-white/80 text-xs mt-1">周</p>
                </div>
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-lg py-2">
                  <p className="text-white text-2xl font-black">
                    {averageRating > 0 ? `${averageRating.toFixed(1)}` : '0.0'}
                  </p>
                  <p className="text-white/80 text-xs mt-1">平均</p>
                </div>
              </div>
              
              {/* 代表作 */}
              <div className="mb-4">
                <p className="text-white/90 text-xs font-medium mb-2 text-center">代表作</p>
                <div className="flex justify-center gap-3">
                  {allAnimes
                    .filter(a => a.rating > 0)
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 3)
                    .map((anime, index) => (
                      <div
                        key={anime.id}
                        className="bg-white/20 backdrop-blur-sm rounded-lg w-16 h-20 flex items-center justify-center text-3xl"
                      >
                        {anime.image}
                      </div>
                    ))}
                </div>
              </div>
              
              {/* ロゴ */}
              <div className="text-center pt-2 border-t border-white/20">
                <p className="text-white/80 text-xs font-bold">アニメログ</p>
              </div>
            </div>
            
            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={() => {}}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>📥</span>
                <span>保存</span>
              </button>
              <button
                onClick={() => {}}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>📤</span>
                <span>シェア</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowDNAModal(false)}
              className="w-full mt-3 text-gray-500 dark:text-gray-400 text-sm"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-10">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex justify-around items-center">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all ${
                activeTab === 'home'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className={`text-2xl transition-transform ${activeTab === 'home' ? 'scale-110' : 'scale-100'}`}>
                📺
              </span>
              <span className="text-xs font-medium mt-1">ホーム</span>
            </button>
            
            <button
              onClick={() => setActiveTab('music')}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all ${
                activeTab === 'music'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className={`text-2xl transition-transform ${activeTab === 'music' ? 'scale-110' : 'scale-100'}`}>
                🎵
              </span>
              <span className="text-xs font-medium mt-1">主題歌</span>
            </button>
            
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all ${
                activeTab === 'achievements'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className={`text-2xl transition-transform ${activeTab === 'achievements' ? 'scale-110' : 'scale-100'}`}>
                🏆
              </span>
              <span className="text-xs font-medium mt-1">実績</span>
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className={`text-2xl transition-transform ${activeTab === 'profile' ? 'scale-110' : 'scale-100'}`}>
                👤
              </span>
              <span className="text-xs font-medium mt-1">マイページ</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}