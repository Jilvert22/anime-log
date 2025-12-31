# Step 4: localStorage管理の確認と統一 - 分析レポート

## Phase 1: 現状調査

### useStorageの機能

`useStorage`は**watchlist管理専用**のストレージサービスです。

**提供機能:**
- `getWatchlist()`: watchlistの取得
- `addToWatchlist()`: watchlistへの追加
- `removeFromWatchlist()`: watchlistからの削除
- `updateWatchlistItem()`: watchlistアイテムの更新
- `getSeasonWatchlist()`: シーズン別watchlistの取得
- その他watchlist関連の操作

**実装:**
- ログイン時: `SupabaseStorageService`を使用（Supabaseに保存）
- 未ログイン時: `LocalStorageService`を使用（localStorageに保存）
- 自動的に適切なサービスを選択

**SSR対応:**
- `LocalStorageService`内で`typeof window !== 'undefined'`チェックあり
- エラーハンドリングあり

---

### 直接localStorage使用箇所

#### 1. **useAnimeData.ts**
- **キー**: `animeSeasons`
- **用途**: アニメデータの保存（未ログイン時のみ）
- **使用箇所**: 
  - `localStorage.getItem('animeSeasons')` (73行目)
  - `localStorage.setItem('animeSeasons', ...)` (26行目)
- **SSR対応**: ❌ なし（ただし、useEffect内で使用されているため実質的に問題なし）
- **エラーハンドリング**: ✅ try-catchあり

#### 2. **useCollection.ts**
- **キー**: `favoriteCharacters`
- **用途**: 推しキャラクターの保存
- **使用箇所**:
  - `localStorage.getItem('favoriteCharacters')` (9行目 - ヘルパー関数経由)
  - `localStorage.setItem('favoriteCharacters', ...)` (21行目 - ヘルパー関数経由)
- **SSR対応**: ❌ なし（ただし、useEffect内で使用されているため実質的に問題なし）
- **エラーハンドリング**: ✅ try-catchあり（ヘルパー関数内）

#### 3. **useDarkMode.ts**
- **キー**: `darkMode`
- **用途**: ダークモード設定の保存
- **使用箇所**:
  - `localStorage.getItem('darkMode')` (11行目)
  - `localStorage.setItem('darkMode', ...)` (24行目)
- **SSR対応**: ✅ `typeof window !== 'undefined'`チェックあり
- **エラーハンドリング**: ❌ なし

#### 4. **useUserProfile.ts**
- **キー**: `userProfile`, `favoriteAnimeIds`, `userIcon`, `userOtakuType`
- **用途**: 
  - `userProfile`: プロフィール情報のキャッシュ
  - `favoriteAnimeIds`: お気に入りアニメIDの保存
  - `userIcon`: 後方互換性のためのユーザーアイコン
  - `userOtakuType`: 後方互換性のためのオタクタイプ
- **使用箇所**:
  - `localStorage.getItem('userProfile')` (75行目)
  - `localStorage.setItem('userProfile', ...)` (48, 68, 185行目)
  - `localStorage.getItem('favoriteAnimeIds')` (223行目)
  - `localStorage.setItem('favoriteAnimeIds', ...)` (237行目)
  - `localStorage.getItem('userIcon')` (244行目)
  - `localStorage.setItem('userOtakuType', ...)` (282行目)
- **SSR対応**: ✅ 244行目のみ`typeof window !== 'undefined'`チェックあり、他は❌
- **エラーハンドリング**: ✅ try-catchあり（一部）

#### 5. **helpers.ts**
- **キー**: `lastSeasonCheck` (SEASON_CHECK_KEY)
- **用途**: シーズン開始時のモーダル表示チェック
- **使用箇所**:
  - `localStorage.getItem(SEASON_CHECK_KEY)` (159行目)
  - `localStorage.setItem(SEASON_CHECK_KEY, ...)` (171行目)
- **SSR対応**: ✅ `typeof window === 'undefined'`チェックあり
- **エラーハンドリング**: ❌ なし

#### 6. **HomeTab.tsx**
- **キー**: `dismissedAnimeSuggestions`
- **用途**: アニメ提案の非表示設定
- **使用箇所**:
  - `localStorage.getItem('dismissedAnimeSuggestions')` (981行目)
  - `localStorage.setItem('dismissedAnimeSuggestions', ...)` (1144行目)
