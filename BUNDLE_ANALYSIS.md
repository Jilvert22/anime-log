# バンドルサイズ分析レポート

## 分析実行日
2025年1月1日

## 1. First Load JS の合計サイズ

### メインページ (/)
- **app/page-4b0041f6b02983fb.js**: **227KB** (gzip圧縮前)
- 合計First Load JS: 約 **1.2MB** (すべてのチャンクを含む)

### 主要チャンクの内訳
| チャンク名 | サイズ | 説明 |
|-----------|--------|------|
| app/page-4b0041f6b02983fb.js | 227KB | メインページのコード |
| 622-541b24372b951bd9.js | 200KB | 共有チャンク（Supabase関連の可能性） |
| ad2866b8-165a364e8dcabddf.js | 196KB | 共有チャンク |
| 4bd1b696-67e30520d621c4dd.js | 196KB | 共有チャンク |
| framework-4e51298db41fcfd4.js | 188KB | Next.jsフレームワーク |
| 794-9353bb3ab9a73e90.js | 184KB | 共有チャンク |
| main-13f16c6e3fb94930.js | 140KB | メインチャンク |
| polyfills-42372ed130431b0a.js | 112KB | ポリフィル |

## 2. 特に大きいチャンク（100KB以上）

### 100KB以上のチャンク一覧
1. **app/page-4b0041f6b02983fb.js** - 227KB (メインページ)
2. **622-541b24372b951bd9.js** - 200KB (共有チャンク)
3. **ad2866b8-165a364e8dcabddf.js** - 196KB (共有チャンク)
4. **4bd1b696-67e30520d621c4dd.js** - 196KB (共有チャンク)
5. **framework-4e51298db41fcfd4.js** - 188KB (Next.jsフレームワーク)
6. **794-9353bb3ab9a73e90.js** - 184KB (共有チャンク)
7. **main-13f16c6e3fb94930.js** - 140KB (メインチャンク)
8. **polyfills-42372ed130431b0a.js** - 112KB (ポリフィル)

**合計**: 約1.4MB (100KB以上のチャンクのみ)

## 3. 重複してバンドルされているライブラリ

### 確認されたライブラリの使用状況

#### @supabase/supabase-js
- **使用箇所**: 24ファイル
- **サイズ**: 約200KB (共有チャンクに含まれる可能性)
- **重複の可能性**: 中（複数のファイルでインポートされているが、Next.jsのコード分割により共有チャンクに含まれている可能性が高い）

#### html2canvas
- **使用箇所**: 1ファイル (AnimeDNASection.tsx)
- **サイズ**: 約50-100KB (推定)
- **問題**: DNAモーダルでのみ使用されているが、初回ロード時にバンドルされている可能性
- **改善提案**: 動的インポート化

#### qrcode.react
- **使用箇所**: 1ファイル (AnimeDNASection.tsx)
- **サイズ**: 約20-30KB (推定)
- **問題**: DNAモーダルでのみ使用されているが、初回ロード時にバンドルされている可能性
- **改善提案**: 動的インポート化

## 4. 改善提案

### 🔴 高優先度（即座に実施すべき）

#### 1. html2canvasとqrcode.reactの動的インポート化
**対象ファイル**: `app/components/tabs/mypage/AnimeDNASection.tsx`

**現状の問題**:
- DNAモーダルでのみ使用されるライブラリが初回ロード時にバンドルされている
- 約70-130KBの削減が期待できる

**修正方法**:
```typescript
// 修正前
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

// 修正後
const handleDownload = async () => {
  const html2canvas = (await import('html2canvas')).default;
  // ... 処理
};

const QRCodeComponent = dynamic(() => import('qrcode.react').then(mod => ({ default: mod.QRCodeSVG })), {
  ssr: false,
});
```

**期待される効果**: 初回ロード時に約70-130KB削減

### 🟡 中優先度（パフォーマンス改善）

#### 2. モーダルコンポーネントの動的インポート化
**対象ファイル**: `app/components/HomeClient.tsx`

**現状の問題**:
- すべてのモーダルコンポーネントが初回ロード時にバンドルされている
- モーダルは実際に開かれるまで不要

**修正方法**:
```typescript
// 修正前
import { DNAModal } from './modals/DNAModal';
import { AddCharacterModal } from './modals/AddCharacterModal';
// ... 他のモーダル

// 修正後
const DNAModal = dynamic(() => import('./modals/DNAModal').then(mod => ({ default: mod.DNAModal })), {
  ssr: false,
});
```

**期待される効果**: 初回ロード時に約50-100KB削減

#### 3. タブコンポーネントの動的インポート化
**対象ファイル**: `app/components/HomeClient.tsx`

**現状の問題**:
- すべてのタブコンポーネントが初回ロード時にバンドルされている
- アクティブなタブ以外は不要

**修正方法**:
```typescript
// 修正前
import MyPageTab from './tabs/MyPageTab';

// 修正後
const MyPageTab = dynamic(() => import('./tabs/MyPageTab'), {
  ssr: false,
});
```

**期待される効果**: 初回ロード時に約30-50KB削減

### 🟢 低優先度（最適化の余地）

#### 4. 画像最適化の確認
- `next/image`の使用状況を確認
- 画像の遅延読み込みが適切に設定されているか確認

#### 5. 未使用のライブラリの削除
- `package.json`の依存関係を確認
- 未使用のライブラリがあれば削除

## 5. 分析結果のまとめ

### 現在のバンドルサイズ
- **メインページのFirst Load JS**: 約227KB (gzip圧縮前)
- **合計First Load JS**: 約1.2MB (すべてのチャンクを含む)
- **100KB以上のチャンク**: 8個、合計約1.4MB

### 改善の優先順位
1. **html2canvasとqrcode.reactの動的インポート化** (高優先度)
   - 期待される削減: 70-130KB
   - 実装難易度: 低

2. **モーダルコンポーネントの動的インポート化** (中優先度)
   - 期待される削減: 50-100KB
   - 実装難易度: 中

3. **タブコンポーネントの動的インポート化** (中優先度)
   - 期待される削減: 30-50KB
   - 実装難易度: 中

### 総合的な改善効果
上記の改善を実施することで、**初回ロード時に約150-280KBの削減**が期待できます。

## 6. 次のステップ

1. html2canvasとqrcode.reactの動的インポート化を実施
2. モーダルコンポーネントの動的インポート化を実施
3. タブコンポーネントの動的インポート化を実施
4. 改善後のバンドルサイズを再測定

## 7. 参考情報

- 分析レポートの場所: `.next/analyze/client.html`
- ブラウザで開いて詳細を確認可能
- 各チャンクの内容を可視化して確認できる

