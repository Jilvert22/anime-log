# アニメログ

自分だけのアニメ視聴履歴を記録・管理するWebアプリ

🔗 **本番URL**: https://animelog.jp/

📖 **詳細なプロジェクトドキュメント**: [PROJECT.md](./PROJECT.md) を参照してください

## 特徴

- 📺 **視聴記録** - アニメを追加・評価（⭐1〜5）・周回数を管理
- 📅 **クール別表示** - 放送時期ごとに整理、見逃し作品を振り返り
- 🎯 **シリーズ別表示** - 同シリーズの作品をまとめて表示
- 📊 **傾向分析** - 視聴傾向をタグで分析、自分のオタクタイプを診断
- 🧬 **DNAカード** - 視聴傾向を画像化してシェア
- 🏆 **コレクション** - 推しキャラ、名言、布教リスト、主題歌を管理
- 👥 **SNS機能** - ユーザー検索、フォロー、プロフィール公開
- 🌙 **ダークモード** - 目に優しい表示切り替え

## 技術スタック

- **フロントエンド**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **バックエンド**: Supabase (認証・データベース)
- **外部API**: AniList API (アニメ情報取得)
- **ホスティング**: Vercel

## 開発環境のセットアップ

### 必要条件

- Node.js 18.0.0以上
- npm

### インストール
```bash
git clone https://github.com/Jilvert22/anime-log.git
cd anime-log
npm install
```

### 環境変数

`.env.local` を作成し、以下を設定:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 起動
```bash
npm run dev
```

http://localhost:3000 でアクセス

## テスト
```bash
npm run test        # ウォッチモードで実行
npm run test:run    # 1回だけ実行
npm run test:coverage  # カバレッジ付きで実行
```

テストは `__tests__/` ディレクトリに配置しています。

## プロジェクト構成
```
app/
├── components/
│   ├── modals/      # モーダルコンポーネント (16個)
│   └── tabs/        # タブコンポーネント (4個)
├── hooks/           # カスタムフック (12個)
├── lib/             # Supabase設定
├── types/           # TypeScript型定義
├── utils/           # ユーティリティ関数
├── constants/       # 定数定義
└── page.tsx         # メインページ
```

## カラーパレット

| 用途 | カラーコード |
|------|-------------|
| メインピンク | `#ffc2d1` |
| メイン黄色 | `#ffd966` |
| サブオレンジ | `#ffb07c` |
| 背景（ライト） | `#fef6f0` |
| 濃い色 | `#6b5b6e` |

## 設計思想

- **クール別の振り返り**: 特定時期に見れなかった作品を思い出せる
- **シェア機能**: 好きな作品を人に自慢・語れる
- **シンプル**: 機能過多を避け、使いやすさを重視

## ライセンス

Private
