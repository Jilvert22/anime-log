# カスタムフック整理 - 事前確認レポート

## 確認1: useSocialの使用状況

### 検索結果
- `import.*useSocial` での検索: **0件**
- `useSocial` を含むファイル検索: 以下のみ検出
  - `app/hooks/useSocial.ts` (定義ファイル)
  - `app/components/HomeClient.tsx` (コメント内での言及のみ)
  - `CODE_REVIEW_SUMMARY.md`, `CODE_REVIEW_ISSUES.md` (過去のレビュー文書)

### 結論
**`useSocial`は完全に未使用です。** 実際にimportしているファイルは存在しません。

### Phase 5で移行対象だった理由
`CODE_REVIEW_SUMMARY.md`によると、過去に`app/page.tsx`で使用されていたが、現在は`app/components/HomeClient.tsx`でコメントアウトされ、ダミー値が定義されています（191-213行目）。

```191:213:app/components/HomeClient.tsx
  // SNS機能は現在無効化されています
  // 将来的に有効化する場合は、useSocialフックを使用してください
  const userSearchQuery = '';
  const setUserSearchQuery = () => {};
  const searchedUsers: UserProfile[] = [];
  const isSearchingUsers = false;
  const selectedUserProfile: UserProfile | null = null;
  const setSelectedUserProfile = () => {};
  const selectedUserAnimes: Anime[] = [];
  const setSelectedUserAnimes = () => {};
  const showUserProfileModal = false;
  const setShowUserProfileModal = (_value: boolean) => {};
  const userFollowStatus: { [key: string]: boolean } = {};
  const setUserFollowStatus = (_value: { [key: string]: boolean }) => {};
  const followCounts = { following: 0, followers: 0 };
  const setFollowCounts = (_value: { following: number; followers: number }) => {};
  const showFollowListModal = false;
  const setShowFollowListModal = (_value: boolean) => {};
  const followListType: 'following' | 'followers' = 'following';
  const setFollowListType = (_value: 'following' | 'followers') => {};
  const followListUsers: UserProfile[] = [];
  const setFollowListUsers = (_value: UserProfile[]) => {};
  const handleUserSearch = async () => {};
  const handleViewUserProfile = async () => {};
  const handleToggleFollow = async () => {};
```

### 推奨対応
- **即時削除**: 将来的な再実装の予定がない場合は削除
- **または**: 機能フラグで制御し、有効化可能にする

---

## 確認2: useFormStatesの使用箇所

### 使用箇所
**`app/components/HomeClient.tsx`のみ**で使用されています。

### 実際の使用状況

#### キャラクター関連の状態
```130:146:app/components/HomeClient.tsx
  const {
    newCharacterName,
    setNewCharacterName,
    newCharacterAnimeId,
    setNewCharacterAnimeId,
    newCharacterImage,
    setNewCharacterImage,
    newCharacterCategory,
    setNewCharacterCategory,
    newCharacterTags,
    setNewCharacterTags,
    newCustomTag,
    setNewCustomTag,
    editingCharacter,
    setEditingCharacter,
    characterFilter,
    setCharacterFilter,
```

- **`editingCharacter`**: `useModalHandlers`に渡される（178行目）、`AddCharacterModal`に渡される（588行目）、`CollectionSection`に`characterFilter`として渡される（454行目）
- **その他の状態**: `useModalHandlers`に渡されるが、**実際には使用されていない**

#### 名言関連の状態
```147:159:app/components/HomeClient.tsx
    editingQuote,
    setEditingQuote,
    newQuoteAnimeId,
    setNewQuoteAnimeId,
    newQuoteText,
    setNewQuoteText,
    newQuoteCharacter,
    setNewQuoteCharacter,
    quoteSearchQuery,
    setQuoteSearchQuery,
    quoteFilterType,
    setQuoteFilterType,
    selectedAnimeForFilter,
    setSelectedAnimeForFilter,
```

