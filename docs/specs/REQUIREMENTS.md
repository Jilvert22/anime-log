# アニメログ機能拡張 要件定義書

## 1. クール検索・一括登録機能

### 1.1 機能概要
- AniList APIを使用してクール（シーズン+年）でアニメを検索
- 検索結果を一覧表示し、複数選択して一括登録
- 登録時は評価不要（後から設定可能）

### 1.2 データ構造
```typescript
// Anime型の拡張
type Anime = {
  // 既存フィールド
  id: number;
  title: string;
  image: string;
  rating: number; // 0 = 未評価（デフォルト）
  watched: boolean;
  // ... 既存フィールド
};
```

### 1.3 UI/UX設計
- **検索方法**: クール選択（年 + シーズン: 春/夏/秋/冬）
- **検索結果表示**: グリッドまたはリスト形式
- **選択方法**: チェックボックスで複数選択
- **一括登録**: 「選択したアニメを登録」ボタン
- **登録後の動作**: 選択したアニメを指定クールに追加（評価は0のまま）

### 1.4 AniList API拡張
```typescript
// app/lib/anilist.ts に追加
export async function searchAnimeBySeason(
  season: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER',
  seasonYear: number,
  page: number = 1,
  perPage: number = 50
)
```

## 2. 感想機能

### 2.1 機能概要
- アニメごとに感想を書ける
- 全体感想と話数感想（エピソード別）の両方に対応
- ネタバレ対策（ネタバレ警告、ネタバレ非表示設定）
- 他者からの評価機能（いいね/役に立った）
- 掲示板的な要素（他のユーザーの感想も閲覧可能）

### 2.2 データ構造
```typescript
// 感想の型定義
type Review = {
  id: number;
  animeId: number;
  userId: string; // Supabaseのuser_id
  userName: string;
  userIcon: string;
  type: 'overall' | 'episode'; // 全体感想 or 話数感想
  episodeNumber?: number; // 話数感想の場合
  content: string; // 感想本文
  containsSpoiler: boolean; // ネタバレ含むか
  spoilerHidden: boolean; // ネタバレ非表示設定
  likes: number; // いいね数
  helpfulCount: number; // 役に立った数
  createdAt: Date;
  updatedAt: Date;
};

// Anime型に追加
type Anime = {
  // ... 既存フィールド
  reviews?: Review[]; // 感想一覧（オプション）
};
```

### 2.3 UI/UX設計

#### 2.3.1 感想投稿画面
- **タブ切り替え**: 「全体感想」「話数感想」
- **ネタバレチェック**: チェックボックス「ネタバレを含む」
- **ネタバレ非表示設定**: ユーザー設定で「ネタバレを含む感想を非表示」
- **投稿ボタン**: 「感想を投稿」

#### 2.3.2 感想表示画面
- **アニメ詳細モーダル内に「感想」タブ追加**
- **フィルタ**: 「すべて」「全体感想のみ」「話数感想のみ」
- **ソート**: 「新着順」「評価順」「役に立った順」
- **ネタバレ警告**: 「⚠️ ネタバレを含む感想です」バナー
- **展開/折りたたみ**: ネタバレ含む感想は折りたたみ、クリックで展開
- **評価ボタン**: 「いいね」「役に立った」ボタン
- **自分の感想**: 編集・削除ボタン表示

#### 2.3.3 話数感想の表示
- エピソード別にグループ化
- 「第1話の感想」「第2話の感想」など

### 2.4 Supabaseテーブル設計
```sql
-- reviews テーブル
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id UUID NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_icon TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('overall', 'episode')),
  episode_number INTEGER,
  content TEXT NOT NULL,
  contains_spoiler BOOLEAN DEFAULT false,
  spoiler_hidden BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- review_likes テーブル（いいね管理）
CREATE TABLE review_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- review_helpful テーブル（役に立った管理）
CREATE TABLE review_helpful (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);
```

## 3. 実績の拡張

### 3.1 新しい実績
```typescript
const newAchievements: Achievement[] = [
  { id: 'review1', name: '初めての感想', desc: '初めて感想を投稿', icon: '✍️', rarity: 'common', condition: 1 },
  { id: 'review10', name: '感想マスター', desc: '10件の感想を投稿', icon: '📝', rarity: 'rare', condition: 10 },
  { id: 'review50', name: '感想の達人', desc: '50件の感想を投稿', icon: '📚', rarity: 'epic', condition: 50 },
  { id: 'liked10', name: '人気の感想', desc: '感想に10いいね獲得', icon: '❤️', rarity: 'rare', condition: 10 },
  { id: 'liked50', name: '感想のスター', desc: '感想に50いいね獲得', icon: '⭐', rarity: 'epic', condition: 50 },
  { id: 'helpful10', name: '役に立つ感想', desc: '感想に10「役に立った」獲得', icon: '👍', rarity: 'rare', condition: 10 },
];
```

## 4. 実装優先順位

### Phase 1: クール検索・一括登録（最優先）
1. AniList API拡張（クール検索関数追加）
2. クール選択UI（年 + シーズン選択）
3. 検索結果一覧表示
4. 複数選択機能
5. 一括登録機能
6. 評価を0（未評価）で登録

### Phase 2: 感想機能（基本）
1. データ構造定義
2. Supabaseテーブル作成
3. 感想投稿機能（全体感想のみ）
4. 感想表示機能
5. ネタバレ警告表示

### Phase 3: 感想機能（拡張）
1. 話数感想機能
2. ネタバレ非表示設定
3. いいね機能
4. 役に立った機能
5. フィルタ・ソート機能

### Phase 4: 実績拡張
1. 感想関連実績の追加
2. 評価関連実績の追加

## 5. 技術的考慮事項

### 5.1 パフォーマンス
- クール検索結果はページネーション対応（50件ずつ）
- 感想一覧もページネーション対応

### 5.2 セキュリティ
- RLS（Row Level Security）でユーザーごとのデータ保護
- ネタバレ非表示はクライアント側で実装（サーバー側でもフィルタ可能）

### 5.3 UX
- ローディング状態の表示
- エラーハンドリング
- オフライン対応（localStorageフォールバック）

