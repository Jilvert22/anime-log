# アニメログ プロジェクトドキュメント

## 📋 プロジェクト概要

アニメログは、ユーザーが自分のアニメ視聴履歴を記録・管理するWebアプリケーションです。視聴記録の管理、評価、感想の記録、SNS機能、DNAカード生成などの機能を提供します。

**本番URL**: https://anime-log-rho.vercel.app/

## 🎯 主要機能

- **視聴記録管理**: アニメの追加・評価（⭐1〜5）・周回数管理
- **クール別表示**: 放送時期ごとに整理、見逃し作品を振り返り
- **シリーズ別表示**: 同シリーズの作品をまとめて表示
- **傾向分析**: 視聴傾向をタグで分析、自分のオタクタイプを診断
- **DNAカード**: 視聴傾向を画像化してシェア
- **コレクション**: 推しキャラ、名言、布教リスト、主題歌を管理
- **SNS機能**: ユーザー検索、フォロー、プロフィール公開
- **感想機能**: アニメ全体やエピソードごとの感想を投稿・閲覧
- **積みアニメ管理**: 視聴予定のアニメを管理
- **ダークモード**: 目に優しい表示切り替え

## 🛠 技術スタック

### フロントエンド
- **Next.js 16**: React フレームワーク（App Router）
- **React 19**: UIライブラリ
- **TypeScript**: 型安全性
- **Tailwind CSS 4**: スタイリング
- **PWA**: プログレッシブウェブアプリ（next-pwa）

### バックエンド・インフラ
- **Supabase**: 認証・データベース・ストレージ
  - PostgreSQL データベース
  - Row Level Security (RLS) によるセキュリティ
  - 認証システム
  - ストレージ（アバター画像など）

### 外部API
- **AniList API**: アニメ情報取得（GraphQL）

### ホスティング・デプロイ
- **Vercel**: ホスティング・デプロイメント
- **Vercel Analytics**: アクセス解析

### 開発ツール
- **Vitest**: テストフレームワーク
- **Playwright**: E2Eテスト
- **ESLint**: リンター
- **TypeScript**: 型チェック

## 📁 プロジェクト構造

```
anime-log/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── delete-account/      # アカウント削除
│   │   ├── og/                   # OG画像生成
│   │   └── proxy-image/          # 画像プロキシ
│   ├── auth/                     # 認証関連
│   │   └── callback/             # OAuthコールバック
│   ├── components/               # Reactコンポーネント
│   │   ├── modals/               # モーダルコンポーネント（14個）
│   │   ├── tabs/                 # タブコンポーネント（15個）
│   │   └── common/               # 共通コンポーネント
│   ├── contexts/                 # React Context
│   │   ├── AnimeDataContext.tsx  # アニメデータ管理
│   │   ├── ModalContext.tsx      # モーダル管理
│   │   └── UserProfileContext.tsx # ユーザープロフィール管理
│   ├── hooks/                    # カスタムフック（20個以上）
│   ├── lib/                      # ライブラリ・ユーティリティ
│   │   ├── api/                  # API層
│   │   │   ├── anilist.ts        # AniList API
│   │   │   ├── auth.ts           # 認証API
│   │   │   ├── profile.ts        # プロフィールAPI
│   │   │   ├── social.ts         # SNS機能API
│   │   │   ├── storage.ts        # ストレージAPI
│   │   │   ├── watchlist.ts      # ウォッチリストAPI
│   │   │   └── errors.ts         # エラーハンドリング
│   │   ├── supabase/             # Supabase設定
│   │   │   ├── client.ts         # クライアント側
│   │   │   └── server.ts         # サーバー側
│   │   ├── storage/              # ストレージ関連
│   │   ├── anilist.ts            # AniList型定義
│   │   └── env.ts                # 環境変数管理
│   ├── types/                    # TypeScript型定義
│   ├── utils/                    # ユーティリティ関数
│   ├── constants/                # 定数定義
│   ├── profile/                  # プロフィールページ
│   ├── share/                    # シェアページ
│   ├── layout.tsx                # ルートレイアウト
│   └── page.tsx                  # メインページ
├── __tests__/                    # テストファイル
├── tests/                        # E2Eテスト
├── public/                       # 静的ファイル
├── supabase_*.sql                # データベーススキーマ
└── docs/                         # ドキュメント
```

