# パフォーマンス改善実施レポート（Step 1）

## 実施日
2025年1月7日

## 実施内容

### ✅ 1. Contextのvalueメモ化（確認済み）

**対象ファイル**:
- `app/contexts/AnimeDataContext.tsx`
- `app/contexts/ModalContext.tsx`
- `app/contexts/UserProfileContext.tsx`

**状態**: 既に実施済み
- すべてのContext Providerで`useMemo`を使用してvalueをメモ化
- 不要な再レンダリングを防止

### ✅ 2. useUserProfileの関数メモ化（確認済み）

**対象ファイル**: `app/hooks/useUserProfile.ts`

**状態**: 既に実施済み
- `setUserName`, `setUserIcon`, `setUserHandle`などの関数が`useCallback`でメモ化済み
- 関数参照が安定化され、不要な再レンダリングを防止

### ✅ 3. インライン関数のメモ化

#### 3.1 HomeTab.tsx

**改善内容**:
- タブ切り替えハンドラーを`useCallback`でメモ化
- アニメ選択ハンドラーを`useCallback`でメモ化

**変更箇所**:
```typescript
// 追加
const handleTabChange = useCallback((tabId: 'seasons' | 'series' | 'gallery' | 'watchlist' | 'current-season') => {
  setHomeSubTab(tabId);
}, [setHomeSubTab]);

const handleAnimeClick = useCallback((anime: Anime) => {
  setSelectedAnime(anime);
}, [setSelectedAnime]);

// 変更前
onClick={() => setHomeSubTab(tab.id as typeof homeSubTab)}
onClick={() => setSelectedAnime(anime)}

// 変更後
onClick={() => handleTabChange(tab.id as typeof homeSubTab)}
onClick={() => handleAnimeClick(anime)}
```

**効果**: タブ切り替えとアニメ選択時の再レンダリングを削減

#### 3.2 GalleryTab.tsx

**改善内容**:
- `ThumbnailCard`の`onClick`プロップの型を変更
- `(anime: Anime) => void`に変更し、親コンポーネントで直接`handleAnimeClick`を渡せるように

**変更箇所**:
```typescript
// ThumbnailCardのインターフェース変更
onClick?: (anime: Anime) => void;  // 変更前: onClick?: () => void;

// 呼び出し側
onClick={() => selectionMode ? onSelect(anime.id) : onClick?.(anime)}

// 親コンポーネント
<ThumbnailCard
  onClick={handleAnimeClick}  // 変更前: onClick={() => handleAnimeClick(anime)}
  // ...
/>
```

**効果**: インライン関数を排除し、`ThumbnailCard`の再レンダリングを削減

#### 3.3 WatchlistTab.tsx

**改善内容**:
- `WatchlistCard`のプロップ型を変更
- `onRemove`, `onMarkAsWatched`, `onToggleSelect`, `onCardClick`の型を変更し、親コンポーネントで直接関数を渡せるように

**変更箇所**:
```typescript
// WatchlistCardのインターフェース変更
onRemove: (anilistId: number) => void;  // 変更前: onRemove: () => void;
onMarkAsWatched: (item: WatchlistItem) => void;  // 変更前: onMarkAsWatched: () => void;
onToggleSelect?: (id: string) => void;  // 変更前: onToggleSelect?: () => void;
onCardClick?: (item: WatchlistItem) => void;  // 変更前: onCardClick?: () => void;

// 呼び出し側（WatchlistCard内）
const handleToggleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  e.stopPropagation();
  if (onToggleSelect) {
    onToggleSelect(item.id);
  }
};

// 親コンポーネント
<WatchlistCard
  onRemove={handleRemove}  // 変更前: onRemove={() => handleRemove(item.anilist_id)}
  onMarkAsWatched={handleMarkAsWatchedClick}  // 変更前: onMarkAsWatched={() => handleMarkAsWatchedClick(item)}
  onToggleSelect={toggleSelectItem}  // 変更前: onToggleSelect={() => toggleSelectItem(item.id)}
  onCardClick={handleCardClick}  // 変更前: onCardClick={() => handleCardClick(item)}
  // ...
/>
```

**効果**: インライン関数を排除し、`WatchlistCard`の再レンダリングを大幅に削減

## 期待される効果

### 再レンダリングの削減
- **Context購読コンポーネント**: 30-50%の再レンダリング削減（既に実施済み）
- **タブコンポーネント**: インライン関数の排除により、不要な再レンダリングを削減
- **カードコンポーネント**: リストアイテムの再レンダリングを削減

### パフォーマンス指標への影響
- **First Contentful Paint (FCP)**: 改善の可能性あり
- **Total Blocking Time (TBT)**: 再レンダリング削減により改善
- **Cumulative Layout Shift (CLS)**: 影響なし（レイアウト変更なし）

## 次のステップ

### Step 2: 追加の最適化

1. **計算処理のメモ化**
   - `CollectionSection.tsx`の`allQuotesList`と`filteredQuotes`を`useMemo`でメモ化

2. **コンポーネントのメモ化**
   - `YearHeader`, `SeasonHeader`, `ThumbnailCard`, `WatchlistCard`などを`React.memo`でメモ化（一部は既に実施済み）

3. **画像最適化の強化**
   - `next.config.ts`にquality、formats等の設定追加

4. **PageSpeed Insightsでの計測**
   - 改善前後のスコアを比較
   - 具体的な改善効果を確認

## 注意事項

- すべての変更は既存の機能を維持
- 型安全性を保持
- リンターエラーなし

## 参考

- `PERFORMANCE_CURRENT_STATUS.md` - 現状把握レポート
- `PERFORMANCE_ANALYSIS.md` - パフォーマンス分析レポート

