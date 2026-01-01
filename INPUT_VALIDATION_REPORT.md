# 入力長制限の実装状況レポート

**作成日**: 2025年
**目的**: ユーザー入力フィールドの文字数制限の実装状況を確認

---

## 📊 現在の実装状況

### 1. データベーススキーマの制約

#### `user_profiles` テーブル (`supabase_sns.sql`)
- `username TEXT UNIQUE NOT NULL` - **制限なし**
- `bio TEXT` - **制限なし**
- `handle TEXT` (後から追加された可能性) - **制限なし**

#### `reviews` テーブル (`supabase_reviews.sql`)
- `content TEXT NOT NULL` - **制限なし**
- `user_name TEXT NOT NULL` - **制限なし**

#### `watchlist` テーブル (`supabase_watchlist.sql`)
- `memo TEXT` - **制限なし**
- `title TEXT NOT NULL` - **制限なし**

**結論**: すべてのTEXT型カラムに長さ制限がありません。アプリケーション側での検証が必要です。

---

### 2. アプリケーション側の検証状況

#### ✅ `app/lib/api/profile.ts` - プロフィール関連

**現在の検証**:
- `username`: `trim()` のみ（空文字チェックあり）
- `bio`: 検証なし
- `handle`: `trim()` + 正規化のみ（重複チェックあり）

**検証が不足している箇所**:
- ❌ `username` の長さ検証なし
- ❌ `bio` の長さ検証なし
- ❌ `handle` の長さ検証なし
- ❌ `otaku_type_custom` の長さ検証なし

#### ✅ `app/components/modals/ReviewModal.tsx` - 感想投稿

**現在の検証**:
- `content`: `trim()` のみ（空文字チェックあり）

**検証が不足している箇所**:
- ❌ `content` の長さ検証なし

#### ✅ `app/lib/api/watchlist.ts` - ウォッチリスト

**現在の検証**:
- `memo`: 検証なし（null許可）

**検証が不足している箇所**:
- ❌ `memo` の長さ検証なし
- ❌ `title` の長さ検証なし（ただし、AniListから取得されるため優先度は低い）

#### ❓ 名言（quotes）について

- データ構造を確認する必要があります（`animes`テーブルの`quotes` JSONBフィールド）

---

## 📝 推奨される入力長制限

以下の制限を推奨します：

| フィールド | 推奨上限 | 理由 | 実装優先度 |
|-----------|---------|------|-----------|
| `username` | 30文字 | 表示・検索の利便性 | 🔴 高 |
| `bio` | 500文字 | プロフィール表示 | 🔴 高 |
| `handle` | 30文字 | ユーザー名と同様 | 🔴 高 |
| `otaku_type_custom` | 50文字 | カスタムタイプ表示 | 🟡 中 |
| `content` (reviews) | 5,000文字 | 適度な長さ | 🔴 高 |
| `memo` (watchlist) | 1,000文字 | 備忘録用途 | 🟡 中 |
| `quotes.text` | 500文字 | 引用として適切 | 🟡 中 |
| `quotes.character` | 50文字 | キャラクター名 | 🟢 低 |

---

## 🔍 検証が必要なファイル

### 優先度: 高

1. **`app/lib/api/profile.ts`**
   - `upsertUserProfile()` 関数
   - `username`, `bio`, `handle`, `otaku_type_custom` の長さ検証を追加

2. **`app/components/modals/ReviewModal.tsx`**
   - `handleSubmit()` 関数
   - `content` の長さ検証を追加

### 優先度: 中

3. **`app/lib/api/watchlist.ts`**
   - `addToWatchlist()` 関数
   - `updateWatchlistItem()` 関数
   - `memo` の長さ検証を追加

4. **名言（quotes）の保存処理**
   - 該当ファイルを特定
   - `quotes.text`, `quotes.character` の長さ検証を追加

---

## 💡 実装方針

### 1. バリデーション関数の作成

共通のバリデーション関数を作成することを推奨：

```typescript
// app/lib/api/validation.ts (新規作成)
export function validateLength(
  value: string | null | undefined,
  maxLength: number,
  fieldName: string
): void {
  if (value && value.length > maxLength) {
    throw new ValidationError(
      `${fieldName}は${maxLength}文字以内で入力してください（現在: ${value.length}文字）`
    );
  }
}
```

### 2. 各API関数での検証

既存の `ValidationError` クラスを使用してエラーハンドリング。

### 3. フロントエンド側での検証

- `maxLength` 属性の設定
- リアルタイムの文字数表示
- 送信前のバリデーション

---

## 🎯 次のステップ

1. ✅ 現状確認（完了）
2. ⏳ バリデーション関数の作成
3. ⏳ `profile.ts` に長さ検証を追加
4. ⏳ `ReviewModal.tsx` に長さ検証を追加
5. ⏳ `watchlist.ts` に長さ検証を追加
6. ⏳ 名言（quotes）の保存処理を確認・検証追加

---

**レビュー担当**: AI Assistant

