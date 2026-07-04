# コンポーネント分割 - 現状調査レポート

## HomeTab.tsx

### 基本情報
- **行数**: 1,522行
- **主要なコンポーネント**: 
  - `HomeTab` (メインコンポーネント、145-962行)
  - `YearHeader` (20-65行)
  - `SeasonHeader` (68-143行)
  - `SeriesView` (965-1320行)
  - `SearchResultsSection` (1323-1521行)

### 含まれるUI要素
1. **サブタブ切り替え** (679-699行)
   - クール別、積みアニメ、来期視聴予定、シリーズ、ギャラリー

2. **統計カード** (704-727行)
   - 作品数、周回数、平均評価

3. **コントロールバー** (730-791行)
   - アニメ追加ボタン
   - フィルター（すべて/未評価/周回未登録）
   - 未登録クール表示トグル
   - 未登録シーズンのみ表示トグル
   - 全展開/全折りたたみボタン

4. **年別リスト** (801-923行)
   - 年ヘッダー（YearHeader）
   - 季節ヘッダー（SeasonHeader）
   - アニメカードグリッド
   - 検索結果セクション（SearchResultsSection）

5. **シリーズビュー** (934-936行)
   - シリーズ別グループ化
   - 単発作品セクション
   - 未登録シーズンの提案機能

6. **ギャラリータブ** (938-943行)
   - GalleryTabコンポーネント

7. **積みアニメタブ** (945-955行)
   - WatchlistTabコンポーネント

8. **来期視聴予定タブ** (957-959行)
   - SeasonWatchlistTabコンポーネント

### 含まれるロジック

#### 状態管理
- `filter` (フィルタータイプ)
- `showAllSeasons` (未登録クール表示フラグ)
- `seasonSearchResults` (シーズン検索結果)
- `loadingSeasons` (ローディング中のシーズン)
- `expandedSeasonSearches` (展開されている検索結果)
- `showUnregisteredOnly` (未登録シーズンのみ表示)
- `watchlistItems` (積みアニメリスト)
- `addedToWatchlistIds` (追加済みID)

#### イベントハンドラ
- `loadWatchlist` (積みアニメ読み込み)
- `filterAnime` (フィルター適用)
- `expandAll` / `collapseAll` (全展開/全折りたたみ)
- `toggleYear` (年の展開切り替え)
- `toggleSeason` (季節の展開切り替え)
- `searchSeasonAnimes` (シーズンアニメ検索)
- `addAnimeFromSearch` (検索結果から作品追加)
- `addToWatchlistFromSearch` (積みアニメに追加)
- `addToNextSeasonWatchlist` (来期視聴予定に追加)

#### 計算ロジック
- `yearSeasonData` (年→季節→アニメの階層データ生成、228-320行)
- `filteredStats` (フィルター後の統計、668-674行)
- `isAllExpanded` (全展開判定、349-360行)

### 分割候補

1. **SeasonsView** (クール別表示)
   - 年別リスト全体（801-923行）
   - 統計カード（704-727行）
   - コントロールバー（730-791行）
   - 関連する状態とロジック

2. **SeriesView** (既に分離済み、965-1320行)
   - シリーズ別グループ化
   - 単発作品セクション
   - 未登録シーズン提案

3. **SearchResultsSection** (既に分離済み、1323-1521行)
   - 検索結果表示
   - 追加ボタン群

4. **SeasonSearchLogic** (カスタムフック化)
   - `searchSeasonAnimes`
   - `addAnimeFromSearch`
   - `addToWatchlistFromSearch`
   - `addToNextSeasonWatchlist`
   - 関連する状態管理

5. **YearSeasonDataHook** (カスタムフック化)
   - `yearSeasonData`の計算ロジック
   - `filterAnime`
   - `filteredStats`

6. **ExpansionControls** (コンポーネント化)
   - `expandAll` / `collapseAll`
   - `toggleYear` / `toggleSeason`
   - `isAllExpanded`

---

## HomeClient.tsx

### 基本情報
- **行数**: 627行
- **useCallback数**: 20個

### useCallback一覧と用途

1. `handleLogout` (228-230行) - ログアウト処理
2. `handleOpenAddForm` (233-235行) - 追加フォームを開く
3. `handleCloseAddForm` (237-239行) - 追加フォームを閉じる
4. `handleCloseReviewModal` (241-243行) - レビューモーダルを閉じる
5. `handleCloseSettings` (245-247行) - 設定モーダルを閉じる
6. `handleCloseFavoriteAnimeModal` (249-251行) - お気に入りアニメモーダルを閉じる
7. `handleCloseUserProfileModal` (253-255行) - ユーザープロフィールモーダルを閉じる
8. `handleCloseFollowListModal` (257-259行) - フォローリストモーダルを閉じる
9. `handleCloseAuthModal` (261-263行) - 認証モーダルを閉じる
10. `handleCloseAddQuoteModal` (265-268行) - 名言追加モーダルを閉じる
11. `handleCloseSongModal` (270-273行) - 楽曲モーダルを閉じる
12. `handleCloseDNAModal` (275-277行) - DNAモーダルを閉じる
13. `handleOpenAddQuoteModal` (279-282行) - 名言追加モーダルを開く
14. `handleEditQuote` (284-290行) - 名言編集
15. `handleSaveAddQuoteModal` (293-296行) - 名言保存
16. `handleReviewPosted` (298-302行) - レビュー投稿後処理
17. `handleMoveToBacklog` (305-323行) - 積みアニメに移動
18. `handleDeletePreviousSeason` (326-340行) - 前シーズン削除
19. `handleKeepPreviousSeason` (343-347行) - 前シーズン維持

