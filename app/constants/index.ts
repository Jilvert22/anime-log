import type { Season, Achievement, FavoriteCharacter } from '../types';

// タグ一覧
export const availableTags = [
  { emoji: '😭', label: '泣ける', value: '泣ける' },
  { emoji: '🔥', label: '熱い', value: '熱い' },
  { emoji: '🤣', label: '笑える', value: '笑える' },
  { emoji: '🤔', label: '考察', value: '考察' },
  { emoji: '✨', label: '作画神', value: '作画神' },
  { emoji: '🎵', label: '音楽最高', value: '音楽最高' },
  { emoji: '💕', label: 'キャラ萌え', value: 'キャラ萌え' },
];

// プリセットカテゴリ
export const characterCategories = [
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

// オタクタイプの種類
export const otakuTypes = [
  { emoji: '🔍', label: '考察厨', value: '🔍 考察厨', description: '考察や伏線回収が好き' },
  { emoji: '😭', label: '感情移入型', value: '😭 感情移入型', description: '感情移入して泣ける作品が好き' },
  { emoji: '🎨', label: '作画厨', value: '🎨 作画厨', description: '作画のクオリティを重視' },
  { emoji: '🎵', label: '音響派', value: '🎵 音響派', description: '音楽や音響を重視' },
  { emoji: '💕', label: 'キャラオタ', value: '💕 キャラオタ', description: 'キャラクターが好き' },
  { emoji: '🔥', label: '熱血派', value: '🔥 熱血派', description: '熱い展開やバトルが好き' },
  { emoji: '🎬', label: 'ストーリー重視', value: '🎬 ストーリー重視', description: 'ストーリーの完成度を重視' },
  { emoji: '🌸', label: '日常系好き', value: '🌸 日常系好き', description: '日常系やほのぼの系が好き' },
  { emoji: '⚔️', label: 'バトル好き', value: '⚔️ バトル好き', description: 'バトルシーンを重視' },
  { emoji: '🎪', label: 'エンタメ重視', value: '🎪 エンタメ重視', description: 'エンターテイメント性を重視' },
];

// プリセットタグ
export const characterPresetTags = [
  'ツンデレ', 'ヤンデレ', 'クーデレ', '天然',
  '幼馴染', '先輩', '後輩', 'ライバル',
  'メガネ', '黒髪', '銀髪', 'ケモミミ',
  'お嬢様', 'ギャル', '清楚', 'ボクっ娘',
];

// サンプルデータ（推しキャラ）
export const sampleFavoriteCharacters: FavoriteCharacter[] = [
  { id: 1, name: 'モモ', animeId: 1, animeName: 'ダンダダン', image: '👻', category: '推し', tags: ['ギャル', '天然'] },
  { id: 2, name: 'フリーレン', animeId: 2, animeName: '葬送のフリーレン', image: '🧝', category: '尊い系', tags: ['クーデレ', '銀髪'] },
  { id: 3, name: '後藤ひとり', animeId: 4, animeName: 'ぼっち・ざ・ろっく！', image: '🎸', category: '守りたい系', tags: ['黒髪', '天然'] },
];

// 実績データ
export const achievements: Achievement[] = [
  { id: 'first', name: '初めの一歩', desc: '初めてアニメを登録', icon: '🌱', rarity: 'common', condition: 1 },
  { id: 'ten', name: '駆け出しオタク', desc: '10作品視聴', icon: '📺', rarity: 'common', condition: 10 },
  { id: 'fifty', name: '中堅オタク', desc: '50作品視聴', icon: '🎖️', rarity: 'rare', condition: 50 },
  { id: 'hundred', name: '歴戦の猛者', desc: '100作品視聴', icon: '🏅', rarity: 'epic', condition: 100 },
  { id: 'rewatch3', name: '反復横跳び', desc: '1作品を3周', icon: '🔄', rarity: 'common', condition: 3 },
  { id: 'rewatch10', name: '周回の鬼', desc: '1作品を10周', icon: '🌀', rarity: 'legendary', condition: 10 },
  { id: 'godtaste', name: '神の舌', desc: '⭐5を10作品つける', icon: '👑', rarity: 'rare', condition: 10 },
  // 感想関連実績
  { id: 'review1', name: '初めての感想', desc: '初めて感想を投稿', icon: '✍️', rarity: 'common', condition: 1 },
  { id: 'review10', name: '感想マスター', desc: '10件の感想を投稿', icon: '📝', rarity: 'rare', condition: 10 },
  { id: 'review50', name: '感想の達人', desc: '50件の感想を投稿', icon: '📚', rarity: 'epic', condition: 50 },
  { id: 'liked10', name: '人気の感想', desc: '感想に10いいね獲得', icon: '❤️', rarity: 'rare', condition: 10 },
  { id: 'liked50', name: '感想のスター', desc: '感想に50いいね獲得', icon: '⭐', rarity: 'epic', condition: 50 },
  { id: 'helpful10', name: '役に立つ感想', desc: '感想に10「役に立った」獲得', icon: '👍', rarity: 'rare', condition: 10 },
];

// サンプルデータ
export const sampleSeasons: Season[] = [
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
export const ratingLabels: { [key: number]: { label: string; emoji: string } } = {
  5: { label: '神作', emoji: '🏆' },
  4: { label: '名作', emoji: '⭐' },
  3: { label: '良作', emoji: '😊' },
  2: { label: '完走', emoji: '🏃' },
  1: { label: '虚無', emoji: '😇' },
};

// ジャンル翻訳マップ
export const genreTranslation: { [key: string]: string } = {
  'Action': 'アクション',
  'Adventure': 'アドベンチャー',
  'Comedy': 'コメディ',
  'Drama': 'ドラマ',
  'Ecchi': 'エッチ',
  'Fantasy': 'ファンタジー',
  'Horror': 'ホラー',
  'Mahou Shoujo': '魔法少女',
  'Mecha': 'メカ',
  'Music': '音楽',
  'Mystery': 'ミステリー',
  'Psychological': 'サイコ',
  'Romance': 'ロマンス',
  'Sci-Fi': 'SF',
  'Slice of Life': '日常',
  'Sports': 'スポーツ',
  'Supernatural': '超自然',
  'Thriller': 'スリラー',
};
