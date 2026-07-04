# 状態管理の改善 - 現状調査レポート

## 現在の状態管理

### 基本パターン
- **useState**: 38ファイルで221箇所使用
- **useContext**: なし（0件）
- **外部ライブラリ**: なし（Redux, Zustand, Jotai等は未使用）

### カスタムフックによる状態管理
以下のカスタムフックが状態を管理しています：

1. **useModals**: モーダル表示状態（10個のモーダル）
2. **useAnimeData**: アニメデータ（seasons, allAnimes, averageRating, totalRewatchCount）
3. **useUserProfile**: ユーザープロフィール（userName, userIcon, userHandle, userOtakuType, favoriteAnimeIds）
4. **useFormStates**: フォーム状態（characterFilter, quoteSearchQuery等）
5. **useCollection**: コレクション状態（favoriteCharacters）
6. **useTabs**: タブ状態（activeTab, homeSubTab）
7. **useAnimeReviews**: レビュー状態（animeReviews, reviewFilter等）
8. **useDarkMode**: ダークモード状態
9. **useAuth**: 認証状態

### HomeClientでの状態管理
`HomeClient.tsx`では以下の状態を直接管理：
- `selectedAnime` (useState)
- `expandedYears` (useState)
- `showSeasonEndModal` (useState)
- `previousSeasonItems` (useState)

## props drilling の問題箇所

### 1. HomeClient → HomeTab: 17個のprops

**状態（6個）**:
- `homeSubTab`, `setHomeSubTab`
- `expandedYears`, `setExpandedYears`
- `expandedSeasons`, `setExpandedSeasons`

**ハンドラ（3個）**:
- `onOpenAddForm`
- `setSelectedAnime`
- `setSeasons`

**データ（6個）**:
- `count`
- `totalRewatchCount`
- `averageRating`
- `seasons`
- `allAnimes`
- `user`

**ユーティリティ関数（4個）**:
- `extractSeriesName`
- `getSeasonName`
- `animeToSupabase`
- `supabaseToAnime`

### 2. HomeClient → MyPageTab: 28個のprops

**状態（14個）**:
- `favoriteAnimeIds`, `setFavoriteAnimeIds`
- `favoriteCharacters`, `setFavoriteCharacters`
- `characterFilter`, `setCharacterFilter`
- `quoteSearchQuery`, `setQuoteSearchQuery`
- `quoteFilterType`, `setQuoteFilterType`
- `selectedAnimeForFilter`, `setSelectedAnimeForFilter`
- `userOtakuType`, `setUserOtakuType`

**ハンドラ（11個）**:
- `setSeasons`
- `onOpenDNAModal`
- `onOpenSettingsModal`
- `setShowFavoriteAnimeModal`
- `onOpenCharacterModal`
- `onEditCharacter`
- `onOpenAddQuoteModal`
- `onEditQuote`
- `setSelectedAnime`
- `setShowSongModal`
- `handleLogout`

**データ（3個）**:
- `allAnimes`
- `seasons`
- `user`
- `supabaseClient`
- `userName`
- `userIcon`
- `userHandle`
- `averageRating`

### 3. MyPageTab → CollectionSection: 16個のprops

**状態（8個）**:
- `favoriteCharacters`, `setFavoriteCharacters`
- `characterFilter`, `setCharacterFilter`
- `quoteSearchQuery`, `setQuoteSearchQuery`
- `quoteFilterType`, `setQuoteFilterType`
- `selectedAnimeForFilter`, `setSelectedAnimeForFilter`

**ハンドラ（6個）**:
- `setSeasons`
- `onOpenAddCharacterModal`
- `onEditCharacter`
- `onOpenAddQuoteModal`
- `onEditQuote`
- `setSelectedAnime`
- `setShowSongModal`

**データ（2個）**:
- `allAnimes`
- `seasons`
- `user`
- `supabaseClient`

### 4. MyPageTab → AnimeDNASection: 11個のprops

**状態（4個）**:
- `favoriteAnimeIds`, `setFavoriteAnimeIds`
- `userOtakuType`, `setUserOtakuType`

**ハンドラ（2個）**:
- `setShowFavoriteAnimeModal`
- `onOpenDNAModal`

