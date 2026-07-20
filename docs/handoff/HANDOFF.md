# 引き継ぎ（2026-07-05）

anime-log の開発引き継ぎ。プロジェクト規約は [CLAUDE.md](../../CLAUDE.md)、DB 手順は [docs/db/README.md](../db/README.md)、
E2E の詰まりどころは記憶 `anime-log-e2e-harness-gotchas` を参照。本番: https://animelog.jp/

## 完了したこと（このセッション: 2026-07-05、すべて CI 緑でマージ済み）

- **P-DEBT「作品 id の型の嘘」+ insert 戻り値未反映を 6 PR で全解消**:
  - #39 `AnimeId = string | number` に正直化（実体は二重: ログイン時=Supabase UUID 文字列 / 未ログイン時=localStorage 合成 number）
  - #42 検索追加（useSeasonSearch）直後の感想投稿失敗を修正
  - #43 AniList 詳細取得を `id<1000000` → `anilistId` 有無ベースに（ログイン時に公式リンク復活）
  - #44 一括登録（AddAnimeFormModal 2経路）の実 UUID 反映
  - #45 視聴済み移動（WatchlistTab 単一/一括・SeasonWatchlistTab）の実 UUID 反映 + 一括の蓄積バグ修正。**警告ラチェット 137→136 に締めた**
  - #46 読み取り系 npm スクリプトを `.claude/settings.json` の allowlist に追加（P4）
- insert 戻り値の実 UUID 反映は**全経路（シーズン検索・一括登録・視聴済み移動）で解消済み**。
- 詳細は記憶 `anime-log-animeid-type-debt` に集約。

過去プロジェクト（完全リファクタ+ハーネス #22〜#33、DB制約 #35、E2E 3本 #36、レビュー表示バグ #37）は完了済み。
稼働中のガードレール: CI 4段ゲート、**警告ラチェット136**、`from('animes')` 直呼び禁止、no-alert、husky。

## 途中のこと（再開ポイント）

なし（作業ツリーはクリーン、main は全マージ済み・全ゲート緑）。以下はすべて新規着手タスク。

## 次にやること（P1→P3、+ バックログ）

### P1: SEO 分析と対策（ユーザー希望の主タスク）

現状は Google Search Console で「アニメログ」ブランドクエリでしか流入がない（記憶 `anime-log-seo-backlog`）。
**SEO 基盤は既に存在する**ので「棚卸し→強化」が実体。

- **分析フェーズ**:
  1. **既存 SEO 実装の棚卸し**: [`app/robots.ts`](../../app/robots.ts)、[`app/sitemap.ts`](../../app/sitemap.ts)、
     [`app/components/seo/JsonLd.tsx`](../../app/components/seo/JsonLd.tsx)、各ページの `generateMetadata`
     （[`app/layout.tsx`](../../app/layout.tsx)、`app/about/page.tsx`、`app/profile/[username]/page.tsx`、`app/share/[username]/page.tsx`）
     で「何が入っていて何が欠けているか」を洗い出す。
  2. **GSC の現状データ**をユーザーから受け取る（クエリ/表示/クリック/掲載順位。表示回数が伸びないのは index/内容起点の問題か要判断）。
  3. **競合 SEO 構造調査**（Filmarks / Annict 等）: title/description の型、schema.org の使い方、URL 設計、コンテンツ起点ページ。
  4. **パフォーマンス**: 本番 animelog.jp を Lighthouse / Core Web Vitals で計測（PWA/画像/LCP）。
- **対策フェーズ（施策ごとに 1 PR、優先度順）**:
  - title/description をターゲットクエリ（「アニメ 視聴管理」「シーズン別 アニメ 記録」等）に再設計。
  - OGP / JSON-LD 強化（`WebSite` + SearchAction、`WebApplication`、公開プロフィールの `ItemList` / `BreadcrumbList`）。
  - sitemap 拡充（公開プロフィール等の動的ルートを含める）。
  - コンテンツ起点ページ（「今期アニメ一覧」等）・個別作品ページ（ロングテール）の検討。
- 補足: 記憶に出てくる `SEO_NOTES.md`（旧ルート）は #31 のルート整理で撤去済み。新規メモは `docs/` 配下へ。

### P2: `<select>` + `Number(e.target.value)` バグ（小・1 PR）

ログイン時に UUID の作品をプルダウンで選ぶと `Number()` で NaN 化して選べない。
対象: `SongModal` / `AddCharacterModal` / `AddQuoteModal` の作品選択 `<select>`。値を string のまま扱い `a.id` と比較する
（`AnimeId = string | number` は #39 で対応済み）。id クラスタ最後の実バグ。

### P3: UI 整え（要 mock 3案承認）

記憶 `anime-log-ui-polish-backlog` / `anime-log-share-card-backlog` に詳細。デザイン変更なので mock-comparison で承認を取る。
- 「画像を保存」「シェア」ボタンの色不揃い（視聴予定カード: 保存=白/シェア=ピンク）。ピンク=選択中に予約された色。
- **⚠️ 要確認**: ユーザーは「DNAカードから視聴中/視聴予定/継続を消す」と言ったが、そのラベルは**視聴予定カード**（`SeasonWatchlistCard.tsx`）にあり DNAカードには無い。対象カードを確定させる。
- DNA/視聴予定カードのエクスポート画像が `1200×630`（横長）→ SNS 向け（正方形1080²/縦長1080×1350）。

### バックログ（別機会・要相談多め）

reviews テーブルのリポジトリ層化、`AnimeId` string 全面統一（localStorage 移行）、完了ライフサイクル/端末同期/重複マージ、
連続2クール B案（DB 多シーズン化）、Stitch UI 案の実装方向選定。

## 落とし穴・注意

- **警告ラチェットは 136**: `package.json` の `--max-warnings 136`。減らしたら数値も下げる（緩める方向に動かさない）。
- **E2E の「最初のリロード」を安易に外すな**: 共有テストアカウントに対象作品が残存（重複）していると
  insertAnimeRows が 23505 で失敗し合成 id のままになる。リロードは冪等性（DB の実 UUID 読み直し）も兼ねる。#44 で外して CI が2回失敗→復元した。
- **スタック PR を避ける**: squash マージ運用で先行 PR ブランチを `--delete-branch` すると、それを base にした後続 PR が
  CLOSED（reopen 不可）になる。後続は先行マージ後に main へリベースしてから PR を立てる。test.yml は main/develop 宛 PR のみ CI 発火。
- **DB の破壊的操作は人間**: Claude Code の自動許可分類器がブロックする。読み取り確認は AI、実行は人間がターミナルで。
- **新規 md はルートに置かない**: フック `.claude/hooks/block-root-md.sh` がブロック。docs/ 配下へ。
- **husky**: コミット時に staged が自動整形。`--no-verify` で無効化しない。`.env*` は読まない・コミットしない。
- **CI↔Supabase**: 無料枠は約7日 idle で pause → E2E が `ERR_NAME_NOT_RESOLVED`。keepalive で回避中だが、落ちたらダッシュボードで再開→数分待って再実行。