- **`editingQuote`**: `AddQuoteModal`に渡される（599行目）
- **`quoteSearchQuery`, `quoteFilterType`, `selectedAnimeForFilter`**: `CollectionSection`に渡される（456-460行目）
- **`newQuoteAnimeId`, `newQuoteText`, `newQuoteCharacter`**: **使用されていない**（各モーダル内で再定義されている）

#### 楽曲関連の状態
```161:166:app/components/HomeClient.tsx
    songType,
    setSongType,
    newSongTitle,
    setNewSongTitle,
    newSongArtist,
    setNewSongArtist,
```

- **`songType`, `newSongTitle`, `newSongArtist`**: `SongModal`の`initial`プロパティとして渡される（612-614行目）
- **実際の状態管理**: `SongModal`内で`useState`で再定義されている（34-36行目）

### 重要な発見

#### ❌ 状態の二重管理問題

1. **`AddCharacterModal`**: 
   - `useFormStates`から`editingCharacter`のみ受け取る
   - その他の状態（`newCharacterName`, `newCharacterAnimeId`など）は**モーダル内で独自に`useState`で管理**（20-25行目）

2. **`AddQuoteModal`**: 
   - `useFormStates`から`editingQuote`のみ受け取る
   - その他の状態（`newQuoteAnimeId`, `newQuoteText`, `newQuoteCharacter`）は**モーダル内で独自に`useState`で管理**（27-29行目）

3. **`SongModal`**: 
   - `useFormStates`から初期値（`initialSongType`, `initialSongTitle`, `initialSongArtist`）のみ受け取る
   - 実際の状態管理は**モーダル内で独自に`useState`で管理**（34-36行目）

### 結論
**`useFormStates`の大部分の状態が未使用です。** 各モーダルが独自に状態管理を行っているため、`useFormStates`で管理されている状態は：
- **使用されている**: `editingCharacter`, `characterFilter`, `editingQuote`, `quoteSearchQuery`, `quoteFilterType`, `selectedAnimeForFilter`
- **未使用/重複**: `newCharacterName`, `newCharacterAnimeId`, `newCharacterImage`, `newCharacterCategory`, `newCharacterTags`, `newCustomTag`, `newQuoteAnimeId`, `newQuoteText`, `newQuoteCharacter`, `songType`, `newSongTitle`, `newSongArtist`

### 改善提案
1. **モーダル内の状態管理を維持**: モーダルが自己完結型である方が適切
2. **`useFormStates`を削除**: 未使用の状態を削除し、必要な状態のみを残すか、別フックに分割
3. **代替案**: 
   - `useCharacterFilter.ts` (フィルター状態のみ)
   - `useQuoteFilter.ts` (フィルター状態のみ)
   - `useEditingStates.ts` (`editingCharacter`, `editingQuote`のみ)

---

## 確認3: useAnimeDataの依存関係

### 使用箇所
**`app/components/HomeClient.tsx`のみ**で使用されています。

### 使用されている機能

```116:124:app/components/HomeClient.tsx
  const {
    seasons,
    setSeasons,
    expandedSeasons: oldExpandedSeasons,
    setExpandedSeasons: setOldExpandedSeasons,
    allAnimes,
    averageRating,
    totalRewatchCount,
  } = useAnimeData(user, isLoading);
```

#### 1. データ読み込み機能
- **`seasons`, `setSeasons`**: ✅ 広く使用
  - `HomeTab`に渡される（418, 427行目）
  - `MyPageTab`に渡される（438, 462行目）
  - `AddAnimeFormModal`に渡される（485-486行目）
  - その他複数のモーダルで使用

#### 2. localStorage管理機能
- **使用状況**: ✅ 間接的に使用（`useAnimeData`内部で処理）
- **依存**: ユーザーがログインしていない場合に自動的にlocalStorageを使用

#### 3. 展開状態管理機能
- **`expandedSeasons` (リネーム後: `oldExpandedSeasons`)**: ⚠️ **問題あり**
  - `AddAnimeFormModal`に渡される（487行目）
  - **しかし、`HomeTab`には別の`expandedSeasons`（`HomeClient`内で定義）が渡される**（421行目）

