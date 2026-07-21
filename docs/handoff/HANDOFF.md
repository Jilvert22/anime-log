# 引き継ぎ（2026-07-21）

anime-log の開発引き継ぎ。プロジェクト規約は [CLAUDE.md](../../CLAUDE.md)、DB 手順は [docs/db/README.md](../db/README.md)。
SEO の詳細な分析結果・決定・落とし穴は記憶 `anime-log-seo-backlog` に集約。本番: https://animelog.jp/

## 完了したこと（このセッション: 2026-07-20〜21、すべて CI 緑でマージ＆本番検証済み）

**P1「SEO 分析＋対策＋アナリティクス連携」の主要部を完遂。7 PR をマージ。**

- #49 A1: `/about` の OGP 画像欠落修正＋ブランド表記統一
- #50 A2: `/offline`・`/reset-password`・`/share` not-found を noindex 化＋canonical 是正
- #51 B1a: サイト唯一の H1 をモバイルでも DOM に残す（`sr-only`。Codex 発見のバグ。ブランド順位の土台）
- #52 B1c: sitemap の lastmod 正確化＋空プロフィール除外
- #53 A3: BreadcrumbList JSON-LD ＋ **可視パンくず**（`app/components/seo/Breadcrumb.tsx`、可視 UI と JSON-LD を同一 items で出力）
- #54 C1: フォント preload 無効化 → **本番 LCP 26.8s→4.6s / Perf 67→80 / ページ 5.2MB→680KB**（`M_PLUS_Rounded_1c` を `preload:false`）
- #55 D1: **GA4 導入（開示のみ・同意バナー無し・username マスク）** → 本番実測で GA collect に username 漏洩ゼロを確認

**GA インフラ（恒久セットアップ済み）**:
- GSC CLI: ADC（`gcloud auth application-default login --scopes=...webmasters.readonly...`）＋ quota project は新規作成した GCP プロジェクト **`animelog-seo`**。API 呼び出しは `-H "x-goog-user-project: animelog-seo"` 必須。
- GA4: 測定 ID `G-2QH29QKPPC`（プロパティ **546220826**。※水族館マップ 545903057 とは別物）。Vercel 環境変数 `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-2QH29QKPPC`（Production のみ）追加済。GA 管理画面の拡張計測「ブラウザ履歴イベントに基づくページ変更」OFF 済（マスク前 URL の自動送信を停止）。

稼働中のガードレール: CI 4段ゲート、**警告ラチェット136**、`from('animes')` 直呼び禁止、no-alert、husky。
作業体制の記憶: `anime-log-orchestration-style`（司令塔＝メイン / 実装＝Sonnet サブエージェント / Codex レビュー定期挿入）。

## 途中のこと（再開ポイント）

なし（作業ツリーはクリーン、main は全マージ済み・全ゲート緑）。以下はすべて新規着手タスク。

## 直近の決定と理由

- **SEO の天井は構造的に低い**: `docs/ops/SEO_NOTES.md` の「作品別ページを作らない」決定＋GSC 実データ（流入はブランド語のみ・月13表示程度）より、現実的な打ち手は「技術ポリッシュ＋ブランド語で1位＋パフォーマンス＋アナリティクス基盤」。派手な順位改善は見込みにくい（正直に）。
- **E1（季節一覧ページ）は保留**: 非ブランド流入の唯一のレバーだが AniList 焼き直し＋画像著作権の再評価が必要。ユーザーは一度「作る」を選んだ後、他手段（既存ページ最適化・自作ガイド記事）も俎上に上がり保留中。GSC の伸びを見てから再判断。
- **GA4 = 開示のみ・バナー無し・username マスク**: 日本語国内向けなので電気通信事業法・外部送信規律は公表で足りる想定。ただし username は Google 公式ポリシー上 GA 送信禁止の PII のため、page_path/page_location/page_title/referrer を gtag の**設定コンテキストレベル**でマスク（`app/lib/analytics/maskPath.ts`）。

## 次にやること（P2、優先度順・すべてバックログ）

### P2-a: 能動的 SEO の締め
- **B1b**: トップ/`app/about/page.tsx` の title/description をターゲット語に再設計（承認済み案=「アニメログ - 見たアニメをクール別に記録できる視聴管理アプリ」）＋ `title.template: '%s | アニメログ'` 導入。**template 導入時は全子ページ（about/profile/share）の手動ブランドサフィックスを一括除去**しないと二重ブランド化する（Codex 指摘）。JSON-LD WebSite に `alternateName`（アニログ/animelog）も。

### P2-b: パフォーマンス／アナリティクス フォロー
- **D2**: Vercel Speed Insights（`@vercel/speed-insights`）追加（小）。
- **C1c**: オンボーディング起動（`app/hooks/useOnboardingNavigation.ts` の 1500ms タイマー）を `requestIdleCallback` 化 → LCP 4.6s→<2.5s の「良好」域へ。LCP 要素はコーチマーク吹き出し。
- **C1b**: `next.config.ts` の next-pwa に `buildExcludes: [/\.woff2$/]` 等を追加。SW が依然フォント371ファイル（4.8MB）をプリキャッシュしている（Codex 指摘・再訪帯域削減）。
- **Vercel Analytics のマスク**: `<Analytics />` も `/profile/[username]` を未マスク送信（Codex 指摘）。GA と同基準なら別 PR で対応。

### P2-c: コンテンツ／デザイン（要相談・要 mock）
- **②ガイド記事**: 「アニメ視聴記録のつけ方」等の自作読み物（著作権リスクなし・情報クエリの受け皿）。
- **/about ブラッシュアップ**: 記憶 `anime-log-about-improvement-backlog`（上位モデル＋他プロジェクト知見・要 mock 3案）。
- **E1 季節一覧**: 上記「保留」参照。
- **P2 別件**: `<select>`+`Number()` バグ（SongModal/AddCharacterModal/AddQuoteModal。UUID 作品が選べない。旧 HANDOFF の P2）。

## 落とし穴・注意

- **GSC データ取得**: ADC トークンは失効し得る。失効時はユーザーが `gcloud auth application-default login --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform` を再実行。取得は `curl -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H "x-goog-user-project: animelog-seo" "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fanimelog.jp%2F/searchAnalytics/query" -d @query.json`。
- **GA4 マスクの原則**: `send_page_view:false` は自動 page_view しか止めない。session_start 等は config 時点の page_location を継承するため、**マスクは gtag config/set レベルで**行う（`GoogleAnalytics.tsx` 参照）。GA 管理画面「履歴イベント」OFF とセット。
- **サブエージェント並行時の共有ツリー競合**: 実装/検証エージェントが `git checkout` でブランチを切り替えると、司令塔が dev サーバー（HMR）で検証中に別ブランチ内容に化ける。dev 検証中は他エージェントにツリーを触らせない／build 系は `isolation: "worktree"`。
- **警告ラチェット136** / **main 直 push 禁止（PR 経由）** / **スタック PR 回避**（先行マージ後に main へリベース）/ **新規 md はルート禁止**（`docs/` 配下）/ **`.env*` は読まない・コミットしない**。
- **Vercel プレビューは Deployment Protection で認証ゲート**（Lighthouse 等は 401/SSO ページを踏む）。パフォーマンス検証は本番マージ後に animelog.jp で実測する。
