# CLAUDE.md - アニメログ

## プロジェクト概要

アニメ視聴履歴を記録・管理するWebアプリ。
本番URL: https://animelog.jp/

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router) + React 19 + TypeScript
- **スタイリング**: Tailwind CSS 4
- **バックエンド**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **外部API**: AniList API (GraphQL) - アニメ情報取得
- **ホスティング**: Vercel (mainブランチへのpushで自動デプロイ)
- **PWA**: next-pwa
- **テスト**: Vitest (単体テスト), Playwright (E2E)
- **アイコン**: lucide-react

## コマンド

```bash
npm run dev          # 開発サーバー (localhost:3000)
npm run build        # 本番ビルド
npm run lint         # ESLint
npm run type-check   # TypeScript型チェック
npm run test:run     # 単体テスト（1回実行）
npm run test         # 単体テスト（ウォッチモード）
npx playwright test  # E2Eテスト
```

## ディレクトリ構成

```
app/
├── components/
│   ├── modals/          # モーダル (16個: AuthModal, AnimeDetailModal, SettingsModal 等)
│   ├── tabs/            # タブ (9個: HomeTab, MyPageTab, WatchlistTab 等)
│   └── common/          # 共通コンポーネント
├── hooks/               # カスタムフック (26個)
├── lib/
│   ├── api/             # API層 (Supabase操作はすべてここ経由)
│   │   ├── anilist.ts   # AniList API連携
│   │   ├── auth.ts      # 認証
│   │   ├── profile.ts   # プロフィール
│   │   ├── social.ts    # SNS機能
│   │   ├── watchlist.ts # 視聴予定
│   │   ├── errors.ts    # エラーハンドリング
│   │   └── client.ts    # Supabaseクライアント
│   ├── supabase/        # Supabase設定 (client.ts, server.ts)
│   └── storage/         # ストレージ関連
├── contexts/            # React Context (AnimeData, Modal, UserProfile)
├── types/               # 型定義
├── utils/               # ユーティリティ
├── constants/           # 定数
├── api/                 # API Routes (delete-account, og, proxy-image)
├── auth/callback/       # OAuthコールバック
├── profile/             # プロフィールページ
├── share/               # シェアページ
├── layout.tsx           # ルートレイアウト
└── page.tsx             # メインページ (Server Component)
__tests__/               # Vitestテスト
tests/                   # Playwright E2Eテスト
supabase_*.sql           # DBマイグレーション
```

## コーディング規約

- **`any` 禁止** - 型は `app/types/index.ts` に定義
- **イベントハンドラー** は `useCallback` でメモ化
- **計算値** は `useMemo` でメモ化
- **DB操作** は `app/lib/api/` 経由。直接Supabaseを呼ばない
- **認証チェック** は `requireAuth()` を使用してからDB操作
- **コンポーネント** は `app/components/` に配置
- **カスタムフック** は `app/hooks/` に配置
- **パスエイリアス**: `@/*` でルートから参照可能

## コミット規約

日本語OK。接頭辞形式:
```
[feat] 新機能の説明
[fix] バグ修正の説明
[refactor] リファクタリングの説明
[docs] ドキュメント更新
[test] テスト追加
```

## ブランチ戦略

- `main` - 本番 (Vercel自動デプロイ)
- `feature/*` - 新機能
- `fix/*` - バグ修正

## DB (Supabase)

主要テーブル: `animes`, `watchlist`, `user_profiles`, `follows`, `reviews`, `review_likes`, `review_helpful`

すべてのテーブルでRLSが有効。ユーザーは自分のデータのみ編集可能。公開データ (プロフィール, レビュー等) は全員閲覧可能。

## 環境変数 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=...        # 必須
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # 必須
NEXT_PUBLIC_SITE_URL=...            # ローカルではhttp://localhost:3000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...    # プッシュ通知用
```

## デザイン

- カラー: ピンク系 (#ffc2d1), 黄色 (#ffd966), オレンジ (#ffb07c), 背景 (#fef6f0)
- フォント: M PLUS Rounded 1c (日本語), Poppins (英数字)
- ダークモード対応 (`useDarkMode` フック)
