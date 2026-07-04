# マイページ構造ドキュメント

## 全体構造

### 1. MyPageTab（メインコンポーネント）
**ファイル**: `app/components/tabs/MyPageTab.tsx`

**構成**:
```
MyPageTab
├── AnimeDNASection（DNAカード）
├── StatisticsSection（統計・傾向）
├── CollectionSection（コレクション）
└── SettingsSection（設定）
```

---

## 2. AnimeDNASection（DNAカード）

**ファイル**: `app/components/tabs/mypage/AnimeDNASection.tsx`

### 表示内容

#### 上部セクション（プロフィール + 統計）
- **プロフィールセクション**:
  - アバター画像（135px〜180px、レスポンシブ）
  - オタクタイプバッジ（クリックで編集可能）
  - ユーザー名
  - ハンドル（@で始まる、クリックで表示/非表示切り替え）

- **統計グリッド**（3列）:
  - 作品数
  - 視聴週（totalRewatchCount）
  - 平均評価

#### 下部セクション（最推し作品）
- 最推し作品（最大5件表示）
- クリックで編集モーダルを開く

### 機能

#### オタクタイプ編集
- **場所**: DNAカード上のタイプバッジをクリック
- **選択肢**:
  - 自動判定（🤖）
  - プリセットタイプ（10種類）:
    - 🔍 考察厨
    - 😭 感情移入型
    - 🎨 作画厨
    - 🎵 音響派
    - 💕 キャラオタ
    - 🔥 熱血派
    - 🎬 ストーリー重視
    - 🌸 日常系好き
    - ⚔️ バトル好き
    - 🎪 エンタメ重視
  - カスタム入力（10文字まで）
- **保存先**: localStorage（`userOtakuType`）

#### 画像保存機能
- **実装**: html2canvasを使用
- **問題点**:
  - oklabカラーを含むスタイルシートを無効化しようとしている
  - 複雑なスタイル再適用処理（500行以上）
  - グラスモーフィズム効果（backdrop-filter）が正しくレンダリングされない可能性
  - 外部スタイルシートを一時的に無効化しているため、Tailwind CSSのスタイルが失われる可能性

#### シェア機能
- QRコード生成
- リンクコピー
- Web Share API（モバイル対応）

---

## 3. StatisticsSection（統計・傾向）

**ファイル**: `app/components/tabs/mypage/StatisticsSection.tsx`

### 表示内容

#### サマリーカード（常時表示、4列）
- 作品数
- 周回数
- 平均評価
- 最多視聴クール

#### 詳細セクション（展開可能）
- あなたの傾向まとめ
- ジャンル分布
- 評価分布
- 視聴ペース
- よく見る制作会社

---

## 4. CollectionSection（コレクション）

**ファイル**: `app/components/tabs/mypage/CollectionSection.tsx`

### 表示内容

#### コレクションカード（3列）
- 推しキャラ（カウント）
- 名言（カウント）
- 主題歌（カウント）

#### 詳細表示（カードクリックで展開）
- **推しキャラ**: カテゴリフィルタ、グリッド表示（最大4件）
- **名言**: 検索・フィルタ機能、リスト表示（最大3件）
- **主題歌**: MusicTabコンポーネントを表示

---

## 5. SettingsSection（設定）

**ファイル**: `app/components/tabs/mypage/SettingsSection.tsx`

### 表示内容
- プロフィール編集（ボタン → SettingsModalを開く）
- ご意見・ご感想（外部リンク）
- ログアウト

---

## 6. SettingsModal（プロフィール編集モーダル）

**ファイル**: `app/components/modals/SettingsModal.tsx`

### 編集可能項目
- **プロフィール画像**: ファイルアップロード（data URL形式で保存）
- **ユーザー名**: テキスト入力
- **@ハンドル**: テキスト入力（英数字・アンダースコアのみ、30文字まで）
- **プロフィール公開設定**: トグルスイッチ
- **自己紹介**: テキストエリア（公開時のみ表示）

### 保存先
- Supabase（`user_profiles`テーブル）
- localStorage（`userName`, `userIcon`）

---

## データフロー

### プロフィール情報の保存場所

1. **Supabase（`user_profiles`テーブル）**:
   - username
   - handle
   - bio
   - is_public

2. **localStorage**:
   - userName
   - userIcon（data URL形式）
   - userOtakuType
   - favoriteAnimeIds

### プロフィール情報の読み込み

**フック**: `app/hooks/useUserProfile.ts`

1. 初期化時にlocalStorageから読み込み
2. ログイン時にSupabaseからプロフィール情報を取得
3. Supabaseの情報でlocalStorageを上書き

---

## 問題点と改善提案

### 1. プロフィール編集が二箇所にある

**現状**:
- **SettingsModal**: プロフィール画像、ユーザー名、ハンドル、公開設定、自己紹介
- **DNAカード上**: オタクタイプのみ

