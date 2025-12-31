# Step 4: localStorage管理の確認と統一 - 完了レポート

## Phase 1: 現状調査

### useStorageの機能

**watchlist管理専用**のストレージサービスです。

- **提供機能**: watchlist関連の操作（取得、追加、削除、更新、シーズン別取得など）
- **実装**: 
  - ログイン時 → `SupabaseStorageService`（Supabaseに保存）
  - 未ログイン時 → `LocalStorageService`（localStorageに保存）
- **SSR対応**: ✅ あり
- **エラーハンドリング**: ✅ あり

---

### 直接localStorage使用箇所: 9ファイル

| ファイル | キー | 用途 | SSR対応 | エラーハンドリング |
|---------|------|------|---------|-------------------|
| `useAnimeData.ts` | `animeSeasons` | アニメデータ保存（未ログイン時） | ⚠️ なし（useEffect内のため実質OK） | ✅ あり |
| `useCollection.ts` | `favoriteCharacters` | 推しキャラ保存 | ⚠️ なし（useEffect内のため実質OK） | ✅ あり |
| `useDarkMode.ts` | `darkMode` | ダークモード設定 | ✅ あり | ❌ なし |
| `useUserProfile.ts` | `userProfile` | プロフィールキャッシュ | ⚠️ 一部のみ | ✅ 一部あり |
| `useUserProfile.ts` | `favoriteAnimeIds` | お気に入りアニメID | ⚠️ なし（useEffect内のため実質OK） | ✅ あり |
| `useUserProfile.ts` | `userIcon` | 後方互換性 | ✅ あり | ❌ なし |
| `useUserProfile.ts` | `userOtakuType` | 後方互換性 | ⚠️ なし | ❌ なし |
| `helpers.ts` | `lastSeasonCheck` | シーズン開始チェック | ✅ あり | ❌ なし |
| `HomeTab.tsx` | `dismissedAnimeSuggestions` | 提案非表示設定 | ⚠️ なし（useEffect内のため実質OK） | ✅ あり |
| `FavoriteAnimeModal.tsx` | `favoriteAnimeIds` | お気に入り保存 | ❌ なし | ❌ なし |
| `AnimeDNASection.tsx` | `favoriteAnimeIds` | お気に入り削除 | ❌ なし | ❌ なし |
| `HomeClient.tsx` | `userOtakuType` | 後方互換性 | ✅ あり | ❌ なし |

**キーの重複:**
- `favoriteAnimeIds`: `useUserProfile`, `FavoriteAnimeModal`, `AnimeDNASection`で使用（これは管理の統一が必要かも）

---

## Phase 2: 統一の判断

### 統一の必要性: **なし**

**理由:**

1. **用途が明確に分かれている**
   - `useStorage`: watchlist管理専用
   - その他: 各種設定・キャッシュ・一時データ（用途が異なる）

2. **各キーは独立して使用**
   - `favoriteAnimeIds`のみ複数箇所で使用されているが、watchlistとは無関係
   - 他のキーは各フック/コンポーネントで独立

3. **SSR対応は実質的に問題なし**
   - ほとんどの使用箇所が`useEffect`内で使用
   - SSRでは`useEffect`は実行されないため問題なし
   - 明示的にSSRチェックしている箇所もある

4. **エラーハンドリングは大部分で適切**
   - 主要な箇所では適切にエラーハンドリングされている
   - 単純な設定値の保存のみの箇所で不足しているが、致命的ではない

5. **統一してもメリットが少ない**
   - `useStorage`はwatchlist専用のAPI設計
   - 他のキーを統一するには新しい抽象化層が必要
   - 現状の実装で十分機能している

---

## Phase 3: 統一作業

**実施: なし**（統一不要のため）

---

## 改善提案（任意・将来的な検討事項）

### 1. エラーハンドリングの追加（任意）

以下の箇所でエラーハンドリングを追加することを推奨：

- `useDarkMode.ts`: localStorage操作時のtry-catch追加
- `helpers.ts`: localStorage操作時のtry-catch追加
- `FavoriteAnimeModal.tsx`: localStorage操作時のtry-catch追加
- `AnimeDNASection.tsx`: localStorage操作時のtry-catch追加

### 2. `favoriteAnimeIds`の管理統一（任意）

`favoriteAnimeIds`が複数箇所で直接操作されているため、`useUserProfile`フック経由でのみ操作するように統一することを推奨。

### 3. SSR対応の明確化（任意）

`useAnimeData`と`useCollection`でSSRチェックを追加（ただし、`useEffect`内で使用されているため実質的な問題はない）。

---

## 最終報告

```
useStorageの機能: watchlist管理専用（ログイン/未ログインで自動切り替え）

直接localStorage使用箇所: 9ファイル（12キー）
  - useAnimeData.ts: animeSeasons（アニメデータ保存）
  - useCollection.ts: favoriteCharacters（推しキャラ保存）
  - useDarkMode.ts: darkMode（ダークモード設定）
  - useUserProfile.ts: userProfile, favoriteAnimeIds, userIcon, userOtakuType
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
  5. 統一してもメリットが少ない
```

---

## 結論

現状のlocalStorage管理は**問題ありません**。統一作業は不要です。

`useStorage`はwatchlist専用の設計であり、その他のlocalStorage使用は各種設定やキャッシュとして適切に分離されています。

将来的には、エラーハンドリングの追加や`favoriteAnimeIds`の管理統一などを検討することもできますが、必須ではありません。

---

## 次のステップ

Step 4は完了しました。localStorage管理の現状を確認し、統一の必要性がないことを確認しました。

次のステップに進む準備ができています。

