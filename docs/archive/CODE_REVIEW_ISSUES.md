# アニメログ コードレビュー - 問題点リスト

## 🔴 優先度：高

### 1. Supabaseクライアントのサーバー/クライアント使い分けが不適切

**問題点：**
- Server ComponentsやAPI routesで`@supabase/supabase-js`の`createClient`を直接使用している
- `@supabase/ssr`パッケージを使用していないため、サーバー側でのセッション管理が適切に行われていない
- クッキーベースの認証が機能していない可能性

**影響箇所：**
- `app/profile/[username]/page.tsx` (39行目)
- `app/share/[username]/page.tsx` (39行目)
- `app/api/og/route.tsx` (71行目)
- `app/api/delete-account/route.ts` (25行目)

**推奨対応：**
- `@supabase/ssr`をインストール
- Server Components用の`createServerClient`、API routes用の`createRouteHandlerClient`を使用
- クッキーを適切に処理する

**参考：**
```typescript
// Server Component用
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
    },
  }
)
```

---

### 2. Edge RuntimeでのSupabaseクライアント使用

**問題点：**
- `app/api/og/route.tsx`で`export const runtime = 'edge'`を使用しているが、Edge Runtimeでは`@supabase/supabase-js`の一部機能が制限される可能性がある
- クッキー処理がEdge Runtimeで正しく動作しない可能性

**影響箇所：**
- `app/api/og/route.tsx` (5行目、71行目)

**推奨対応：**
- Edge Runtimeを削除するか、Node.js runtimeに変更
- または、Edge Runtime用の適切な実装に変更

---

### 3. API Routeでの認証トークン処理が手動

**問題点：**
- `app/api/delete-account/route.ts`で認証トークンを手動で処理している（33-36行目）
- Supabaseのヘルパー関数を使用すべき

**影響箇所：**
- `app/api/delete-account/route.ts` (32-40行目)

**推奨対応：**
- `createRouteHandlerClient`を使用してクッキーから自動的にセッションを取得
- 手動でのトークン処理を削除

---

### 4. メインページ全体がClient Component

**問題点：**
- `app/page.tsx`が全体で`'use client'`になっている
- 初期データ取得などはServer Componentで行うべき
- パフォーマンスとSEOに影響

**影響箇所：**
- `app/page.tsx` (1行目)

**推奨対応：**
- 可能な限りServer Componentに分割
- クライアント側のインタラクションが必要な部分のみClient Component化
- 初期データ取得はServer Componentで行う

---

## 🟡 優先度：中

### 5. 型安全性の問題（any型の多用）

**問題点：**
- `any`型が多数使用されている
- 型安全性が損なわれている

**影響箇所：**
- `app/page.tsx` (214-237行目): `any[]`, `any`型の変数
- `app/components/tabs/HomeTab.tsx`: 複数箇所で`any`型を使用

**推奨対応：**
- 適切な型定義を作成
- `any`型を具体的な型に置き換え

---

### 6. Server Componentsでの環境変数アクセス

**問題点：**
- Server Componentsで環境変数に直接アクセスしているが、エラーハンドリングが不十分
- `process.env.NEXT_PUBLIC_SUPABASE_URL!`のように非nullアサーションを使用している

**影響箇所：**
- `app/profile/[username]/page.tsx` (5-6行目)
- `app/share/[username]/page.tsx` (5-6行目)
- `app/api/og/route.tsx` (7-8行目)

**推奨対応：**
- 環境変数の存在チェックを追加
- 適切なエラーメッセージを返す

---

### 7. コメントアウトされたコードと一時的なデフォルト値

**問題点：**
- `app/page.tsx`で`useSocial`フックがコメントアウトされ、一時的なデフォルト値が使用されている（214-237行目）
- コードの可読性と保守性に影響

**影響箇所：**
- `app/page.tsx` (29行目、186-237行目)

