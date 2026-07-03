# パフォーマンス現状把握レポート

## 分析実行日
2025年1月7日

## 1. next.config.ts の設定確認

### 現在の設定

```12:27:next.config.ts
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 's3.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.anilist.co',
      },
    ],
  },
```

**画像最適化の設定**:
- ✅ `next/image`用のリモートパターン設定済み（AniList CDN）
- ⚠️ 画像最適化の詳細設定（quality、sizes、formats等）は未設定

**その他の設定**:
- ✅ PWA設定あり（next-pwa）
- ✅ Bundle Analyzer設定あり
- ⚠️ コンパイラ最適化設定（swcMinify等）は未明示

### 改善の余地がある設定

1. **画像最適化の強化**
   - `quality`設定の追加
   - `formats`設定（WebP/AVIF優先）
   - `deviceSizes`と`imageSizes`の最適化

2. **コンパイラ最適化**
   - SWC minifyの明示的設定
   - 圧縮設定の最適化

## 2. バンドルサイズの現状

### First Load JS のサイズ

#### メインページ (/)
- **app/page-a425fd8421141f3a.js**: **164KB** (gzip圧縮前)

#### 主要チャンクの内訳（100KB以上）

| チャンク名 | サイズ | 説明 |
|-----------|--------|------|
| 622-541b24372b951bd9.js | 197KB | 共有チャンク（Supabase関連の可能性） |
| ad2866b8.165a364e8dcabddf.js | 194KB | 共有チャンク |
| 4bd1b696-67e30520d621c4dd.js | 194KB | 共有チャンク |
| framework-4e51298db41fcfd4.js | 185KB | Next.jsフレームワーク |
| 794-9353bb3ab9a73e90.js | 184KB | 共有チャンク |
| **app/page-a425fd8421141f3a.js** | **164KB** | **メインページ** |
| main-13f16c6e3fb94930.js | 137KB | メインチャンク |
| polyfills-42372ed130431b0a.js | 110KB | ポリフィル |

**合計（100KB以上のチャンクのみ）**: 約1.36MB

### バンドル分析レポート

バンドル分析レポートは以下の場所に生成されています：
- `.next/analyze/client.html` - クライアント側バンドル
- `.next/analyze/nodejs.html` - Node.js側バンドル
- `.next/analyze/edge.html` - Edge Runtime側バンドル

ブラウザで開いて詳細な可視化を確認できます。

### 過去の改善との比較

既存の分析ドキュメント（`BUNDLE_IMPROVEMENT_RESULTS.md`）によると：
- **改善前**: 227KB（メインページ）
- **改善後（過去）**: 116KB（メインページ）
- **現在**: 164KB（メインページ）

**分析**: 過去の改善により111KB削減されたが、現在は164KBとなっており、約48KB増加しています。これは新機能追加や依存関係の更新による可能性があります。

## 3. 既に実施済みの最適化

### ✅ 実施済みの改善

1. **html2canvasとqrcode.reactの動的インポート化**
   - 対象: `app/components/tabs/mypage/AnimeDNASection.tsx`
   - 効果: DNAモーダルが開かれるまでバンドルに含まれない

2. **モーダルコンポーネントの動的インポート化**
   - 対象: `app/components/HomeClient.tsx`
   - 動的インポート化されたモーダル:
     - SongModal, UserProfileModal, FollowListModal
     - AddCharacterModal, AddQuoteModal, DNAModal, SeasonEndModal

3. **タブコンポーネントの動的インポート化**
   - 対象: `app/components/tabs/HomeTab.tsx`
   - 動的インポート化されたタブ:
     - GalleryTab, WatchlistTab, SeasonWatchlistTab

## 4. パフォーマンス分析の結果

### 🔴 高優先度の問題

#### 4.1 Contextのvalueがメモ化されていない

**問題箇所**:
1. `AnimeDataContext.tsx` - `animeData`が毎回新規生成
2. `ModalContext.tsx` - valueオブジェクトが毎回新規生成
3. `UserProfileContext.tsx` - `profile`が毎回新規生成

**影響**: Contextを購読しているすべてのコンポーネントが不要に再レンダリングされる

#### 4.2 useUserProfileの関数がメモ化されていない

**問題箇所**: `app/hooks/useUserProfile.ts`
- `setUserName`、`setUserIcon`などの関数が毎回新規生成

