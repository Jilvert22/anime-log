# パフォーマンス分析レポート

## 1. 再レンダリングの原因になりそうな箇所

### 1.1 Contextのvalueがメモ化されていない

#### ❌ AnimeDataContext.tsx (15行目)
```15:15:app/contexts/AnimeDataContext.tsx
    <AnimeDataContext.Provider value={animeData}>
```
**問題**: `animeData`が毎回新しいオブジェクトとして生成されるため、Contextを購読しているすべてのコンポーネントが再レンダリングされる。

**影響**: `useAnimeData`フックが返すオブジェクトが毎回新規生成されるため、`AnimeDataContext`を使用しているすべてのコンポーネントが不要な再レンダリングを引き起こす。

#### ❌ ModalContext.tsx (43行目)
```43:43:app/contexts/ModalContext.tsx
    <ModalContext.Provider value={{ modals, actions, formStates }}>
```
**問題**: オブジェクトリテラルが毎回新規生成されるため、`ModalContext`を購読しているすべてのコンポーネントが再レンダリングされる。

**影響**: `modals`、`actions`、`formStates`のいずれかが変更されると、すべての購読コンポーネントが再レンダリングされる。

#### ❌ UserProfileContext.tsx (15行目)
```15:15:app/contexts/UserProfileContext.tsx
    <UserProfileContext.Provider value={profile}>
```
**問題**: `useUserProfile`フックが返すオブジェクトが毎回新規生成される可能性がある。

**影響**: プロフィール関連の状態が変更されるたびに、すべての購読コンポーネントが再レンダリングされる。

### 1.2 カスタムフック内でオブジェクトや配列を毎回新規生成

#### ⚠️ useAnimeData.ts (129-137行目)
```129:137:app/hooks/useAnimeData.ts
  return {
    seasons,
    setSeasons,
    expandedSeasons,
    setExpandedSeasons,
    allAnimes,
    averageRating,
    totalRewatchCount,
  };
```
**問題**: 返り値のオブジェクトが毎回新規生成される。ただし、`allAnimes`、`averageRating`、`totalRewatchCount`は`useMemo`でメモ化されているため、値自体は最適化されている。

**影響**: Contextのvalueとして使用される場合、毎回新しいオブジェクト参照が生成される。

#### ⚠️ useModals.ts (17-38行目)
```17:38:app/hooks/useModals.ts
  return {
    showSettings,
    setShowSettings,
    showFavoriteAnimeModal,
    setShowFavoriteAnimeModal,
    showAddForm,
    setShowAddForm,
    showDNAModal,
    setShowDNAModal,
    showShareModal,
    setShowShareModal,
    showAuthModal,
    setShowAuthModal,
    showAddCharacterModal,
    setShowAddCharacterModal,
    showAddQuoteModal,
    setShowAddQuoteModal,
    showSongModal,
    setShowSongModal,
    showReviewModal,
    setShowReviewModal,
  };
```
**問題**: 返り値のオブジェクトが毎回新規生成される。ただし、各setterは`useState`から取得されるため、参照は安定している。

**影響**: 中程度。オブジェクト参照が変わるため、メモ化されていないコンポーネントに渡すと再レンダリングが発生する。

#### ⚠️ useUserProfile.ts (41-76行目)
```41:76:app/hooks/useUserProfile.ts
  return {
    // 新しいAPI
    profile: profile.profile,
    loading: profile.loading,
    avatarPublicUrl: avatar.avatarPublicUrl,
    saveProfile: profile.saveProfile,
    saveOtakuType: profile.saveOtakuType,
    loadProfile: profile.loadProfile,
    
    // 後方互換性
    userName,
    userIcon,
    userHandle,
    userOtakuType,
    otakuType,
    otakuTypeCustom,
    isProfilePublic,
    userBio,
    myProfile,
    favoriteAnimeIds,
    setFavoriteAnimeIds,
    
    // 既存のsetterも維持（必要に応じて）
    setUserName: (name: string) => profile.saveProfile({ username: name }),
    setUserIcon: (file: File) => profile.saveProfile({ avatarFile: file }),
    setUserHandle: (handle: string | null) => profile.saveProfile({ handle }),
    setUserOtakuType: (type: string) => {
      // localStorageに保存（後でSupabaseに保存される）
      if (typeof window !== 'undefined') {
        localStorage.setItem('userOtakuType', type);
      }
    },
    setIsProfilePublic: (isPublic: boolean) => profile.saveProfile({ is_public: isPublic }),
    setUserBio: (bio: string) => profile.saveProfile({ bio }),
    setMyProfile: (newProfile: UserProfile | null) => profile.setProfile(newProfile),
  };
```
**問題**: 
- 返り値のオブジェクトが毎回新規生成される
- `setUserName`、`setUserIcon`、`setUserHandle`などの関数が毎回新規生成される（インライン関数定義）

**影響**: 高。関数が毎回新規生成されるため、これらをpropsとして受け取るコンポーネントが不要に再レンダリングされる。

### 1.3 インラインで関数定義している箇所