**推奨対応：**
- 不要なコードは削除
- 一時的な実装は正式な実装に置き換え
- 機能が無効化されている場合は、設定で制御する

---

### 8. グローバルSupabaseクライアントの使用

**問題点：**
- `app/lib/supabase.ts`でグローバルなSupabaseクライアントをエクスポートしている
- クライアント側では問題ないが、サーバー側では適切なセッション管理ができない

**影響箇所：**
- `app/lib/supabase.ts` (10行目)

**推奨対応：**
- クライアント用とサーバー用でクライアント作成関数を分離
- または、`@supabase/ssr`を使用して適切に管理

---

### 9. エラーハンドリングの不統一

**問題点：**
- エラーハンドリングが統一されていない
- 一部の関数でエラーを`console.error`のみで処理し、ユーザーに通知していない

**影響箇所：**
- 複数箇所

**推奨対応：**
- エラーハンドリングのパターンを統一
- ユーザー向けのエラーメッセージを適切に表示

---

## 🟢 優先度：低

### 10. Tailwind CSSクラス名の警告

**問題点：**
- LinterがTailwind CSSクラス名の警告を出している
- `aspect-[3/4]` → `aspect-3/4`
- `bg-gradient-to-br` → `bg-linear-to-br`

**影響箇所：**
- `app/components/tabs/WatchlistTab.tsx` (27行目、281行目)

**推奨対応：**
- クラス名を修正（ただし、Tailwind CSS 4の仕様を確認）

---

### 11. 型定義の重複

**問題点：**
- 型定義が複数のファイルに散在している可能性
- `UserProfile`型が`app/lib/supabase.ts`に定義されているが、他の場所でも定義されている可能性

**推奨対応：**
- 型定義を一元管理
- 共通の型定義ファイルを作成

---

### 12. 未使用のインポートや変数

**問題点：**
- 未使用のインポートや変数が存在する可能性

**推奨対応：**
- ESLintの未使用変数チェックを有効化
- 未使用のコードを削除

---

### 13. ESLintリントエラー（技術的負債）

**問題点：**
- ESLintで37件のエラーと210件の警告が検出されている
- CIでは`continue-on-error: true`により記録されつつも続行されている
- コード品質の向上余地がある

**主なエラー内容：**
- 未使用変数・インポート（多数）
- `any`型の使用（型安全性の問題）
- React Hooksの依存配列の問題
- `@ts-ignore`の使用（`@ts-expect-error`に変更推奨）
- `public/sw.js`や`public/workbox-*.js`などの自動生成ファイルの警告

**影響箇所：**
- 複数ファイルにわたる

**推奨対応：**
- 余裕があるときに少しずつ対応
- 優先度の高いエラーから順に対応
- 自動生成ファイルは`.eslintignore`で除外することを検討

**現状：**
- CI/CD自動化により、リントエラーは記録されているが、CIは正常に動作
- 技術的負債として記録し、段階的に対応予定

---

## 📋 まとめ

### 緊急に対応すべき項目（優先度：高）
1. Supabaseクライアントのサーバー/クライアント使い分け
2. Edge RuntimeでのSupabaseクライアント使用
3. API Routeでの認証トークン処理
4. メインページ全体がClient Component

### 改善推奨項目（優先度：中）
5. 型安全性の問題
6. Server Componentsでの環境変数アクセス
7. コメントアウトされたコード
8. グローバルSupabaseクライアントの使用
9. エラーハンドリングの不統一

### 細かい改善項目（優先度：低）
10. Tailwind CSSクラス名の警告
11. 型定義の重複
12. 未使用のインポートや変数
13. ESLintリントエラー（技術的負債）

---

## 🔧 推奨される対応順序

1. **まず対応すべき：** Supabaseクライアントの適切な使い分け（`@supabase/ssr`の導入）
2. **次に：** メインページのServer Component化
3. **その後：** 型安全性の向上
4. **最後に：** 細かいリファクタリング


