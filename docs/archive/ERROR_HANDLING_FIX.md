# バリデーションエラーメッセージ表示の修正

**修正日**: 2025年
**問題**: プロフィール保存時のバリデーションエラーメッセージが正しく表示されない

---

## 🔍 問題の原因

### 問題の流れ

1. **`upsertUserProfile`関数** (`app/lib/api/profile.ts`)
   - バリデーションエラーが発生すると`ValidationError`をスロー
   - `catch`ブロックで`normalizeError(error)`が呼ばれる
   - `normalizeError`関数は`ApiError`のインスタンスをそのまま返すため、`ValidationError`は正しく保持される

2. **`saveProfile`関数** (`app/hooks/useProfile.ts`)
   - `upsertUserProfile`が`ValidationError`をスロー
   - `catch`ブロックでエラーをキャッチ
   - **問題**: エラーメッセージを取得せず、常に`'Unknown error'`を返していた

3. **`SettingsModal.tsx`**
   - `saveProfile`の戻り値の`error`プロパティを`alert`で表示
   - しかし、常に`'Unknown error'`が表示されていた

---

## ✅ 修正内容

### 修正ファイル: `app/hooks/useProfile.ts`

#### 変更前:
```typescript
} catch (err) {
  console.error('Profile save error:', err);
  return { success: false, error: 'Unknown error' };
}
```

#### 変更後:
```typescript
import { ApiError } from '../lib/api/errors';

// ...

} catch (err) {
  console.error('Profile save error:', err);
  
  // エラーメッセージを取得
  let errorMessage = 'プロフィールの保存に失敗しました';
  if (err instanceof ApiError) {
    errorMessage = err.message;
  } else if (err instanceof Error) {
    errorMessage = err.message;
  }
  
  return { success: false, error: errorMessage };
}
```

---

## 📋 修正の詳細

1. **`ApiError`のインポート追加**
   - エラーの型チェックのために`ApiError`をインポート

2. **エラーメッセージの取得ロジック**
   - `err instanceof ApiError`: `ValidationError`などの`ApiError`のサブクラスの場合、`err.message`を取得
   - `err instanceof Error`: その他の`Error`インスタンスの場合、`err.message`を取得
   - それ以外の場合: デフォルトメッセージを使用

---

## 🎯 効果

- ✅ バリデーションエラーメッセージ（例: 「ユーザー名は30文字以内で入力してください」）が正しくユーザーに表示される
- ✅ その他の`ApiError`サブクラス（`SupabaseError`など）のメッセージも正しく表示される
- ✅ エラーハンドリングが一貫性を持つ

---

## 🧪 テスト項目

1. **ユーザー名が30文字を超える場合**
   - エラーメッセージが正しく表示されること

2. **bioが500文字を超える場合**
   - エラーメッセージが正しく表示されること

3. **ハンドルに無効な文字を含む場合**
   - エラーメッセージが正しく表示されること

4. **その他のバリデーションエラー**
   - 適切なエラーメッセージが表示されること

---

**修正担当**: AI Assistant