**⚠️ 重大な問題**: `expandedSeasons`が2つ存在しています
1. `HomeClient.tsx`内で直接定義（49行目）: `HomeTab`に使用
2. `useAnimeData`から取得（`oldExpandedSeasons`）: `AddAnimeFormModal`に使用

これは状態の不整合を引き起こす可能性があります。

#### 4. 統計計算機能
- **`allAnimes`**: ✅ 広く使用
  - `HomeTab`に渡される（425行目）
  - `MyPageTab`に渡される（437行目）
  - `useCountAnimation`の入力として使用（127行目）
  - その他複数箇所で使用

- **`averageRating`**: ✅ 使用
  - `HomeTab`に渡される（417行目）
  - `MyPageTab`に渡される（451行目）
  - `DNAModal`に渡される（623行目）

- **`totalRewatchCount`**: ✅ 使用
  - `HomeTab`に渡される（416行目）
  - `DNAModal`に渡される（624行目）

### 使用状況まとめ

| 機能 | 返り値 | 使用箇所 | 使用頻度 |
|------|--------|----------|----------|
| データ読み込み | `seasons`, `setSeasons` | `HomeTab`, `MyPageTab`, `AddAnimeFormModal`, その他モーダル | ⭐⭐⭐⭐⭐ |
| localStorage管理 | (内部処理) | 未ログイン時の自動処理 | ⭐⭐⭐ |
| 展開状態管理 | `expandedSeasons`, `setExpandedSeasons` | `AddAnimeFormModal`のみ | ⭐⭐ (問題あり) |
| 統計計算 | `allAnimes` | 多数のコンポーネント | ⭐⭐⭐⭐⭐ |
| 統計計算 | `averageRating` | `HomeTab`, `MyPageTab`, `DNAModal` | ⭐⭐⭐ |
| 統計計算 | `totalRewatchCount` | `HomeTab`, `DNAModal` | ⭐⭐⭐ |

### 問題点

1. **`expandedSeasons`の二重管理**
   - `useAnimeData`内で管理されているが、`HomeTab`では別の状態を使用
   - 状態の同期が取れていない可能性

2. **責務の混在**
   - データ読み込み、localStorage管理、展開状態管理、統計計算が1つのフックに混在
   - テストや再利用が困難

### 改善提案

#### 分割案1: 機能別に分割
```
useAnimeDataLoader.ts (データ読み込みのみ)
useSeasonExpansion.ts (展開状態管理)
useAnimeStatistics.ts (統計計算)
```

#### 分割案2: `expandedSeasons`の統合
- `HomeClient`内の`expandedSeasons`を削除
- `useAnimeData`の`expandedSeasons`を統一して使用
- または、展開状態を`useAnimeData`から分離し、`HomeClient`で統一管理

---

## 確認結果サマリー

### ✅ 確認完了項目

1. **`useSocial`**: 完全に未使用、削除または機能フラグ制御を推奨
2. **`useFormStates`**: 大部分が未使用、状態の二重管理問題あり
3. **`useAnimeData`**: すべての機能が使用されているが、`expandedSeasons`の二重管理問題あり

### 🎯 Step 1（useFormStatesの分割）への準備

**推奨分割方針:**
1. **未使用状態の削除**: `newCharacterName`, `newCharacterAnimeId`, `newCharacterImage`, `newCharacterCategory`, `newCharacterTags`, `newCustomTag`, `newQuoteAnimeId`, `newQuoteText`, `newQuoteCharacter`, `songType`, `newSongTitle`, `newSongArtist`を削除
2. **必要な状態のみを残す**: 
   - `editingCharacter`, `characterFilter` → `useCharacterState.ts`
   - `editingQuote`, `quoteSearchQuery`, `quoteFilterType`, `selectedAnimeForFilter` → `useQuoteState.ts`
3. **各モーダルの状態管理を維持**: モーダル内の`useState`はそのまま維持（自己完結型）

---

## 次のステップ

Step 1（useFormStatesの分割）に進みますか？

