# パフォーマンス改善実施レポート（Step 3: LCP優先読み込みとフォント最適化）

## 実施日
2026年1月7日

## 実施内容

### 🔴 最優先: LCP要素の優先読み込み

**問題**: モバイル環境でLCPが33.7秒と非常に遅い

### 1. AnimeCardコンポーネントの改善

**変更内容**:
- `priority`プロップを追加
- `priority`が`true`の場合は`loading="eager"`、`false`の場合は`loading="lazy"`

```typescript
function AnimeCardComponent({ 
  anime, 
  onClick,
  priority = false  // 追加
}: { 
  anime: Anime; 
  onClick: () => void;
  priority?: boolean;  // 追加
}) {
  // ...
  <Image
    src={anime.image}
    alt={anime.title}
    fill
    className="object-cover"
    sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
    priority={priority}  // 追加
    loading={priority ? "eager" : "lazy"}  // 変更
    unoptimized
    onError={handleImageError}
  />
}
```

### 2. HomeTabでの優先読み込み実装

**変更内容**:
- 最初の6枚のアニメカードに`priority={true}`を設定
- `useRef`を使用してグローバルカウンターを管理

```typescript
// LCP要素の優先読み込み用カウンター（最初の6枚にpriorityを設定）
const priorityImageCountRef = useRef(0);
const PRIORITY_IMAGE_LIMIT = 6;

// アニメカードの表示
{animes.map((anime, index) => {
  const shouldPriority = priorityImageCountRef.current < PRIORITY_IMAGE_LIMIT;
  if (shouldPriority) {
    priorityImageCountRef.current += 1;
  }
  return (
    <AnimeCard 
      key={...}
      anime={anime}
      onClick={() => handleAnimeClick(anime)}
      priority={shouldPriority}  // 追加
    />
  );
})}
```

**効果**:
- 最初の6枚のアニメカード画像が優先的に読み込まれる
- LCP要素の読み込み時間を短縮
- モバイル環境でのパフォーマンス改善

### 3. フォント最適化の強化

**app/layout.tsx の改善**:

```typescript
const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ['400', '500', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-rounded',
  preload: true,  // 追加: フォントのプリロードを有効化
  fallback: ['system-ui', 'arial'],  // 追加: フォールバックフォント
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  preload: true,  // 追加: フォントのプリロードを有効化
  fallback: ['system-ui', 'arial'],  // 追加: フォールバックフォント
});
```

**効果**:
- フォントのプリロードにより、フォント読み込み時間を短縮
- フォールバックフォントにより、FOUT（Flash of Unstyled Text）を防止
- `display: 'swap'`により、テキストの表示を優先

## 期待される効果

### LCPの改善
- **現在（モバイル）**: 33.7秒
- **目標**: 2.5秒以下
- **期待される改善**: 最初の6枚の画像を優先読み込みすることで、LCP時間を大幅に短縮

### フォント読み込みの高速化
- プリロードにより、フォント読み込み時間を短縮
- フォールバックフォントにより、テキストの即座表示

### モバイル環境での改善
- 低速4G環境でも、優先画像の読み込みによりLCPを改善
- ユーザー体験の向上

## 追加の最適化提案

### バンドルサイズの追加削減（今後検討）

**現在のバンドルサイズ**:
- メインページチャンク: 38.9 KiB
- 合計: 240.7 KiB

**改善案**:
1. **共有チャンクの分析**
   - `4bd1b696-67e30520d621c4dd.js` (62.2 KiB)
   - `622-541b24372b951bd9.js` (52.7 KiB)
   - `794-9353bb3ab9a73e90.js` (49.6 KiB)

2. **未使用コードの削除**
   - Tree Shakingの確認
   - 未使用の依存関係の削除

3. **より細かいコード分割**
   - ルートベースのコード分割
   - 機能ベースのコード分割

## 次のステップ

1. **改善後の再計測**
   - PageSpeed Insightsで再計測（モバイル環境）
   - LCPの改善を確認
   - パフォーマンススコアの向上を確認

2. **追加の最適化（必要に応じて）**
   - バンドルサイズの削減
   - より細かいコード分割
   - 未使用コードの削除

## 参考

- `PAGESPEED_ANALYSIS.md` - PageSpeed Insights分析レポート
- `PERFORMANCE_IMPROVEMENTS_STEP1.md` - Step 1の改善レポート
- `PERFORMANCE_IMPROVEMENTS_STEP2.md` - Step 2の改善レポート

