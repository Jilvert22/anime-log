# 引き継ぎ（2026-07-21 更新）

anime-log の開発引き継ぎ。プロジェクト規約は [CLAUDE.md](../../CLAUDE.md)、DB 手順は [docs/db/README.md](../db/README.md)。
**SEO/パフォーマンス/アナリティクスの詳細な分析・決定・落とし穴は記憶 `anime-log-seo-backlog` に集約**（本 HANDOFF は最新状態＋次の一手）。本番: https://animelog.jp/

## 完了したこと

### このセッション（2026-07-21・P2 完遂）— 7 PR、すべて CI 緑でマージ＋本番検証済み

- **#57 B1b**: トップ/about の title・description をターゲット語に再設計。`title.template`（`%s | アニメログ`）導入＋子ページ（about/privacy/terms/offline/reset-password/profile/share）の手動ブランドサフィックス一括除去（レンダ後 `<title>` は不変・dev 実測）。JSON-LD の WebSite/Organization に `alternateName: ['AnimeLog','アニログ']`（GSC 表記ゆれ実データが根拠）。→ 本番反映確認。
- **#59** not-found OG: profile/share の not-found 分岐に OG/Twitter を明示（ルートのトップ文言継承を遮断）。
- **#58 C1b / #60 / #63**: PWA Service Worker 是正3件（`next.config.ts`）。
  - #58: `buildExcludes: [/\.woff2$/]` で woff2 を install プリキャッシュから除外（本番 sw.js precache woff2 519→0）。
  - #60: woff2 を専用 CacheFirst `fonts` 枠（maxEntries:200/1年）に分離。JS/CSS は SWR `static-assets` に。
  - #63: `fallbacks: { document: '/offline' }` でオフラインフォールバック配線＋死んでいた AniList API キャッシュルール削除。
- **#61 C1c**: オンボーディング起動を `setTimeout(1500)` → `requestIdleCallback(timeout:2500)` 化（非対応環境は setTimeout フォールバック）。
- **#62 D2**: Vercel Speed Insights 導入＋テレメトリ（Analytics/Speed Insights）の `url` username を `beforeSend` でマスク（`app/lib/analytics/maskPath.ts` の `maskVercelUrl`）。

### 前セッション（P1・2026-07-20〜21、本番検証済み）
GA4 開示のみ導入（#55・username マスク・GA collect 漏洩ゼロ確認）、SEO 技術改善（#49-54: about OGP、noindex 是正、H1 モバイル復活、sitemap、BreadcrumbList＋可視パンくず、フォント preload 無効化で **本番 LCP 26.8s→4.6s / Perf 67→80 / ページ 5.2MB→680KB**）。

**恒久セットアップ（保持情報）**:
- GSC CLI: ADC ＋ quota project `animelog-seo`（API 呼び出しに `-H "x-goog-user-project: animelog-seo"` 必須）。
- GA4: 測定 ID `G-2QH29QKPPC`（プロパティ 546220826・水族館マップ 545903057 とは別）。Vercel env `NEXT_PUBLIC_GA_MEASUREMENT_ID`（Production のみ）。GA 管理画面の「ブラウザ履歴イベントに基づくページ変更」OFF 済。

稼働中のガードレール: CI 4段ゲート、**警告ラチェット136**、`from('animes')` 直呼び禁止、no-alert、husky。
作業体制: 記憶 `anime-log-orchestration-style`（司令塔＝メイン / 実装＝Sonnet サブエージェント / Codex レビュー定期挿入）。

## 途中のこと（再開ポイント）

**なし**（作業ツリークリーン・main 全マージ・全ゲート緑）。下記 P1 はフィールドデータ待ちの検証タスク。

## 直近の決定と理由

- **C1c は「非回帰の部分改善」**: Codex 指摘のとおり `requestIdleCallback` は CPU アイドル発火で「コンテンツ描画済み」を保証しない（本アプリは `useAnimeData` のクライアント取得＝ネットワークバウンド）。**LCP 改善効果は実測で裏取りが必要**。
- **Vercel テレメトリの url マスクは Analytics も同時に実施**: Speed Insights の `route` はマスクされるが `url` フィールドは username 生パスを送る。同じ Vercel 宛の同一データを片方だけ塞いでも無意味なため両方（GA4 と同じ PII 方針）。
- **D2 の `overrides: { vite: "^7.0.0" }`**: `@vercel/*` の任意 peer `@sveltejs/kit`（Svelte 未使用）経由で npm が vite@8 を投機解決して ERESOLVE するのを遮断。`--legacy-peer-deps` は lock を破壊するため不採用。
- **AniList API キャッシュルールは「直さず削除」**: GraphQL は POST で workbox の GET 既定ルールに元々非マッチ＝死に設定。POST を URL キャッシュすると別クエリ結果を取り違えるため。
- **SEO の天井は構造的に低い**（保持）: 「作品別ページを作らない」決定＋GSC 実データ（流入はブランド語のみ）より、現実的な打ち手は技術ポリッシュ＋パフォーマンス＋アナリティクス基盤。派手な順位改善は見込みにくい。
- **E1（季節一覧）は保留**（保持）: 非ブランド流入の唯一のレバーだが AniList 焼き直し＋画像著作権の再評価が要る。GSC の伸びを見てから再判断。

