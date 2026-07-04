# アイコン画像の配置ガイド

このガイドでは、アニメログアプリのアイコン画像を`public`フォルダに配置する方法を説明します。

## 必要な画像ファイル

### 1. アプリアイコン（紫→ピンクのグラデーション）
以下のサイズが必要です：
- `icon-512.png` (512x512px)
- `icon-192.png` (192x192px)
- `apple-touch-icon.png` (180x180px)
- `favicon.ico` (32x32px、ICO形式)

### 2. DNAカードアイコン（シアン→ピンクのグラデーション）
- `dna-icon.png` (128x128px)

## 方法1: macOSのsipsコマンドを使用（推奨）

### ステップ1: アプリアイコンの生成

ターミナルで以下のコマンドを実行してください（`<元画像のパス>`を実際の画像パスに置き換えてください）：

```bash
# プロジェクトディレクトリに移動
cd /Users/riku/Projects/anime-log

# アプリアイコン用（1枚目の画像: 紫→ピンク）
sips -z 512 512 <元画像のパス> --out public/icon-512.png
sips -z 192 192 <元画像のパス> --out public/icon-192.png
sips -z 180 180 <元画像のパス> --out public/apple-touch-icon.png
sips -z 32 32 <元画像のパス> --out public/favicon-temp.png
```

### ステップ2: DNAカードアイコンの生成

```bash
# DNAカードアイコン用（2枚目の画像: シアン→ピンク）
sips -z 128 128 <2枚目の画像のパス> --out public/dna-icon.png
```

### ステップ3: favicon.icoの変換

`sips`では直接ICO形式に変換できないため、以下のいずれかの方法を使用してください：

#### オプションA: オンラインツールを使用
1. https://convertio.co/ja/png-ico/ にアクセス
2. `public/favicon-temp.png`をアップロード
3. 変換された`favicon.ico`をダウンロード
4. `public/favicon.ico`として保存

#### オプションB: ImageMagickを使用（インストール済みの場合）
```bash
# ImageMagickをインストール（未インストールの場合）
brew install imagemagick

# 変換
convert public/favicon-temp.png public/favicon.ico
```

#### オプションC: スクリプトを使用
```bash
./setup-icons.sh <元画像のパス>
```

## 方法2: 画像編集ソフトを使用

### Photoshop / GIMP / Preview（macOS）

1. 元画像を開く
2. 各サイズにリサイズしてエクスポート：
   - 512x512px → `public/icon-512.png`
   - 192x192px → `public/icon-192.png`
   - 180x180px → `public/apple-touch-icon.png`
   - 128x128px → `public/dna-icon.png`（2枚目の画像から）
   - 32x32px → `public/favicon.ico`（ICO形式でエクスポート）

### オンラインツール

- **リサイズ**: https://www.iloveimg.com/resize-image
- **ICO変換**: https://convertio.co/ja/png-ico/
- **一括処理**: https://www.birme.net/

## 方法3: 自動化スクリプトを使用

プロジェクトルートに`setup-icons.sh`スクリプトを用意しています：

```bash
# 実行権限を付与（初回のみ）
chmod +x setup-icons.sh

# アプリアイコン用画像を処理
./setup-icons.sh ~/Downloads/app-icon.png

# DNAカードアイコン用画像を処理（手動）
sips -z 128 128 ~/Downloads/dna-icon.png --out public/dna-icon.png
```

## 配置後の確認

画像ファイルを配置したら、以下のコマンドで確認してください：

```bash
ls -lh public/*.png public/*.ico
```

以下のファイルが存在することを確認：
- ✅ `public/icon-512.png`
- ✅ `public/icon-192.png`
- ✅ `public/apple-touch-icon.png`
- ✅ `public/favicon.ico`
- ✅ `public/dna-icon.png`

## 動作確認

開発サーバーを起動して確認：

```bash
npm run dev
```

ブラウザで以下を確認：
1. **ブラウザタブのfavicon** - タブにアイコンが表示される
2. **DNAカードの左上アイコン** - マイページのDNAカードセクション
3. **PWAアイコン** - ブラウザの「ホーム画面に追加」機能で確認

## トラブルシューティング

### 画像が表示されない場合
- ファイル名が正確か確認
- ファイルパスが`public/`フォルダ直下か確認
- ブラウザのキャッシュをクリア（Cmd+Shift+R）

### favicon.icoが表示されない場合
- ICO形式で保存されているか確認
- ファイルサイズが32x32pxか確認
- ブラウザを再起動

### DNAアイコンが表示されない場合
- `dna-icon.png`が`public/`フォルダに存在するか確認
- Next.jsの開発サーバーを再起動