## 🗄️ データベーススキーマ

### 主要テーブル

#### `animes` テーブル
アニメの視聴記録を保存

```typescript
{
  id: UUID (PRIMARY KEY)
  user_id: UUID (REFERENCES auth.users)
  season_name: TEXT
  title: TEXT
  image: TEXT | null
  rating: INTEGER | null (1-5)
  watched: BOOLEAN
  rewatch_count: INTEGER
  tags: TEXT[] | null
  songs: JSONB | null  // { op?: Song, ed?: Song }
  quotes: JSONB | null // Quote[]
  series_name: TEXT | null
  studios: TEXT[] | null
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### `watchlist` テーブル
積みアニメ（視聴予定）を管理

```typescript
{
  id: UUID (PRIMARY KEY)
  user_id: UUID (REFERENCES auth.users)
  anilist_id: INTEGER
  title: TEXT
  image: TEXT | null
  memo: TEXT | null
  status: TEXT | null  // 'planned' | 'watching' | 'completed'
  season_year: INTEGER | null
  season: TEXT | null  // 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER'
  broadcast_day: TEXT | null
  broadcast_time: TEXT | null
  created_at: TIMESTAMP
}
```

#### `user_profiles` テーブル
ユーザーの公開プロフィール情報

```typescript
{
  id: UUID (PRIMARY KEY, REFERENCES auth.users)
  username: TEXT (UNIQUE)
  bio: TEXT | null
  is_public: BOOLEAN (default: false)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### `follows` テーブル
フォロー関係を管理

```typescript
{
  id: UUID (PRIMARY KEY)
  follower_id: UUID (REFERENCES auth.users)
  following_id: UUID (REFERENCES auth.users)
  created_at: TIMESTAMP
  UNIQUE(follower_id, following_id)
  CHECK(follower_id != following_id)
}
```

#### `reviews` テーブル
アニメの感想を保存

```typescript
{
  id: UUID (PRIMARY KEY)
  anime_id: UUID (REFERENCES animes)
  user_id: UUID (REFERENCES auth.users)
  user_name: TEXT
  user_icon: TEXT
  type: TEXT  // 'overall' | 'episode'
  episode_number: INTEGER | null
  content: TEXT
  contains_spoiler: BOOLEAN
  spoiler_hidden: BOOLEAN
  likes: INTEGER (default: 0)
  helpful_count: INTEGER (default: 0)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### `review_likes` テーブル
感想へのいいねを管理

```typescript
{
  id: UUID (PRIMARY KEY)
  review_id: UUID (REFERENCES reviews)
  user_id: UUID (REFERENCES auth.users)
  created_at: TIMESTAMP
  UNIQUE(review_id, user_id)
}
```

#### `review_helpful` テーブル
感想への「役に立った」を管理

```typescript
{
  id: UUID (PRIMARY KEY)
  review_id: UUID (REFERENCES reviews)
  user_id: UUID (REFERENCES auth.users)
  created_at: TIMESTAMP
  UNIQUE(review_id, user_id)
}
```

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化されており、以下のポリシーが設定されています：

- **animes**: ユーザーは自分のデータのみ閲覧・編集可能
- **watchlist**: ユーザーは自分のデータのみ閲覧・編集可能
- **user_profiles**: 公開プロフィールは全員が閲覧可能、更新は本人のみ
- **follows**: フォロー関係は全員が閲覧可能、作成・削除は本人のみ
- **reviews**: 全員が閲覧可能、作成・更新・削除は本人のみ
- **review_likes/review_helpful**: 全員が閲覧可能、作成・削除は本人のみ

## 🏗️ アーキテクチャ

### コンポーネント構造

#### ページコンポーネント
- `app/page.tsx`: メインページ（Server Component）
- `app/components/HomeClient.tsx`: クライアント側のメインコンポーネント

#### タブコンポーネント (`app/components/tabs/`)
- `HomeTab.tsx`: ホームタブ（視聴記録一覧）
- `CollectionTab.tsx`: コレクションタブ
- `DNACardTab.tsx`: DNAカード生成タブ
- `SocialTab.tsx`: SNS機能タブ
- その他、機能別のタブコンポーネント

#### モーダルコンポーネント (`app/components/modals/`)
- アニメ追加・編集モーダル
- 感想投稿モーダル
- プロフィール編集モーダル
- その他、各種機能のモーダル

### 状態管理

#### React Context
- **AnimeDataContext**: アニメデータ（視聴記録、シーズン別データなど）を管理
- **UserProfileContext**: ユーザープロフィール情報を管理
- **ModalContext**: モーダルの開閉状態を管理

#### カスタムフック
主要なフック：

- `useAnimeData.ts`: アニメデータの取得・更新
- `useAuth.ts`: 認証状態の管理
- `useUserProfile.ts`: ユーザープロフィールの管理
- `useCollection.ts`: コレクション（推しキャラ、名言など）の管理
- `useAnimeReviews.ts`: 感想の取得・投稿
- `useSocial.ts`: SNS機能（フォロー、検索など）
- `useWatchlist.ts`: 積みアニメの管理
- `useDarkMode.ts`: ダークモードの切り替え
- `useModals.ts`: モーダルの管理

### API層 (`app/lib/api/`)

すべてのSupabase操作はAPI層を通じて行われます：

- **エラーハンドリング**: 統一されたエラー処理
- **型安全性**: TypeScriptによる型定義
- **認証チェック**: `requireAuth()` による認証確認

主要なAPIモジュール：

- `auth.ts`: 認証関連（サインイン、サインアップ、サインアウト）
- `profile.ts`: プロフィール管理（取得、更新、アバターアップロード）
- `social.ts`: SNS機能（フォロー、フォロワー取得、ユーザー検索）
- `watchlist.ts`: 積みアニメ管理
- `anilist.ts`: AniList APIとの連携
- `storage.ts`: ストレージ操作（画像アップロード、削除）

### 認証フロー

1. ユーザーがサインイン/サインアップ
2. Supabase Authで認証
3. 認証成功後、`user_profiles`テーブルにプロフィール作成（初回のみ）
4. セッション管理はSupabaseが自動的に行う

### データフロー

1. **アニメ追加**:
   - ユーザーがAniList APIからアニメを検索
   - 選択したアニメを`animes`テーブルに保存
   - `AnimeDataContext`が更新され、UIに反映

2. **感想投稿**:
   - ユーザーが感想を入力
   - `reviews`テーブルに保存
   - 関連するアニメの感想一覧が更新

3. **フォロー**:
   - ユーザーが他のユーザーをフォロー
   - `follows`テーブルに保存
   - フォロワー/フォロー中リストが更新

## 🔧 開発環境のセットアップ

### 必要条件

- Node.js 18.0.0以上
- npm
- Supabaseアカウント（開発用プロジェクト）

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/Jilvert22/anime-log.git
cd anime-log

# 依存関係をインストール
npm install
```

### 環境変数

`.env.local` ファイルを作成し、以下を設定：

```env
# Supabase設定（必須）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# サイトURL（オプション、デフォルト: https://animelog.jp）
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# バンドル分析（オプション）
ANALYZE=true
```

### データベースセットアップ

Supabaseダッシュボードで以下のSQLファイルを順番に実行：

1. `supabase_watchlist.sql` - ウォッチリストテーブル
2. `supabase_sns.sql` - SNS機能テーブル
3. `supabase_reviews.sql` - 感想テーブル
4. `supabase_add_handle.sql` - ハンドル名追加
5. `supabase_add_series_name.sql` - シリーズ名追加
6. `supabase_add_studios.sql` - スタジオ追加
7. その他のマイグレーションファイル

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

### ビルド

```bash
# 本番ビルド
npm run build

# バンドル分析付きビルド
ANALYZE=true npm run build
```

### テスト

```bash
# ウォッチモードで実行
npm run test

# 1回だけ実行
npm run test:run

# カバレッジ付きで実行
npm run test:coverage

# E2Eテスト（Playwright）
npx playwright test
```

## 🎨 デザインシステム

### カラーパレット

| 用途 | カラーコード |
|------|-------------|
| メインピンク | `#ffc2d1` |
| メイン黄色 | `#ffd966` |
| サブオレンジ | `#ffb07c` |
| 背景（ライト） | `#fef6f0` |
| 濃い色 | `#6b5b6e` |

### フォント

- **M PLUS Rounded 1c**: 日本語用フォント
- **Poppins**: 英数字用フォント

### ダークモード

`useDarkMode`フックを使用してダークモードを実装。ユーザーの設定をローカルストレージに保存。

## 📝 主要な型定義

### アニメ関連

```typescript
type Anime = {
  id: number;
  title: string;
  image: string;
  rating: number;
  watched: boolean;
  rewatchCount?: number;
  tags?: string[];
  seriesName?: string;
  studios?: string[];
  songs?: { op?: Song; ed?: Song };
  quotes?: Quote[];
  reviews?: Review[];
};

type Song = {
  title: string;
  artist: string;
  rating: number;
  isFavorite: boolean;
};

type Quote = {
  text: string;
  character?: string;
};
```

### 感想関連

```typescript
type Review = {
  id: string;
  animeId: number;
  userId: string;
  userName: string;
  userIcon: string;
  type: 'overall' | 'episode';
  episodeNumber?: number;
  content: string;
  containsSpoiler: boolean;
  spoilerHidden: boolean;
  likes: number;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  userLiked?: boolean;
  userHelpful?: boolean;
};
```

## 🚀 デプロイメント

### Vercelへのデプロイ

1. GitHubリポジトリにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
4. デプロイ

### 環境変数の設定

Vercelダッシュボードの「Settings」→「Environment Variables」で設定。

## 🔒 セキュリティ

- **Row Level Security (RLS)**: SupabaseのRLSにより、データベースレベルでアクセス制御
- **認証**: Supabase Authによる安全な認証
- **環境変数**: 機密情報は環境変数で管理
- **CORS**: 適切なCORS設定

## 📚 追加ドキュメント

プロジェクト内のその他のドキュメント：

- `README.md`: 基本的なプロジェクト情報
- `CONTRIBUTING.md`: コントリビューションガイド
- `DEBUG_GUIDE.md`: デバッグガイド
- `docs/email/`: メール認証関連のドキュメント
- `SUPABASE_STORAGE_SETUP.md`: ストレージ設定ガイド

## 🐛 トラブルシューティング

### よくある問題

1. **環境変数が読み込まれない**
   - `.env.local`ファイルが正しく配置されているか確認
   - サーバーを再起動

2. **Supabase接続エラー**
   - 環境変数が正しく設定されているか確認
   - Supabaseプロジェクトがアクティブか確認

3. **ビルドエラー**
   - TypeScriptの型エラーを確認
   - `npm run lint`でリンターエラーを確認

## 📞 サポート

問題が発生した場合：

1. 既存のドキュメントを確認
2. GitHubのIssuesを確認
3. 必要に応じて新しいIssueを作成

## 📄 ライセンス

Private

---

**最終更新**: 2024年

