# カスタムフックの整理 - 現状調査レポート

## 既存フック一覧

| ファイル | 行数 | 責務 | 依存関係 | 使用箇所 | 問題点 |
|----------|------|------|----------|----------|--------|
| `useAnimeData.ts` | 139 | アニメデータの読み込み（Supabase/localStorage）、シーズン管理、展開状態管理、統計計算（平均評価、累計周回数） | `useAuth`, `supabase`, `helpers` | `HomeClient.tsx` | 責務過多、複数の責務が混在 |
| `useAnimeReviews.ts` | 129 | レビューの読み込み、フィルター・ソート状態管理、ネタバレ管理 | `supabase`, `user` | `HomeClient.tsx` | 問題なし |
| `useAuth.ts` | 63 | 認証状態管理、セッション管理、ログアウト処理 | `supabase`, `api/auth` | `HomeClient.tsx`, `SettingsSection.tsx`, `useStorage.ts` | 問題なし |
| `useCollection.ts` | 59 | 推しキャラクターのlocalStorage管理 | なし（直接localStorage使用） | `HomeClient.tsx` | 責務は単純だが、`useStorage`との統合を検討すべき |
| `useCountAnimation.ts` | 30 | 数値のアニメーション | なし | `HomeClient.tsx` | 問題なし |
| `useDarkMode.ts` | 30 | ダークモード状態管理、localStorage同期、DOM操作 | なし | `HomeClient.tsx` | 問題なし |
| `useFormStates.ts` | 73 | 複数フォームの状態管理（キャラクター、名言、楽曲） | なし | `HomeClient.tsx` | 責務の分離不十分、複数のフォーム状態を1つにまとめている |
| `useModalHandlers.ts` | 108 | キャラクターモーダル関連のハンドラー | `useFormStates`の一部状態 | `HomeClient.tsx` | 責務は明確だが、他のモーダルハンドラーも統合できる可能性 |
| `useModals.ts` | 40 | モーダル表示状態の管理 | なし | `HomeClient.tsx` | 問題なし |
| `useSocial.ts` | 178 | ユーザー検索、フォロー/フォロワー管理、プロフィール表示 | `api/social`, `api/profile` | **未使用（コメントアウト）** | 実装されているが使用されていない |
| `useStorage.ts` | 21 | ストレージサービスの取得（localStorage/Supabase切り替え） | `useAuth` | `HomeClient.tsx`, `WatchlistTab.tsx`, `HomeTab.tsx`, `SeasonWatchlistTab.tsx`, `SeasonEndModal.tsx` | 問題なし |
| `useTabs.ts` | 16 | タブ状態管理 | なし | `HomeClient.tsx` | 問題なし |
| `useUserProfile.ts` | 290 | プロフィール読み込み、保存、アバターアップロード、オタクタイプ管理、favoriteAnimeIds管理、localStorageキャッシュ | `supabase`, `api/profile`, `onAuthStateChange` | `HomeClient.tsx` | 責務過多、複数の機能が混在（プロフィール、アバター、favoriteAnimeIds） |

## 発見した問題点

### 1. 責務過多のフック

#### `useAnimeData` (139行)
- **問題**: データ読み込み、localStorage管理、展開状態管理、統計計算が1つのフックに混在
- **影響**: 保守性が低い、テストが困難、再利用性が低い

#### `useUserProfile` (290行)
- **問題**: プロフィール管理、アバター管理、favoriteAnimeIds管理、localStorageキャッシュが混在
- **影響**: 非常に長く、複数の責務を持つため保守が困難
- **具体的な問題**:
  - プロフィール読み込み/保存
  - アバターアップロード
  - favoriteAnimeIds管理（プロフィールとは独立）
  - localStorageキャッシュ管理
  - 後方互換性のための複数のエイリアス

#### `useFormStates` (73行)
- **問題**: キャラクター、名言、楽曲のフォーム状態を1つにまとめている
- **影響**: 関連性の低い状態が混在、不要な再レンダリングの可能性