**影響**: これらの関数をpropsとして受け取るコンポーネントが不要に再レンダリング

#### 4.3 インライン関数定義が多い

**問題箇所**:
- `HomeTab.tsx`: `onSearch`プロップに渡す関数
- `GalleryTab.tsx`: `onClick`プロップに渡す関数
- `WatchlistTab.tsx`: `onRemove`、`onMarkAsWatched`プロップ

**影響**: 子コンポーネントの不要な再レンダリング

### 🟡 中優先度の問題

#### 4.4 計算処理がメモ化されていない

**問題箇所**: `CollectionSection.tsx`
- `allQuotesList`と`filteredQuotes`が`useMemo`でメモ化されていない

**影響**: `props.allAnimes`やフィルター条件が変更されるたびに再計算

#### 4.5 コンポーネントがメモ化されていない

**未メモ化のコンポーネント**:
- `YearHeader`, `SeasonHeader`, `SeriesView` (HomeTab.tsx内)
- `ThumbnailCard` (GalleryTab.tsx内)
- `WatchlistCard` (WatchlistTab.tsx内)
- `CollectionCard`, `CollectionDetail` (CollectionSection.tsx内)

**影響**: 親コンポーネントの再レンダリング時に不要に再レンダリング

### 🟢 低優先度の問題

#### 4.6 ソート処理の問題

**問題箇所**: `GalleryTab.tsx`
- `sort`メソッドが元の配列を変更（コピーを作成してからソートすべき）

## 5. Lighthouse スコアの確認

### 必要な確認項目

**PageSpeed Insightsでの計測が必要**:
1. https://animelog.jp/ のスコア
2. https://animelog.jp/about のスコア

**確認すべき指標**:
- Performance Score
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)
- Speed Index

**推奨**: 実際のPageSpeed Insightsで計測し、結果を共有してください。

## 6. 改善項目の優先順位

### 🔴 最優先（即座に実施すべき）

1. **Contextのvalueをメモ化**
   - 期待される効果: 30-50%の再レンダリング削減
   - 実装難易度: 低

2. **useUserProfileの関数をメモ化**
   - 期待される効果: プロフィール関連コンポーネントの再レンダリング削減
   - 実装難易度: 低

3. **インライン関数をuseCallbackでメモ化**
   - 期待される効果: 子コンポーネントの再レンダリング削減
   - 実装難易度: 中

### 🟡 高優先度（パフォーマンス改善）

4. **計算処理のメモ化**
   - `CollectionSection.tsx`の`allQuotesList`と`filteredQuotes`
   - 期待される効果: レンダリング時間の短縮
   - 実装難易度: 低

5. **コンポーネントのメモ化**
   - `YearHeader`, `SeasonHeader`, `ThumbnailCard`など
   - 期待される効果: 不要な再レンダリングの削減
   - 実装難易度: 低

6. **画像最適化の強化**
   - `next.config.ts`にquality、formats等の設定追加
   - 期待される効果: 画像読み込み時間の短縮
   - 実装難易度: 低

### 🟢 中優先度（最適化の余地）

7. **バンドルサイズの再確認**
   - 現在164KBのメインページをさらに削減できるか検討
   - 期待される効果: First Load JSの削減
   - 実装難易度: 中

8. **ソート処理の修正**
   - 配列のコピーを作成してからソート
   - 期待される効果: 副作用の防止
   - 実装難易度: 低

## 7. 次のステップ

### Step 2: 改善項目の特定と実施

1. **Lighthouse スコアの確認**
   - PageSpeed Insightsで計測（ユーザー側で実施）
   - 結果を共有してもらう

2. **高優先度の改善を実施**
   - Contextのvalueメモ化
   - useUserProfileの関数メモ化
   - インライン関数のメモ化

3. **改善後の再測定**
   - バンドルサイズの再確認
   - パフォーマンス指標の確認

## 8. 参考情報

### 分析レポートの場所
- バンドル分析: `.next/analyze/client.html`
- 既存の分析ドキュメント:
  - `BUNDLE_ANALYSIS.md` - 初期分析
  - `BUNDLE_IMPROVEMENT_RESULTS.md` - 改善結果
  - `PERFORMANCE_ANALYSIS.md` - パフォーマンス分析

### ビルドコマンド
```bash
# バンドル分析付きビルド
ANALYZE=true npm run build

# 通常ビルド
npm run build
```