### 子コンポーネントへのprops数

#### HomeTabへのprops (401-421行)
- `homeSubTab`, `setHomeSubTab`
- `count`, `totalRewatchCount`, `averageRating`
- `seasons`, `expandedYears`, `setExpandedYears`
- `expandedSeasons`, `setExpandedSeasons`
- `onOpenAddForm`, `setSelectedAnime`
- `allAnimes`, `user`
- `setSeasons`
- `extractSeriesName`, `getSeasonName`
- `animeToSupabase`, `supabaseToAnime`
**合計: 17個**

#### MyPageTabへのprops (425-464行)
- `allAnimes`, `seasons`
- `userName`, `userIcon`, `userHandle`, `userOtakuType`
- `setUserOtakuType`
- `favoriteAnimeIds`, `setFavoriteAnimeIds`
- `averageRating`
- `favoriteCharacters`, `setFavoriteCharacters`
- `characterFilter`, `setCharacterFilter`
- `quoteSearchQuery`, `setQuoteSearchQuery`
- `quoteFilterType`, `setQuoteFilterType`
- `selectedAnimeForFilter`, `setSelectedAnimeForFilter`
- `setSeasons`, `user`, `supabaseClient`
- `onOpenDNAModal`, `onOpenSettingsModal`
- `setShowFavoriteAnimeModal`
- `onOpenCharacterModal`, `onEditCharacter`
- `onOpenAddQuoteModal`, `onEditQuote`
- `setSelectedAnime`, `setShowSongModal`
- `handleLogout`
**合計: 28個**

### 使用しているカスタムフック
- `useStorage` (46行)
- `useModals` (53-74行)
- `useAuth` (77行)
- `useDarkMode` (80行)
- `useUserProfile` (83-98行)
- `useTabs` (101-106行)
- `useCollection` (109-112行)
- `useAnimeData` (115-123行)
- `useCountAnimation` (126行)
- `useFormStates` (129-142行)
- `useModalHandlers` (145-156行)
- `useAnimeReviews` (213-225行)

### 分割候補

1. **ModalHandlers** (カスタムフック化)
   - モーダル開閉ハンドラ群（1-12, 13-15）
   - `useModalHandlers`に統合可能

2. **SeasonEndHandlers** (カスタムフック化)
   - `handleMoveToBacklog`
   - `handleDeletePreviousSeason`
   - `handleKeepPreviousSeason`
   - 関連する状態（`showSeasonEndModal`, `previousSeasonItems`）

3. **HomeTabPropsProvider** (コンテキスト化)
   - HomeTabへの17個のpropsをContextで管理
   - または、カスタムフックで集約

4. **MyPageTabPropsProvider** (コンテキスト化)
   - MyPageTabへの28個のpropsをContextで管理
   - または、カスタムフックで集約

5. **ModalContainer** (コンポーネント化)
   - すべてのモーダルコンポーネントを1つのコンポーネントに集約
   - モーダル状態管理を内部化

---

## useUserProfile.ts

### 基本情報
- **行数**: 290行

### 責務の一覧と行数

1. **プロフィール読み込み** (14-93行、約80行)
   - `loadProfile`: Supabaseからプロフィール取得
   - アバターURL取得
   - localStorageキャッシュ
   - 新規プロフィール作成

2. **アバター画像アップロード** (95-134行、約40行)
   - `uploadAvatar`: ファイルアップロード
   - 古いアバター削除
   - ストレージへの保存

3. **プロフィール保存** (136-192行、約57行)
   - `saveProfile`: プロフィール更新
   - アバターアップロード統合
   - 状態更新とキャッシュ

4. **オタクタイプ保存** (194-200行、約7行)
   - `saveOtakuType`: オタクタイプのみ保存

5. **初期化と認証監視** (202-218行、約17行)
   - `useEffect`: プロフィール読み込み
   - 認証状態変化の監視

6. **お気に入りアニメ管理** (220-239行、約20行)
   - `favoriteAnimeIds`のlocalStorage読み込み/保存
   - 状態管理

7. **後方互換性のための値** (241-251行、約11行)
   - `userName`, `userIcon`, `userHandle`など
   - 既存コードとの互換性維持

8. **戻り値の定義** (253-288行、約36行)
   - 新しいAPIと後方互換性APIの両方を提供