### 2. 使用されていないフック

#### `useSocial` (178行)
- **問題**: 実装されているが、`HomeClient.tsx`でコメントアウトされ使用されていない
- **影響**: デッドコード、メンテナンス負荷
- **現状**: `HomeClient.tsx`で空のダミー値が定義されている（191-213行目）

### 3. コンポーネント内のインライン状態管理

#### `HomeClient.tsx`
- **問題**: 多数の`useCallback`がインラインで定義されている
- **具体的な箇所**:
  - `handleLogout` (231行目)
  - `handleOpenAddForm` (236行目)
  - `handleCloseAddForm` (240行目)
  - `handleCloseReviewModal` (244行目)
  - `handleCloseSettings` (248行目)
  - `handleCloseFavoriteAnimeModal` (252行目)
  - `handleCloseUserProfileModal` (256行目)
  - `handleCloseFollowListModal` (260行目)
  - `handleCloseAuthModal` (264行目)
  - `handleCloseAddQuoteModal` (268行目)
  - `handleCloseSongModal` (273行目)
  - `handleCloseDNAModal` (281行目)
  - `handleOpenAddQuoteModal` (285行目)
  - `handleEditQuote` (293行目)
  - `handleSaveAddQuoteModal` (304行目)
  - `handleReviewPosted` (309行目)
  - `handleMoveToBacklog` (316行目)
  - `handleDeletePreviousSeason` (337行目)
  - `handleKeepPreviousSeason` (354行目)
- **その他の状態**:
  - `selectedAnime`, `expandedYears`, `expandedSeasons` (47-50行目)
  - `showSeasonEndModal`, `previousSeasonItems` (50-51行目)
  - `useEffect`によるシーズン開始チェック (362-386行目)

#### `SettingsModal.tsx`
- **問題**: フォーム状態がコンポーネント内で直接管理されている
- **具体的な箇所**:
  - `username`, `handle`, `bio`, `isPublic`, `avatarFile`, `avatarPreview` (46-50行目)
  - `otakuMode`, `selectedPreset`, `customType` (54-55行目)
  - `saving` (58行目)

#### `HomeTab.tsx`
- **問題**: 複雑な状態管理ロジックがコンポーネント内にある
- **影響**: ファイルが大きすぎる（約1500行以上）

### 4. 重複ロジックの可能性

#### localStorage管理
- `useCollection`: 直接localStorageを使用
- `useAnimeData`: 直接localStorageを使用（未ログイン時）
- `useUserProfile`: 直接localStorageを使用（キャッシュ用）
- `useDarkMode`: 直接localStorageを使用
- **問題**: `useStorage`フックが存在するが、統一されていない

### 5. 型安全性

- **問題なし**: `any`型の使用は見つからなかった
- **改善の余地**: 一部の型定義が複雑（`useModalHandlers`のProps型など）

### 6. エラーハンドリング

- **現状**: 各フックで`console.error`を使用
- **問題**: 統一されたエラーハンドリング戦略がない
- **影響**: エラー処理が一貫していない

### 7. 再レンダリングの最適化

#### `useFormStates`
- **問題**: 1つのフックで複数のフォーム状態を管理しているため、1つの状態変更で全体が再レンダリングされる可能性
- **改善**: 個別のフックに分割

#### `useUserProfile`
- **問題**: 後方互換性のため多くの値を返している（263-287行目）
- **影響**: 不要な再レンダリングの可能性

## 改善提案

### 1. 責務の分離

#### `useAnimeData` の分割
```
useAnimeData.ts (データ読み込みのみ)
  → useAnimeDataLoader.ts
  → useAnimeStatistics.ts (統計計算)
  → useSeasonExpansion.ts (展開状態管理)
```

