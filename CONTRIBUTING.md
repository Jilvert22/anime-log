# 開発ガイドライン

## 開発環境

- Node.js 18.0.0以上
- npm
- Mac / Windows / Linux

## セットアップ
```bash
git clone https://github.com/Jilvert22/anime-log.git
cd anime-log
npm install
cp .env.example .env.local  # 環境変数を設定
npm run dev
```

## ブランチ戦略

- `main` - 本番環境（Vercelに自動デプロイ）
- `feature/*` - 新機能開発
- `fix/*` - バグ修正

## コミットメッセージ

日本語でOK。以下の形式を推奨：
```
[種類] 概要

例:
[feat] アニメ検索機能を追加
[fix] ダークモード切り替えのバグを修正
[refactor] useAnimeDataのリファクタリング
[docs] READMEを更新
[test] useCountAnimationのテストを追加
```

## コーディング規約

### TypeScript

- `any` の使用は避ける
- 型は `app/types/index.ts` に定義
- コンポーネントのPropsは明示的に型定義

### React

- カスタムフックは `app/hooks/` に配置
- コンポーネントは `app/components/` に配置
- イベントハンドラーは `useCallback` でメモ化
- 計算値は `useMemo` でメモ化

### ファイル構成
```
app/
├── components/
│   ├── modals/      # モーダルコンポーネント
│   └── tabs/        # タブコンポーネント
├── hooks/           # カスタムフック
├── lib/             # 外部サービス設定
├── types/           # 型定義
├── utils/           # ユーティリティ関数
└── constants/       # 定数
```

## テスト

### テストの実行
```bash
npm run test        # ウォッチモードで実行
npm run test:run    # 1回だけ実行
npm run test:coverage  # カバレッジ付きで実行
```

### テストファイルの配置
```
__tests__/
├── setup.ts         # テストセットアップ
├── hooks/           # フックのテスト
└── utils/           # ユーティリティのテスト
```

### テストの書き方
```typescript
import { describe, it, expect } from 'vitest';

describe('機能名', () => {
  it('期待する動作の説明', () => {
    // Arrange（準備）
    // Act（実行）
    // Assert（検証）
  });
});
```

## デプロイ

`main` ブランチにマージすると、Vercelに自動デプロイされます。

デプロイ前のチェックリスト：
- [ ] `npm run build` が成功する
- [ ] `npm run lint` でエラーがない
- [ ] `npm run test:run` が全て通る

## トラブルシューティング

### ビルドエラー
```bash
rm -rf .next node_modules
npm install
npm run build
```

### 型エラー
```bash
npx tsc --noEmit
```

### Supabase接続エラー

`.env.local` の環境変数を確認してください。