**データ（5個）**:
- `allAnimes`
- `seasons`
- `userName`
- `userIcon`
- `userHandle`
- `averageRating`

## Context化の候補

### 1. アニメデータContext（優先度: 高）
**理由**: 
- `seasons`, `allAnimes`, `averageRating`, `totalRewatchCount`は複数のコンポーネントで使用
- HomeTab, MyPageTab, 各種モーダルで共有
- 深い階層にpropsとして渡されている

**含める状態**:
- `seasons`, `setSeasons`
- `allAnimes` (computed)
- `averageRating` (computed)
- `totalRewatchCount` (computed)
- `expandedSeasons`, `setExpandedSeasons`
- `expandedYears`, `setExpandedYears`

### 2. ユーザープロフィールContext（優先度: 高）
**理由**:
- `userName`, `userIcon`, `userHandle`, `userOtakuType`は多くのコンポーネントで使用
- Navigation, MyPageTab, AnimeDNASection等で共有
- 認証状態と密接に関連

**含める状態**:
- `user` (認証ユーザー)
- `userName`, `userIcon`, `userHandle`, `userOtakuType`
- `favoriteAnimeIds`, `setFavoriteAnimeIds`
- `profile`, `saveProfile`等のプロフィール操作

### 3. モーダル管理Context（優先度: 中）
**理由**:
- 10個以上のモーダル状態が存在
- 現在は`useModals`フックで管理されているが、複数コンポーネントからアクセスが必要
- モーダル間の連携（例: アニメ選択→詳細モーダル）がある

**含める状態**:
- 各モーダルの表示状態とsetter
- モーダルを開く/閉じるヘルパー関数

### 4. フォーム状態Context（優先度: 中）
**理由**:
- `characterFilter`, `quoteSearchQuery`等は複数のコンポーネントで使用
- CollectionSectionとその子コンポーネントで共有
- ただし、使用範囲が限定的

**含める状態**:
- `characterFilter`, `setCharacterFilter`
- `quoteSearchQuery`, `setQuoteSearchQuery`
- `quoteFilterType`, `setQuoteFilterType`
- `selectedAnimeForFilter`, `setSelectedAnimeForFilter`
- `editingCharacter`, `setEditingCharacter`
- `editingQuote`, `setEditingQuote`

### 5. 選択状態Context（優先度: 低）
**理由**:
- `selectedAnime`は複数のコンポーネントで使用
- ただし、主にモーダル表示のトリガーとして使用されるため、モーダルContextに含めることも可能

**含める状態**:
- `selectedAnime`, `setSelectedAnime`

### 6. コレクションContext（優先度: 低）
**理由**:
- `favoriteCharacters`は主にMyPageTabとその子コンポーネントで使用
- 使用範囲が限定的だが、props drillingが発生している

**含める状態**:
- `favoriteCharacters`, `setFavoriteCharacters`

## 既存のContext

**なし**

現在、React Contextは使用されていません。すべての状態管理は`useState`とカスタムフックで行われています。

## 推奨される改善アプローチ

### フェーズ1: 高優先度のContext化
1. **アニメデータContext**の作成
   - `useAnimeData`フックの状態をContext化
   - HomeTab, MyPageTab, モーダルでのprops削減

2. **ユーザープロフィールContext**の作成
   - `useUserProfile`フックの状態をContext化
   - Navigation, MyPageTabでのprops削減

### フェーズ2: 中優先度のContext化
3. **モーダル管理Context**の作成
   - `useModals`フックの状態をContext化
   - モーダル操作の簡素化

4. **フォーム状態Context**の作成
   - `useFormStates`フックの状態をContext化
   - CollectionSectionでのprops削減

### フェーズ3: 最適化
5. 不要なpropsの削除
6. コンポーネントの再レンダリング最適化
7. Contextの分割（パフォーマンス向上）

## 注意点

1. **パフォーマンス**: Contextの過度な使用は再レンダリングを増やす可能性があるため、適切な分割が必要
2. **依存関係**: 一部のフック（例: `useAnimeData`）は他のフック（例: `useAuth`）に依存している
3. **後方互換性**: 既存のカスタムフックは維持しつつ、Contextでラップする形が安全