- **SSR対応**: ❌ なし（ただし、useEffect内で使用されているため実質的に問題なし）
- **エラーハンドリング**: ✅ try-catchあり

#### 7. **FavoriteAnimeModal.tsx**
- **キー**: `favoriteAnimeIds`
- **用途**: お気に入りアニメIDの保存（useUserProfileと共有）
- **使用箇所**:
  - `localStorage.setItem('favoriteAnimeIds', ...)` (24行目)
- **SSR対応**: ❌ なし
- **エラーハンドリング**: ❌ なし

#### 8. **AnimeDNASection.tsx**
- **キー**: `favoriteAnimeIds`
- **用途**: お気に入りアニメIDの削除（useUserProfileと共有）
- **使用箇所**:
  - `localStorage.setItem('favoriteAnimeIds', ...)` (334行目)
- **SSR対応**: ❌ なし
- **エラーハンドリング**: ❌ なし

#### 9. **HomeClient.tsx**
- **キー**: `userOtakuType`
- **用途**: 後方互換性のためのオタクタイプ保存
- **使用箇所**:
  - `localStorage.setItem('userOtakuType', ...)` (435行目)
- **SSR対応**: ✅ `typeof window !== 'undefined'`チェックあり
- **エラーハンドリング**: ❌ なし

---

## Phase 2: 統一の判断

### 統一すべきケース

#### ❌ **統一不要**

**理由:**

1. **用途が明確に分かれている**
   - `useStorage`: watchlist管理専用
   - その他: 各種設定・キャッシュ・一時データ

2. **キーの重複は限定的**
   - `favoriteAnimeIds`: `useUserProfile`と`FavoriteAnimeModal`、`AnimeDNASection`で共有（これは既存の問題だが、統一しても`useStorage`経由ではない）
   - 他のキーは各フック/コンポーネントで独立して使用

3. **SSR対応の問題は軽微**
   - ほとんどの使用箇所が`useEffect`内で使用されており、実質的にSSRでの問題は発生しない
   - `useDarkMode`、`helpers.ts`、`HomeClient.tsx`は適切にSSR対応されている

4. **エラーハンドリングの不足は限定的**
   - 大部分で適切にエラーハンドリングされている
   - `useDarkMode`と`helpers.ts`で不足しているが、単純な値の保存のため問題にならない可能性が高い

### 改善提案（任意）

#### 1. **エラーハンドリングの統一**

以下の箇所でエラーハンドリングを追加することを推奨：

- `useDarkMode.ts`: localStorage操作時のtry-catch追加
- `helpers.ts`: localStorage操作時のtry-catch追加
- `FavoriteAnimeModal.tsx`: localStorage操作時のtry-catch追加
- `AnimeDNASection.tsx`: localStorage操作時のtry-catch追加

#### 2. **SSR対応の統一**

`useAnimeData`と`useCollection`でSSRチェックを追加（ただし、`useEffect`内で使用されているため実質的な問題はない）。

#### 3. **favoriteAnimeIdsの管理統一**

`favoriteAnimeIds`が複数箇所で直接操作されているため、`useUserProfile`フックに統一することを推奨。

---

## Phase 3: 統一作業

**結論: 統一作業は不要**

現状のままで問題ありません。ただし、上記の改善提案は任意で実施可能です。

---

## 最終報告

```
useStorageの機能: watchlist管理専用（ログイン/未ログインで自動切り替え）

直接localStorage使用箇所: 9ファイル
  - useAnimeData.ts: animeSeasons（アニメデータ保存）
  - useCollection.ts: favoriteCharacters（推しキャラ保存）
  - useDarkMode.ts: darkMode（ダークモード設定）
  - useUserProfile.ts: userProfile, favoriteAnimeIds, userIcon, userOtakuType（プロフィール・お気に入り）
  - helpers.ts: lastSeasonCheck（シーズン開始チェック）
  - HomeTab.tsx: dismissedAnimeSuggestions（提案非表示設定）
  - FavoriteAnimeModal.tsx: favoriteAnimeIds（お気に入り保存）
  - AnimeDNASection.tsx: favoriteAnimeIds（お気に入り削除）
  - HomeClient.tsx: userOtakuType（後方互換性）

統一の必要性: なし
理由: 
  1. useStorageはwatchlist専用で、他は異なる用途
  2. 各キーは用途が明確に分かれている
  3. SSR対応は実質的に問題なし（useEffect内で使用）
  4. エラーハンドリングは大部分で適切
```