### 分割案

1. **useProfile** (カスタムフック)
   - プロフィール読み込み (14-93行)
   - プロフィール保存 (136-192行)
   - 初期化と認証監視 (202-218行)
   - 後方互換性の値 (241-251行)

2. **useAvatar** (カスタムフック)
   - アバター画像アップロード (95-134行)
   - アバターURL管理

3. **useFavoriteAnime** (カスタムフック)
   - お気に入りアニメ管理 (220-239行)
   - localStorage操作

4. **useOtakuType** (カスタムフック)
   - オタクタイプ保存 (194-200行)
   - オタクタイプ関連の状態管理

または、より細かく分割：

1. **useProfileData** - プロフィールデータの読み込みと状態管理
2. **useProfileSave** - プロフィール保存ロジック
3. **useAvatarUpload** - アバターアップロード専用
4. **useFavoriteAnimeIds** - お気に入りアニメID管理
5. **useUserProfileCompatibility** - 後方互換性レイヤー

---

## コンポーネント依存関係

### 依存関係図

```
HomeClient (親コンポーネント)
│
├─ Navigation
│  └─ props: activeTab, setActiveTab, isDarkMode, setIsDarkMode, user, userName, userIcon, onOpenSettingsModal, setShowAuthModal
│
├─ HomeTab (子コンポーネント)
│  │
│  ├─ props: 17個（上記参照）
│  │
│  ├─ SeasonsView (クール別表示)
│  │  ├─ YearHeader
│  │  ├─ SeasonHeader
│  │  ├─ AnimeCard
│  │  └─ SearchResultsSection
│  │
│  ├─ SeriesView (シリーズ表示)
│  │  └─ AnimeCard
│  │
│  ├─ GalleryTab
│  │
│  ├─ WatchlistTab
│  │
│  └─ SeasonWatchlistTab
│
├─ MyPageTab (子コンポーネント)
│  └─ props: 28個（上記参照）
│
└─ モーダル群
   ├─ AddAnimeFormModal
   ├─ ReviewModal
   ├─ SettingsModal
   ├─ FavoriteAnimeModal
   ├─ UserProfileModal
   ├─ FollowListModal
   ├─ AuthModal
   ├─ AnimeDetailModal
   ├─ AddCharacterModal
   ├─ AddQuoteModal
   ├─ SongModal
   ├─ DNAModal
   └─ SeasonEndModal
```

### 状態のリフトアップ

#### HomeClient → HomeTab
- `seasons`, `setSeasons` - アニメデータ
- `expandedYears`, `setExpandedYears` - 展開状態
- `expandedSeasons`, `setExpandedSeasons` - 展開状態
- `allAnimes` - 全アニメリスト
- `user` - ユーザー情報
- `count`, `totalRewatchCount`, `averageRating` - 統計情報

#### HomeClient → MyPageTab
- `allAnimes`, `seasons` - アニメデータ
- `userName`, `userIcon`, `userHandle`, `userOtakuType` - ユーザー情報
- `favoriteAnimeIds`, `setFavoriteAnimeIds` - お気に入り
- `favoriteCharacters`, `setFavoriteCharacters` - お気に入りキャラ
- `characterFilter`, `setCharacterFilter` - フィルター
- `quoteSearchQuery`, `setQuoteSearchQuery` - 検索クエリ
- `quoteFilterType`, `setQuoteFilterType` - フィルタータイプ
- `selectedAnimeForFilter`, `setSelectedAnimeForFilter` - 選択アニメ

### 問題点

1. **Propsの多さ**
   - HomeTab: 17個
   - MyPageTab: 28個
   - これらはContextやカスタムフックで集約可能

2. **状態管理の分散**
   - 多くの状態がHomeClientに集約されている
   - 各タブで必要な状態のみを渡すべき

3. **useCallbackの多さ**
   - 20個のuseCallbackが定義されている
   - 多くはモーダル開閉処理で、カスタムフックに集約可能

4. **責務の混在**
   - HomeClientが多くの責務を持っている
   - モーダル管理、状態管理、イベントハンドリングが混在

---

## 推奨される分割戦略

### 優先度: 高

1. **useUserProfile.tsの分割**
   - 責務が明確に分離可能
   - 影響範囲が限定的

2. **HomeTab.tsxのSeasonsView分離**
   - 最も大きなセクション
   - 独立した機能として分離可能

3. **HomeClient.tsxのモーダルハンドラ集約**
   - 20個のuseCallbackを整理
   - カスタムフックに集約

### 優先度: 中

4. **HomeTab.tsxのSeasonSearchLogic分離**
   - 検索関連ロジックをカスタムフック化

5. **HomeClient.tsxのProps集約**
   - Contextまたはカスタムフックでprops数を削減

### 優先度: 低

6. **ModalContainerの作成**
   - モーダル管理の一元化

7. **YearSeasonDataHookの作成**
   - データ計算ロジックの分離