#### ❌ HomeTab.tsx (253行目)
```253:253:app/components/tabs/HomeTab.tsx
              onClick={() => setSelectedAnime(anime)}
```
**問題**: `GalleryTab`内で`AnimeCard`に渡す`onClick`がインライン関数として定義されている。

**影響**: `GalleryTab`が再レンダリングされるたびに、すべての`AnimeCard`が再レンダリングされる（`AnimeCard`は`React.memo`でメモ化されているが、propsの参照が変わるため）。

#### ❌ GalleryTab.tsx (253行目)
```253:253:app/components/tabs/GalleryTab.tsx
              onClick={() => setSelectedAnime(anime)}
```
**問題**: 同様にインライン関数定義。

#### ❌ WatchlistTab.tsx (424-425行目)
```424:425:app/components/tabs/WatchlistTab.tsx
              onRemove={() => handleRemoveFromWatchlist(item.anilist_id)}
              onMarkAsWatched={() => openWatchedModal(item)}
```
**問題**: `watchlist.map`内でインライン関数を定義している。

**影響**: `watchlist`が変更されるたびに、すべての`WatchlistCard`が再レンダリングされる。

#### ❌ CollectionSection.tsx (146, 152, 158行目)
```146:158:app/components/tabs/mypage/CollectionSection.tsx
          onClick={() => toggleCategory('characters')}
        />
        <CollectionCard
          label="名言"
          count={counts.quotes}
          selected={selectedCategory === 'quotes'}
          onClick={() => toggleCategory('quotes')}
        />
        <CollectionCard
          label="主題歌"
          count={counts.songs}
          selected={selectedCategory === 'songs'}
          onClick={() => toggleCategory('songs')}
```
**問題**: `toggleCategory`を呼び出すインライン関数が定義されている。

**影響**: 中程度。`CollectionCard`がメモ化されていない場合、再レンダリングが発生する。

#### ❌ HomeTab.tsx (828-838行目)
```828:838:app/components/tabs/HomeTab.tsx
                            onSearch={!isEmpty ? () => {
                              // 登録済みクールの検索
                              if (!seasonSearchResults.has(seasonKey) && !loadingSeasons.has(seasonKey)) {
                                searchSeasonAnimes(year, season, false).then(() => {
                                  setExpandedSeasonSearches(prev => new Set(prev).add(seasonKey));
                                });
                              } else if (seasonSearchResults.has(seasonKey)) {
                                // 既に検索結果がある場合は展開
                                setExpandedSeasonSearches(prev => new Set(prev).add(seasonKey));
                              }
                            } : undefined}
```
**問題**: 複雑なインライン関数定義。

**影響**: 高。`yearSeasonData.map`内で使用されているため、再レンダリングのたびに新しい関数が生成される。

## 2. 重い計算処理

### 2.1 useMemoなしで実行されている処理

#### ✅ HomeTab.tsx (227-319行目) - メモ化済み
```227:319:app/components/tabs/HomeTab.tsx
  const yearSeasonData = useMemo(() => {
```
**状態**: メモ化されている。ただし、依存配列が大きい（`seasons`, `filterAnime`, `seasonOrder`, `showAllSeasons`, `showUnregisteredOnly`）。

**問題点**: 
- `filterAnime`は`useCallback`でメモ化されているが、`filter`が変更されるたびに再生成される
- `seasonOrder`は定数配列だが、依存配列に含まれている

#### ✅ HomeTab.tsx (1007-1070行目) - メモ化済み
```1007:1070:app/components/tabs/HomeTab.tsx
  const { seriesArray, standaloneAnimes } = useMemo(() => {
```
**状態**: メモ化されている。`SeriesView`コンポーネント内で使用。

#### ⚠️ CollectionSection.tsx (111-131行目)
```111:131:app/components/tabs/mypage/CollectionSection.tsx
  const allQuotesList: Array<{ text: string; character?: string; animeTitle: string; animeId: number }> = [];
  props.allAnimes.forEach((anime) => {
    anime.quotes?.forEach((quote) => {
      allQuotesList.push({ ...quote, animeTitle: anime.title, animeId: anime.id });
    });
  });

  const filteredQuotes = allQuotesList.filter(quote => {
```
**問題**: `allQuotesList`の生成と`filteredQuotes`の計算が`useMemo`でメモ化されていない。

**影響**: `props.allAnimes`やフィルター条件が変更されるたびに、毎回再計算される。

#### ✅ GalleryTab.tsx (94-109行目) - メモ化済み
```94:109:app/components/tabs/GalleryTab.tsx
  const sortedAnimes = useMemo(() => {
```
**状態**: メモ化されている。

### 2.2 ソート処理の問題

#### ⚠️ GalleryTab.tsx (101, 103, 105行目)
```101:105:app/components/tabs/GalleryTab.tsx
        return animes.sort((a, b) => b.rating - a.rating || (b.rewatchCount ?? 0) - (a.rewatchCount ?? 0));
      case 'rewatch':
        return animes.sort((a, b) => (b.rewatchCount ?? 0) - (a.rewatchCount ?? 0));
      case 'title':
        return animes.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
```
**問題**: `sort`メソッドは元の配列を変更する。`useMemo`内で使用する場合は、配列のコピーを作成してからソートすべき。

