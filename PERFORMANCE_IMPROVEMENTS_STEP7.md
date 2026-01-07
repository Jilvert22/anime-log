# パフォーマンス改善実施レポート（Step 7: ランディングページの最適化）

## 実施日
2026年1月7日

## 実施内容

### 🔴 最優先: ランディングページのレンダリングブロッキング削減

PageSpeed Insightsの結果:
- **レンダリングをブロックしているリクエスト**: 2,030ms削減可能（モバイル）
- **LCP**: 33.2秒（モバイル）、5.7秒（デスクトップ）
- **Speed Index**: 10.2秒（モバイル）、4.8秒（デスクトップ）
- **TBT**: 1,890ms（デスクトップ）

### 1. Navigationコンポーネントの最適化

**Navigation.tsx の改善**:

#### 1.1 認証状態監視の遅延実行

```typescript
// 変更前: 即座に実行
useEffect(() => {
  const unsubscribe = onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });
  return () => unsubscribe();
}, []);

// 変更後: 次のイベントループで実行
useEffect(() => {
  let unsubscribe: (() => void) | undefined;
  
  const timeoutId = setTimeout(() => {
    if (!supabase) return;
    unsubscribe = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, 0); // 次のイベントループで実行

  return () => {
    clearTimeout(timeoutId);
    if (unsubscribe) unsubscribe();
  };
}, []);
```

**効果**:
- 初期レンダリング時のメインスレッドブロッキングを回避
- 認証状態の監視を非同期で実行
- レンダリングブロッキング時間の削減

#### 1.2 プロフィール画像の最適化

```typescript
// 変更前
<img
  src={userIcon}
  alt="プロフィール"
  className="w-full h-full rounded-full object-cover"
/>

// 変更後
<img
  src={userIcon}
  alt="プロフィール"
  className="w-full h-full rounded-full object-cover"
  loading="lazy"
  decoding="async"
/>
```

**効果**:
- プロフィール画像の遅延読み込み
- 非同期デコードによるレンダリングブロッキングの削減
- 初期レンダリングの高速化

## 期待される効果

### レンダリングブロッキングの削減
- **現在**: 2,030ms削減可能（モバイル）
- **期待**: 認証状態監視の遅延実行により、レンダリングブロッキング時間を削減

### LCPの改善
- **現在（モバイル）**: 33.2秒
- **現在（デスクトップ）**: 5.7秒
- **期待**: 初期レンダリングの高速化により、LCP時間を短縮

### Speed Indexの改善
- **現在（モバイル）**: 10.2秒
- **現在（デスクトップ）**: 4.8秒
- **期待**: レンダリングブロッキングの削減により、Speed Indexを改善

### TBTの改善（デスクトップ）
- **現在**: 1,890ms
- **期待**: メインスレッドのブロッキング削減により、TBTを改善

## 追加の最適化提案

### 2. 初期データ取得の最適化（今後検討）

**改善案**:
1. **Server Componentでのデータ取得**
   - 初期表示に必要なデータをServer Componentで取得
   - クライアント側でのデータ取得を削減

2. **ストリーミングSSR**
   - Next.jsのストリーミングSSRを活用
   - 初期表示を優先し、残りのコンテンツを段階的に読み込む

### 3. 画像配信のさらなる最適化

**現在**: 2,316-2,338 KiB削減可能

**改善案**:
1. **画像のプリロード**
   - LCP要素となる画像のプリロード
   - `<link rel="preload" as="image">`の使用

2. **画像の圧縮**
   - より積極的な圧縮設定
   - 画像品質の調整

### 4. 未使用コードの削減

**未使用JavaScript**: 122-124 KiB削減可能
**未使用CSS**: 37 KiB削減可能

**改善案**:
1. **未使用インポートの削除**
   - ESLintルールの追加
   - 手動での未使用インポートの削除

2. **Tree Shakingの確認**
   - 未使用のエクスポートを削除
   - ライブラリの使用量を最小化

## 次のステップ

1. **改善後の再計測**
   - PageSpeed Insightsで再計測（デスクトップ・モバイル）
   - レンダリングブロッキング時間の改善を確認
   - LCPの改善を確認
   - Speed Indexの改善を確認
   - TBTの改善を確認（デスクトップ）

2. **追加の最適化（必要に応じて）**
   - Server Componentでのデータ取得
   - ストリーミングSSR
   - 画像のプリロード
   - 未使用コードの削除

## 参考

- `PAGESPEED_ANALYSIS.md` - PageSpeed Insights分析レポート
- `PERFORMANCE_IMPROVEMENTS_STEP1.md` - Step 1の改善レポート
- `PERFORMANCE_IMPROVEMENTS_STEP2.md` - Step 2の改善レポート
- `PERFORMANCE_IMPROVEMENTS_STEP3.md` - Step 3の改善レポート
- `PERFORMANCE_IMPROVEMENTS_STEP4.md` - Step 4の改善レポート
- `PERFORMANCE_IMPROVEMENTS_STEP5.md` - Step 5の改善レポート
- `PERFORMANCE_IMPROVEMENTS_STEP6.md` - Step 6の改善レポート