**問題**:
- ユーザーがオタクタイプを編集する場所が分かりにくい
- プロフィール編集の統一感がない

**改善案**:
- オタクタイプの編集をSettingsModalに統合
- または、DNAカード上の編集を維持しつつ、SettingsModalからも編集可能にする（両方から編集可能）

### 2. オタクタイプの設定方法

**現状**:
- DNAカード上のタイプバッジをクリック
- ドロップダウンメニューで選択
- プリセットタイプ or カスタム入力 or 自動判定

**問題**:
- ドロップダウンが画面外にはみ出す可能性
- 外側クリックで閉じる処理は実装済み

**改善案**:
- SettingsModalにオタクタイプ編集セクションを追加
- DNAカード上では表示のみ、編集はSettingsModalから

### 3. 画像保存機能の問題

**現状の問題**:
- html2canvasがoklabカラーをサポートしていない
- グラスモーフィズム効果（backdrop-filter）が正しくレンダリングされない
- 外部スタイルシートを無効化しているため、Tailwind CSSのスタイルが失われる
- 複雑なスタイル再適用処理（500行以上）が保守性を低下させている

**技術的な問題**:
```typescript
// 現在の実装の問題点
1. すべてのスタイルシートを一時的に無効化
2. oklabを含むスタイルを削除
3. 手動でスタイルを再適用（500行以上）
4. それでも正しくレンダリングされない可能性
```

**改善案**:
1. **サーバーサイドレンダリング**: Next.jsのAPI RouteでPuppeteerやPlaywrightを使用
2. **SVG/Canvas直接描画**: html2canvasを使わず、Canvas APIで直接描画
3. **画像生成ライブラリ**: `@vercel/og`や`canvas`を使用してサーバーサイドで生成
4. **簡易版**: グラスモーフィズム効果を無効化した簡易版を提供

### 4. DNAカードの情報

**現状の表示内容**:
- ✅ プロフィール画像
- ✅ ユーザー名
- ✅ ハンドル
- ✅ オタクタイプ
- ✅ 作品数
- ✅ 視聴週
- ✅ 平均評価
- ✅ 最推し作品（最大5件）

**不足している可能性がある情報**:
- 視聴開始時期（最初にアニメを登録した日）
- 最近視聴した作品
- 今期の視聴数
- 総視聴時間（計算可能な場合）

**改善提案**:
- 現状の情報で十分か、ユーザーに確認
- 追加する場合は、カードのレイアウトを調整

---

## データ保存の整合性

### 現在の保存先

| 項目 | Supabase | localStorage | 備考 |
|------|----------|--------------|------|
| username | ✅ | ✅ | Supabaseが優先 |
| handle | ✅ | ❌ | Supabaseのみ |
| bio | ✅ | ❌ | Supabaseのみ |
| is_public | ✅ | ❌ | Supabaseのみ |
| userIcon | ❌ | ✅ | localStorageのみ（data URL） |
| userOtakuType | ❌ | ✅ | localStorageのみ |
| favoriteAnimeIds | ❌ | ✅ | localStorageのみ |

### 問題点

1. **userIcon**: Supabaseに保存されていない
   - 他のデバイスでログインした場合、アイコンが表示されない
   - 解決策: Supabase Storageに画像をアップロードし、URLを保存

2. **userOtakuType**: Supabaseに保存されていない
   - 他のデバイスでログインした場合、設定が失われる
   - 解決策: Supabaseの`user_profiles`テーブルに`otaku_type`カラムを追加

3. **favoriteAnimeIds**: Supabaseに保存されていない
   - 他のデバイスでログインした場合、最推し作品が表示されない
   - 解決策: Supabaseのテーブルに保存（既存の`animes`テーブルに`is_favorite`フラグを追加、または別テーブル）

---

## 推奨される改善

### 優先度: 高

1. **プロフィール編集の統一**
   - SettingsModalにオタクタイプ編集を追加
   - DNAカード上では表示のみ、またはSettingsModalへのリンクを追加

2. **画像保存機能の改善**
   - サーバーサイドレンダリングに移行
   - または、簡易版（グラスモーフィズム効果なし）を提供

3. **データ保存の整合性**
   - userIconをSupabase Storageに保存
   - userOtakuTypeをSupabaseに保存
   - favoriteAnimeIdsをSupabaseに保存

### 優先度: 中

4. **DNAカードの情報追加**
   - ユーザーに確認してから追加

5. **UI/UXの改善**
   - オタクタイプ編集のUIを改善
   - プロフィール編集の導線を明確化

---

## 技術スタック

- **フレームワーク**: Next.js (App Router)
- **UI**: Tailwind CSS
- **状態管理**: React Hooks + localStorage
- **データベース**: Supabase (PostgreSQL)
- **画像生成**: html2canvas（現状、問題あり）



