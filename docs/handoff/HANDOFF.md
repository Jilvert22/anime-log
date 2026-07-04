# 引き継ぎ（2026-07-04）

anime-log の「完全リファクタリング + 開発ハーネス構築」プロジェクトの引き継ぎ。
プロジェクト規約は [CLAUDE.md](../../CLAUDE.md)、DB 手順は [docs/db/README.md](../db/README.md) を参照。

## 完了したこと（全7フェーズ・PR #22〜#33、すべて CI 緑でマージ済み）

- **リファクタ**: API 重複統合(#24)、animes データアクセス層 `app/lib/api/animes.ts` 集約 +
  `from('animes')` 直呼び禁止の ESLint ガード(#25,#26、直呼び 0 箇所)、
  alert→toast 統一(#27)、取得失敗→ErrorState+再試行(#28)、巨大コンポーネント2分割(#29)
- **ハーネス**: 壊れた lint ゲート修理 + Prettier(#22)、特性テスト(#23)、
  CLAUDE.md 刷新 + ルート md 45本を docs/ へ整理(#31)、husky/lint-staged + Claude Code フック(#32)
- **DB**: UNIQUE 制約の SQL + 手順書を用意、Supabase CLI 導入(#30)。**適用は未実施**(下記 P2)
- **運用**: Supabase 自動停止を防ぐ keepalive ワークフロー(#33、手動実行で 200 応答を確認済み)

稼働中のガードレール: CI 4段ゲート、警告ラチェット137、from('animes')禁止、no-alert、
husky pre-commit(自動整形)/pre-push(型)。

## 途中のこと（再開ポイント）

- ~~**DB UNIQUE 制約は SQL を用意しただけで本番未適用**~~ → **2026-07-04 適用完了**。
  UNIQUE 2本 + CHECK 3本を [`supabase/migrations/20260704111811_add_unique_and_check_constraints.sql`](../../supabase/migrations/20260704111811_add_unique_and_check_constraints.sql)
  で本番に適用。適用前に animes の重複 55 件(進撃の巨人)を除去済み。詳細は [docs/db/README.md](../db/README.md)。
  残: `supabase db pull` による baseline 取り込みは Docker 未起動で保留(制約適用には不要)。
- **E2E 3本が未着手**。別タスク `task_11bc8011` として切り出し済み。→ P3

## 直近の決定と理由

- DB 制約の適用は「AI は本番 DB に触れない」ため、SQL + 手順書を用意し**人間が実行**する分担にした。
- E2E は実アプリでの検証が必須(セレクタ調整が要る)で、未検証のまま入れると CI を壊すため、
  このセッションでは書かず別タスクに切り出した。
- 巨大コンポーネントの完全分割(各<400行)は UI テストが薄くリスクが高いため見送り、
  「新規は300行目安・触るときに分割」を CLAUDE.md に明記して運用ルール化した。

## 次にやること（P1→P4）

- ~~**P1: Supabase の稼働確認**~~ ✅ 完了（2026-07-04）。project ref `fskcfnjyyanvzjzsqeju` は
  `ACTIVE_HEALTHY`。keepalive も 07:50 UTC に成功。Restore 不要。

- ~~**P2: DB UNIQUE 制約の適用**~~ ✅ 完了（2026-07-04）。UNIQUE 2本 + CHECK 3本を適用。
  同じ作品の二重登録で `DuplicateAnimeError`→確認ダイアログが有効になった。
  詳細・踏んだ罠は [docs/db/README.md](../db/README.md)。
  残タスク: `supabase db pull`（baseline 取り込み、「animes の CREATE TABLE がリポジトリに無い」問題の解消）は
  **Docker Desktop 起動が前提**で今回保留。制約適用には不要なので優先度は低い。

- **P3: E2E 3本の追加**（`task_11bc8011` のチップから専用セッション推奨）
  積み→視聴済み移動 / 評価・レビュー投稿 / シーズン終了処理。既存 `tests/anime.spec.ts` を踏襲し、
  **ローカルで `npx playwright test` を通してから**コミットする。

- **P4（任意）: 権限プロンプト削減**
  `.claude/settings.json` に `permissions.allow`（npm run test/lint 等）を追加すると作業が速くなる。
  AI が自分で追加するのは安全上ブロックされるため、`/permissions` か手動で。

## 落とし穴・注意

- **警告ラチェットは緩めない**: `package.json` の `--max-warnings 137`。減らしたら数値も下げる。
- **新規 md はルートに置かない**: Claude Code フック(`.claude/hooks/block-root-md.sh`)がブロックする。docs/ 配下へ。
- **husky が入っている**: コミット時に staged ファイルが自動整形される。`--no-verify` で無効化しないこと。
- **`.env*` は読まない・コミットしない**（`.env.test` にテストユーザー情報がある）。
- **repair SQL は破壊的**: `animes` 削除は reviews を CASCADE 削除、`watchlist` 削除は
  notification_settings の FK(ON DELETE 未設定)に注意。ファイル内コメント参照。