#### `useUserProfile` の分割
```
useUserProfile.ts (プロフィール基本情報のみ)
  → useAvatar.ts (アバター管理)
  → useFavoriteAnimeIds.ts (お気に入りアニメ管理)
```

#### `useFormStates` の分割
```
useFormStates.ts
  → useCharacterForm.ts
  → useQuoteForm.ts
  → useSongForm.ts
```

### 2. 未使用フックの対応

- **オプション1**: `useSocial`を削除（将来的に再実装する可能性がある場合は残す）
- **オプション2**: `useSocial`を有効化する計画があるか確認し、ない場合は削除

### 3. コンポーネント内ロジックのフック化

#### `HomeClient.tsx`のリファクタリング
```
useModalHandlers.ts の拡張
  → useHomeModalHandlers.ts (すべてのモーダルハンドラーを統合)
  → useSeasonEndHandlers.ts (シーズン終了関連のハンドラー)
```

#### `SettingsModal.tsx`のリファクタリング
```
useSettingsForm.ts (設定フォーム状態管理)
```

### 4. localStorage管理の統一

- すべてのlocalStorage操作を`useStorage`経由に統一
- `useCollection`, `useDarkMode`なども`useStorage`を使用するように変更

### 5. エラーハンドリングの統一

- 共通のエラーハンドリングフックを作成: `useErrorHandler.ts`
- または、エラー状態を返すパターンを統一

### 6. 再レンダリングの最適化

- `useFormStates`を分割して、必要な部分のみを購読できるようにする
- `useUserProfile`の後方互換性APIを見直し、必要最小限の値のみ返すようにする

### 7. 命名の一貫性

- **問題なし**: すべてのフックが`use`で始まっている
- **改善提案**: より具体的な命名を検討（例: `useModals` → `useModalStates`）

### 8. 依存関係の整理

- `useStorage`が`useAuth`に依存しているのは適切
- 循環依存がないか確認（現状は問題なし）

## 優先度別改善タスク

### 高優先度
1. ✅ `useFormStates`の分割（再レンダリング問題）
2. ✅ `useAnimeData`の分割（責務過多）
3. ✅ `HomeClient.tsx`のモーダルハンドラー統合

### 中優先度
4. ✅ `useUserProfile`の分割（長すぎる）
5. ✅ localStorage管理の統一
6. ✅ `useSocial`の削除または有効化判断

### 低優先度
7. ✅ エラーハンドリングの統一
8. ✅ 命名の見直し
9. ✅ `HomeTab.tsx`のリファクタリング（別タスクとして）

## 補足情報

### フックの使用状況まとめ

| フック | 使用箇所数 | 主な使用場所 |
|--------|-----------|-------------|
| `useAnimeData` | 1 | `HomeClient.tsx` |
| `useAnimeReviews` | 1 | `HomeClient.tsx` |
| `useAuth` | 3 | `HomeClient.tsx`, `SettingsSection.tsx`, `useStorage.ts` |
| `useCollection` | 1 | `HomeClient.tsx` |
| `useCountAnimation` | 1 | `HomeClient.tsx` |
| `useDarkMode` | 1 | `HomeClient.tsx` |
| `useFormStates` | 1 | `HomeClient.tsx` |
| `useModalHandlers` | 1 | `HomeClient.tsx` |
| `useModals` | 1 | `HomeClient.tsx` |
| `useSocial` | 0 | **未使用** |
| `useStorage` | 5 | `HomeClient.tsx`, `WatchlistTab.tsx`, `HomeTab.tsx`, `SeasonWatchlistTab.tsx`, `SeasonEndModal.tsx` |
| `useTabs` | 1 | `HomeClient.tsx` |
| `useUserProfile` | 1 | `HomeClient.tsx` |

### コンポーネントサイズ

- `HomeClient.tsx`: 約640行（多数の状態とハンドラー）
- `HomeTab.tsx`: 約1500行以上（分割が必要）
- `useUserProfile.ts`: 290行（長すぎる）

