
// タグ一覧
export const availableTags = [
  { label: '泣ける', value: '泣ける' },
  { label: '熱い', value: '熱い' },
  { label: '笑える', value: '笑える' },
  { label: '考察', value: '考察' },
  { label: '作画神', value: '作画神' },
  { label: '音楽最高', value: '音楽最高' },
  { label: 'キャラ萌え', value: 'キャラ萌え' },
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
