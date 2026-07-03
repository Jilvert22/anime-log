# PageSpeed Insights 分析レポート

## 計測日
2026年1月7日 16:51 JST

## メインページ (https://animelog.jp/) の結果

### パフォーマンススコア
- **Overall Performance Score: 76** (Needs Improvement)
  - 範囲: 50-89 (オレンジ)

### Core Web Vitals と主要指標

| 指標 | 値 | 評価 | 優先度 |
|------|-----|------|--------|
| **First Contentful Paint (FCP)** | 0.5秒 | ✅ Good | - |
| **Largest Contentful Paint (LCP)** | **5.8秒** | ❌ Poor | 🔴 最優先 |
| **Total Blocking Time (TBT)** | 10ms | ✅ Good | - |
| **Speed Index** | 0.7秒 | ✅ Good | - |
| **Cumulative Layout Shift (CLS)** | 0 | ✅ Good | - |

### バンドルサイズ分析

**合計バンドルサイズ: 240.7 KiB**

#### 主要チャンク（転送サイズ順）

| チャンク名 | サイズ | 割合 | 説明 |
|-----------|--------|------|------|
| `4bd1b696-67e30520d621c4dd.js` | 62.2 KiB | 26% | 共有チャンク |
| `622-541b24372b951bd9.js` | 52.7 KiB | 22% | 共有チャンク（Supabase関連の可能性） |
| `794-9353bb3ab9a73e90.js` | 49.6 KiB | 21% | 共有チャンク |
| `app/page-6cd2c76e7c527882.js` | 38.9 KiB | 16% | **メインページ** |
| `935-5ea97c6ed41b29a4.js` | 7.4 KiB | 3% | - |
| `48-61412c1956a8334d.js` | 5.2 KiB | 2% | - |
| `538-b144beb08b864a17.js` | 5.2 KiB | 2% | - |
| `(inline)` | 5.1 KiB | 2% | インラインスクリプト |

**分析**:
- メインページのチャンクは38.9 KiBで、以前の164KBから大幅に削減されている
- 共有チャンクが大部分を占めている（約70%）
- バンドルサイズ自体は比較的小さい

## Aboutページ (https://animelog.jp/about) の結果

### バンドルサイズ分析

**合計バンドルサイズ: 239.0 KiB**

#### 主要チャンク

| チャンク名 | サイズ | 割合 |
|-----------|--------|------|
| `4bd1b696-67e30520d621c4dd.js` | 62.2 KiB | 26% |
| `622-541b24372b951bd9.js` | 52.7 KiB | 22% |
| `794-9353bb3ab9a73e90.js` | 49.6 KiB | 21% |
| `app/page-6cd2c76e7c527882.js` | 38.9 KiB | 16% |
| `app/about/page-e9afd56fa6a2d264.js` | 3.6 KiB | 2% |

**分析**:
- メインページとほぼ同じチャンク構成
- Aboutページ固有のチャンクは3.6 KiBと小さい

## 主な問題点

### 🔴 最優先: Largest Contentful Paint (LCP) が5.8秒

**問題**:
- LCPが5.8秒と非常に遅い（目標: 2.5秒以下）
- これがパフォーマンススコア76の主な原因

**考えられる原因**:
1. **画像の読み込みが遅い**
   - AniList CDNからの画像読み込み
   - 画像の最適化が不十分（WebP/AVIF未使用の可能性）
   - 画像のサイズが大きい
   - 遅延読み込み（lazy loading）の設定が不適切

2. **フォントの読み込み**
   - カスタムフォントの読み込みが遅い可能性

3. **レンダリングブロッキングリソース**
   - CSSやJavaScriptの読み込み順序

4. **サーバー応答時間**
   - TTFB (Time to First Byte) が遅い可能性

### ✅ 良好な指標

- **FCP (0.5秒)**: 非常に良好
- **TBT (10ms)**: 良好（JavaScriptの実行が最適化されている）
- **Speed Index (0.7秒)**: 良好
- **CLS (0)**: 完璧（レイアウトシフトなし）

## 改善提案

### 🔴 最優先: LCPの改善

#### 1. 画像最適化の強化

**next.config.ts の改善**:
```typescript
images: {
  remotePatterns: [
    // ... 既存の設定
  ],
  formats: ['image/avif', 'image/webp'], // AVIF/WebP優先
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
  dangerouslyAllowSVG: false,
},
```

**期待される効果**: 画像サイズを30-50%削減、読み込み時間を短縮

#### 2. 画像の優先読み込み

**LCP要素の特定と優先読み込み**:
- LCP要素（おそらくヒーロー画像）に`priority`プロップを追加
- `next/image`の`loading="eager"`を使用

**例**:
```tsx
<Image
  src={heroImage}
  alt="Hero"
  priority  // LCP要素に追加
  sizes="100vw"
/>
```

#### 3. 画像のプリロード

**重要画像のプリロード**:
```tsx
<head>
  <link rel="preload" as="image" href="/hero-image.jpg" />
</head>
```

#### 4. フォント最適化

**フォントの読み込み最適化**:
- `next/font`を使用してフォントを最適化
- フォントの`display: swap`を設定
- 不要なフォントウェイトを削除

### 🟡 中優先度: バンドルサイズの最適化

#### 5. 共有チャンクの分析

**大きな共有チャンクの内容確認**:
- `4bd1b696-67e30520d621c4dd.js` (62.2 KiB)
- `622-541b24372b951bd9.js` (52.7 KiB)
- `794-9353bb3ab9a73e90.js` (49.6 KiB)

**改善方法**:
- 未使用のコードの削除（Tree Shaking）
- より細かいコード分割
- 動的インポートの追加検討

### 🟢 低優先度: その他の最適化

#### 6. サーバー応答時間の改善

**TTFBの確認**:
- Vercelの設定を確認
- CDNキャッシュの最適化
- Edge Functionsの活用検討

#### 7. リソースヒントの追加

**preconnect/dns-prefetch**:
```tsx
<head>
  <link rel="preconnect" href="https://s4.anilist.co" />
  <link rel="preconnect" href="https://s3.anilist.co" />
  <link rel="dns-prefetch" href="https://cdn.anilist.co" />
</head>
```

## 改善の優先順位

1. **🔴 最優先**: LCPの改善（画像最適化、優先読み込み）
2. **🟡 高優先度**: フォント最適化
3. **🟡 中優先度**: バンドルサイズの最適化
4. **🟢 低優先度**: リソースヒント、サーバー応答時間

## 目標値

- **LCP**: 5.8秒 → **2.5秒以下**（改善幅: 57%削減）
- **Performance Score**: 76 → **90以上**（改善幅: 14ポイント以上）

## 次のステップ

1. LCP要素の特定（Chrome DevToolsで確認）
2. 画像最適化の実施
3. フォント最適化の実施
4. 改善後の再計測

## 参考

- `PERFORMANCE_CURRENT_STATUS.md` - 現状把握レポート
- `PERFORMANCE_IMPROVEMENTS_STEP1.md` - 実施済み改善レポート