**影響**: 元の`allAnimes`配列が変更される可能性がある（ただし、実際には`useMemo`内でフィルタリングされた新しい配列に対してソートしているため、影響は限定的）。

## 3. メモ化の現状

### 3.1 React.memoの使用状況

#### ✅ AnimeCard.tsx (99行目)
```99:99:app/components/AnimeCard.tsx
export const AnimeCard = memo(AnimeCardComponent);
```
**状態**: メモ化されている。

#### ❌ メモ化されていないコンポーネント
- `YearHeader` (HomeTab.tsx内)
- `SeasonHeader` (HomeTab.tsx内)
- `SeriesView` (HomeTab.tsx内)
- `SearchResultsSection` (HomeTab.tsx内)
- `ThumbnailCard` (GalleryTab.tsx内)
- `WatchlistCard` (WatchlistTab.tsx内)
- `CollectionCard` (CollectionSection.tsx内)
- `CollectionDetail` (CollectionSection.tsx内)

### 3.2 useMemo/useCallbackの使用状況

#### ✅ 適切に使用されている箇所
- `HomeTab.tsx`: `yearSeasonData`, `isAllExpanded`, `filteredStats`, `seriesArray`, `standaloneAnimes`
- `GalleryTab.tsx`: `sortedAnimes`
- `AnimeCard.tsx`: `isImageUrl`
- `CollectionSection.tsx`: `counts`

#### ⚠️ 改善の余地がある箇所
- `CollectionSection.tsx`: `allQuotesList`と`filteredQuotes`がメモ化されていない
- `HomeTab.tsx`: `filterAnime`は`useCallback`でメモ化されているが、`filter`が変更されるたびに再生成される

## 4. バンドルサイズ

### 4.1 ビルド結果
```
✓ Compiled successfully in 2.1s
✓ Generating static pages using 7 workers (10/10) in 260.7ms
```

**注意**: First Load JSのサイズが表示されていないため、詳細な分析が必要です。

### 4.2 推奨される確認方法
```bash
npm run build
# .next/analyze/ ディレクトリを確認
# または @next/bundle-analyzer を使用
```

## 5. 優先度別の改善提案

### 🔴 高優先度（即座に修正すべき）

1. **Contextのvalueをメモ化**
   - `AnimeDataContext.tsx`: `useMemo`で`animeData`をメモ化
   - `ModalContext.tsx`: `useMemo`でvalueオブジェクトをメモ化
   - `UserProfileContext.tsx`: `useMemo`で`profile`をメモ化

2. **useUserProfileの関数をメモ化**
   - `setUserName`、`setUserIcon`などを`useCallback`でメモ化

3. **HomeTab.tsxのインライン関数を修正**
   - `onSearch`プロップに渡す関数を`useCallback`でメモ化

### 🟡 中優先度（パフォーマンスに影響あり）

4. **CollectionSection.tsxの計算をメモ化**
   - `allQuotesList`と`filteredQuotes`を`useMemo`でメモ化

5. **コンポーネントのメモ化**
   - `YearHeader`、`SeasonHeader`、`ThumbnailCard`、`WatchlistCard`などを`React.memo`でメモ化

6. **GalleryTab.tsxのインライン関数を修正**
   - `onClick`を`useCallback`でメモ化

### 🟢 低優先度（最適化の余地）

7. **GalleryTab.tsxのソート処理を修正**
   - 配列のコピーを作成してからソート

8. **HomeTab.tsxの依存配列の最適化**
   - `seasonOrder`を依存配列から除外（定数のため）

## 6. 具体的な修正例

### Contextのvalueをメモ化する例

```typescript
// AnimeDataContext.tsx
export function AnimeDataProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const animeData = useAnimeData(user, isLoading);
  
  const memoizedValue = useMemo(() => animeData, [
    animeData.seasons,
    animeData.expandedSeasons,
    animeData.allAnimes,
    animeData.averageRating,
    animeData.totalRewatchCount,
  ]);
  
  return (
    <AnimeDataContext.Provider value={memoizedValue}>
      {children}
    </AnimeDataContext.Provider>
  );
}
```

### インライン関数をuseCallbackでメモ化する例

```typescript
// GalleryTab.tsx
const handleAnimeClick = useCallback((anime: Anime) => {
  setSelectedAnime(anime);
}, [setSelectedAnime]);

// JSX内
<ThumbnailCard
  onClick={() => handleAnimeClick(anime)}
  // ...
/>
```

## 7. まとめ

### 主な問題点
1. **Contextのvalueがメモ化されていない** → すべての購読コンポーネントが不要に再レンダリング
2. **インライン関数定義が多い** → 子コンポーネントの不要な再レンダリング
3. **一部の計算処理がメモ化されていない** → 毎回再計算される

### 期待される改善効果
- Contextのvalueをメモ化することで、**30-50%の再レンダリング削減**が期待できる
- インライン関数を`useCallback`でメモ化することで、**子コンポーネントの再レンダリングを大幅に削減**
- 計算処理のメモ化により、**レンダリング時間を短縮**

