# SEO / AIEO 運用メモ（アニメログ）

このプロジェクトのSEO土台と、Google Search Console（GSC）の設定手順。

## 方針（なぜ作品別ページを作らないか）

アニメログは **Next.js SSR**（`generateMetadata`でOG/canonicalをサーバ生成、本文もクローラが読める）。
水族館マップのようなハッシュSPAではないため「作品別の静的ページ生成」は不要。
作品情報はAniList由来＝焼き直しで薄く、画像は著作権リスク、独自データ（視聴記録）は非公開RLS＋ユーザーほぼゼロ。
→ **作品別ページの大量生成はしない**。アプリ自体を検索/AIに正しく理解させる土台＋将来の公開UGC受け皿を整える。

## 実装済みのSEO土台（PR1）

- **JSON-LD**（`app/lib/seo/structuredData.ts` → `app/components/seo/JsonLd.tsx`、`layout.tsx`で全ページ出力）
  - WebSite / Organization / SoftwareApplication。**架空のrating/reviewは入れない**。
- **/about**: 可視FAQ + FAQPage JSON-LD（`app/lib/seo/aboutFaq.ts`で可視内容と一致）。
- **sitemap**（`app/sitemap.ts`）: `/`, `/about`, `/privacy`, `/terms`。公開プロフィールはPR4で追加予定。
- **canonical**: `layout.tsx`（`/`）, `/about`, `/privacy`, `/terms`。
- **robots**（`app/robots.ts`）: 全許可 + sitemap参照。

## Google Search Console セットアップ手順

### 1. プロパティ追加
1. https://search.google.com/search-console を開く。
2. 「プロパティを追加」→ **URL プレフィックス** を選び `https://animelog.jp` を入力。

### 2. 所有権の確認（HTMLタグ方式・推奨）
1. 確認方法で「HTMLタグ」を選ぶと `<meta name="google-site-verification" content="XXXXXXXX" />` が表示される。
2. `content` の値（トークン）をコピー。
3. **Vercel** → プロジェクト → Settings → Environment Variables に追加:
   - Name: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
   - Value: コピーしたトークン
   - Environment: Production（必要ならPreviewも）
4. 再デプロイ（環境変数反映のため）。`layout.tsx` がこの値を読んで `<meta name="google-site-verification">` を出力する。
5. デプロイ後、本番HTMLにタグが出ているか確認:
   ```
   curl -s https://animelog.jp/ | grep google-site-verification
   ```
6. GSCで「確認」をクリック。

#### 代替: HTMLファイル方式
GSCが提示する `google<token>.html` を `public/` 直下に置くと `https://animelog.jp/google<token>.html` で配信される。env方式とどちらか一方でよい。

### 3. サイトマップ送信
1. GSC左メニュー「サイトマップ」。
2. `sitemap.xml` を入力して送信（`https://animelog.jp/sitemap.xml`）。
3. ステータスが「成功しました」になればOK。インデックスは数日〜数週間。

## 検証チェックリスト
- `curl -s https://animelog.jp/ | grep -o 'application/ld+json'` でJSON-LDが出る。
- [Rich Results Test](https://search.google.com/test/rich-results) に `https://animelog.jp/about` を入れFAQが認識される。
- `https://animelog.jp/sitemap.xml` が4URL返す。
- GSCの「URL検査」でレンダリング済みHTMLにJSON-LD/canonicalがある。

## 既知の非ブロッカー
- `SoftwareApplication` は rich result 要件の `aggregateRating` を持たない（捏造しない方針）。GSCで非criticalな「推奨フィールド不足」警告が出る場合があるが、ペナルティではない。
- `reset-password` / `offline` は `/` canonical を継承（utilityページ。必要なら個別に `noindex` を付ける）。

## 後続PR（予定）
- **PR3**: `animes`/`reviews` に `anilist_id` 追加（将来の作品別感想集約の受け皿。ページ本体は作らない）。Supabaseマイグレ要。
- **PR4**: 公開プロフィールのSSR化（作者の実ログを独自コンテンツに）+ `public_animes` ビュー + profile canonical/noindex + sitemap動的追加。Supabaseマイグレ要。