## 次にやること（P1→P3）

### P1: C1c の LCP 効果検証（フィールドデータ）
- **Vercel Speed Insights ダッシュボード**（#62 で計測開始・数日蓄積後）でモバイル LCP を確認。ベースは C1 で 4.6s、LCP 要素はオンボーディングのコーチマーク吹き出し。
- 改善が乏しければ **C1c-2**: オンボ起動を `useAnimeData` の初回読込完了シグナル or `window` `load` イベントに紐付ける。対象: [app/hooks/useOnboardingNavigation.ts](../../app/hooks/useOnboardingNavigation.ts)、[app/hooks/useAnimeData.ts](../../app/hooks/useAnimeData.ts)。

### P2: 小粒バックログ（1 PR ずつ）
- **`<select>` + `Number(e.target.value)` バグ**（未着手・実バグ）: ログイン時に UUID 作品をプルダウンで選ぶと `Number()` で NaN 化。対象: `SongModal` / `AddCharacterModal` / `AddQuoteModal`。値を string のまま `a.id` と比較（`AnimeId = string | number` は対応済み）。
- **runtimeCaching 最終 fallback の `credentials:'include'`** が任意外部オリジンに広すぎる（Codex 指摘・[next.config.ts](../../next.config.ts)）。
- **②ガイド記事**: 「アニメ視聴記録のつけ方」等の自作読み物（著作権リスクなし・情報クエリの受け皿）。
- **E1 季節一覧**: 上記「保留」参照。

### P3: UI 整え（要 mock 3案承認 → mock-comparison スキル）
記憶 `anime-log-ui-polish-backlog` / `anime-log-share-card-backlog` / `anime-log-about-improvement-backlog`。保存/シェアボタンの色不揃い、シェアカードの SNS 向けアスペクト、/about ブラッシュアップ。

## 落とし穴・注意

- **本番デプロイの伝播ラグ**: main マージ→Vercel 本番デプロイは数分＋edge キャッシュ（`x-vercel-cache: HIT`）。curl は `?cb=$RANDOM` でキャッシュバスターを付け origin 直で確認。ブラウザは古い版を掴みやすい。sw.js の反映確認も同様。
- **next-pwa の `fallbacks` は全 runtimeCaching に `options` を要求**: options 無しのルール（NetworkOnly 等）があると build が `Cannot read properties of undefined (reading 'precacheFallback')` で落ちる。`options: {}` を補う。
- **オフライン遷移は2段階**（App Router 仕様）: アプリ内 `<Link>` は RSC フェッチ失敗→フルページ再遷移→/offline。最終的に表示されるがコンソールエラー＋若干遅延（設定不備ではない）。
- **PSI（Lighthouse）CLI 計測はこの環境から不可**: `pagespeedonline`/`serviceusage` API が `animelog-seo` で未有効・gcloud 標準認証失効で有効化不可。必要なら人間がコンソールで有効化、または PSI Web UI で確認。パフォーマンスは本番マージ後に animelog.jp で実測（**Vercel プレビューは Deployment Protection で認証ゲート**され計測不可）。
- **GSC データ取得**: ADC トークンは失効し得る。失効時はユーザーが `gcloud auth application-default login --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform` を再実行。取得は `curl -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" -H "x-goog-user-project: animelog-seo" "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fanimelog.jp%2F/searchAnalytics/query" -d @query.json`。
- **GA4/テレメトリのマスク原則**: `send_page_view:false` は自動 page_view しか止めない。session_start 等は config 時点の page_location を継承するため、GA は gtag config/set レベルでマスク（`GoogleAnalytics.tsx`）、Vercel は `beforeSend` の `maskVercelUrl`（`maskPath.ts`）でマスク。GraphQL/絶対URL/相対 pathname の両形式に注意。
- **サブエージェント並行時の共有ツリー競合**: 実装/検証エージェントが `git checkout` でブランチを切り替えると、司令塔が dev サーバー（HMR）検証中に別ブランチ内容に化ける。dev 検証中は他エージェントにツリーを触らせない／並行実装は `isolation: "worktree"`。Codex レビューは作業ツリー非依存に `git diff origin/<branch>...` で対象を明示。
- **警告ラチェット136** / **main 直 push 禁止（PR 経由）** / **スタック PR 回避**（先行マージ後に main へリベース。同一ファイル連続変更は特に注意）/ **新規 md はルート禁止**（`docs/` 配下・フックがブロック）/ **`.env*` は読まない・コミットしない** / **`public/sw.js` は gitignore 済み生成物**。
- **DB の破壊的操作は人間**: 自動許可分類器がブロック。SQL は用意し、実行は人間がターミナルで。
- **CI↔Supabase**: 無料枠は約7日 idle で pause → E2E が `ERR_NAME_NOT_RESOLVED`。keepalive で回避中だが、落ちたらダッシュボードで再開→数分待って再実行。
- **husky**: コミット時に staged が自動整形（lint-staged: eslint --fix / prettier）。`--no-verify` で無効化しない。
