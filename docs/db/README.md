# DB マイグレーション運用ガイド

anime-log の Supabase データベースのスキーマ変更・マイグレーションの手順書。
**2026-09-07時点、Supabase CLIからリンク済み本番DBへ接続・適用できる。本番変更は所有者の依頼・承認範囲で実行する。以前の「このリポジトリから本番DBに触れない」「人間が実行する」は当時の運用・接続状態の説明で、現在のCLI能力を示す制限ではない。**

## ディレクトリ構成

| 場所 | 内容 |
|---|---|
| `supabase/config.toml` | Supabase CLI の設定 (project_id = anime-log) |
| `supabase/migrations/` | CLI 管理のマイグレーション。`supabase db pull` で本番から生成した baseline と、以降の変更が入る |
| `docs/db/legacy/` | 2026-07 の CLI 導入前に手動適用してきた SQL 20本の履歴 (適用済み・再実行しない) |
| `docs/db/migrations-pending/` | まだ本番に適用していない SQL (UNIQUE 制約追加など) |

## 初回セットアップ (CLI 導入)

```bash
# 1. Supabase にログイン (ブラウザが開く)
npx supabase login

# 2. 本番プロジェクトにリンク (ダッシュボードの Project ref と DB パスワードが必要)
npx supabase link --project-ref <your-project-ref>

# 3. 本番スキーマを baseline として取り込む
#    → supabase/migrations/<ts>_remote_schema.sql が生成される。
#    これで「animes の CREATE TABLE がリポジトリに無い」問題が解消する。
npx supabase db pull
```

以降、ローカルの `supabase/migrations/` が本番スキーマの正となる。

## 通常のスキーマ変更フロー

```bash
# 新しいマイグレーションを作成
npx supabase migration new <説明>
# → supabase/migrations/<ts>_<説明>.sql を編集して SQL を書く

# 本番へ適用
npx supabase db push
```

## UNIQUE 制約 + CHECK 制約 (2026-07-04 適用済み)

`animes` / `watchlist` に `(user_id, anilist_id)` の重複を許す穴があったため、
DB レベルの UNIQUE 制約と基本的な CHECK 制約を追加した。
正本は [`supabase/migrations/20260704111811_add_unique_and_check_constraints.sql`](../../supabase/migrations/20260704111811_add_unique_and_check_constraints.sql)。

適用時の記録:
1. **重複チェック** — [`legacy/01_check_duplicates.sql`](legacy/01_check_duplicates.sql) を実行 →
   `animes` で `anilist_id=16498` (進撃の巨人) が同一ユーザーに **56 件**重複を検出
   (E2E 追加テストの後始末漏れの蓄積とみられる。reviews 紐づきは 0 件)。
2. **重複修復** — [`legacy/02_repair_duplicates.sql`](legacy/02_repair_duplicates.sql) のロジックで
   最古 1 件を残して **55 件削除**。`reviews` の CASCADE 消失なし、`watchlist` は重複ゼロで削除なし。
3. **制約追加** — 上記マイグレーションで UNIQUE インデックス 2 本 + CHECK 制約 3 本を適用。
   事前確認 (空タイトル / 負の周回数) は全て 0 件を確認済み。

### 適用手順で踏んだ罠 (次回の教訓)
- `supabase db pull` は shadow DB に **Docker Desktop が必須**。未起動だと失敗する。
  baseline 取り込みは Docker 起動後に別途行う (制約適用自体には不要)。
- `supabase db push` が既存スキーマを CLI 管理外と見て **「Remote database is up to date」と誤判定**し、
  SQL を適用しないことがある。その場合は
  `supabase db query --linked --file <migration>` で直接適用し、
  `supabase migration repair --status applied <version>` で履歴に記録する
  (これをしないと次回 push でマイグレーションが再実行され、`ADD CONSTRAINT` が重複エラーで落ちる)。
- 破壊的 DDL/DML は Claude Code の自動許可分類器がブロックするため、人間がターミナルで実行した。

## 制約追加後のアプリ挙動

制約を追加すると、同じ作品を二重登録しようとした際に PostgreSQL が
エラーコード **23505 (unique_violation)** を返す。アプリ側はこれを
`DuplicateAnimeError` に変換し、「すでに追加済みです」の確認ダイアログを出す
(`app/lib/api/animes.ts` / `app/lib/api/errors.ts`)。制約適用前は従来通り
重複登録できる (コードは前後どちらでも壊れない)。


## 2026-09-07: 話数保存・記録取り込み（CLI適用済み）

所有者の「SQLはあなたの方でCLIでできない？」という依頼に基づき、エージェントがCLIで適用した。対象はリンク先 `anime-log` (`fskcfnjyyanvzjzsqeju`)。環境変数ファイルやDBパスワードを読み出さず、CLIの認証を利用。

- `20260907000000_watchlist_progress.sql`
- `20260907000100_record_import.sql`

事前に実列型・RLS・一意制約・履歴を確認。`animes.streaming_sites` が `jsonb` である点をSQLとローカル試験へ反映し、取り込み行の `is_public` を明示的にfalseにした。公開プロフィールへの概要表示は既存ビューの公開設定に従う。

`supabase db query --linked --file` で2件を一つのトランザクションにまとめ、同じトランザクションで `supabase_migrations.schema_migrations` にversion/name/statementsを登録。lock_timeout=5s、statement_timeout=60sを設定し、スキーマキャッシュの再読み込みも通知した。適用後に4列、2インデックス、CHECK制約、関数のSECURITY INVOKER、authenticated実行可・anon実行不可、履歴2件を確認した。既存視聴記録の削除・更新は行っていない。

CLIの `--version` も管理用telemetryファイルへ書き込みを行うため、ファイルシステム制限下では権限付き実行が必要だった。これは承認拒否ではなくサンドボックスの書き込み制限だった。


## 2026-09-07: 通報・ブロック（CLI適用済み）

`20260907000200_moderation.sql` を同じ依頼範囲でCLI適用した。ローカルの権限・非表示・復元・送信上限・同時操作テストと本番のメタデータ照合後、DDLと履歴登録を1トランザクションで実行。lock_timeout=5s、statement_timeout=60s、PostgREST再読込を使用。

4テーブルのRLS、追加制限ポリシー7件、フォローの同時操作を保護するトリガー、公開ビュー、運営RPCの一般ユーザー実行不可、通報の非公開権限を適用後に確認。実ユーザーへの通報・ブロック・フォロー解除・投稿非表示は実施していない。[運営手順と監査資料](../MODERATION_REVIEW.md)を参照。


## 2026-09-07: アカウント削除連鎖（CLI適用済み）

`20260907000300_account_deletion_cascade.sql`。animes、followsの双方、notification_settingsの所有者とwatchlist参照、旧profiles、push_subscriptionsの外部キー7件にON DELETE CASCADEを設定。Auth削除時に関連データを一括削除できるようにした。ローカルの削除・ロールバック試験後、DDLと履歴を1トランザクションで適用。既存データの削除は実施していない。[修正と検証](../ACCOUNT_DELETION_REVIEW.md)を参照。

## 2026-09-07: 感想投稿直後の取得（CLI適用済み）

`20260907000400_moderation_review_returning.sql` を、所有者から旧AGENTSの人間適用記載より優先する明示的な許可を受けて本番へ適用した。`moderation_reviews_read` の本人判定を現在行の `user_id = auth.uid()` で行い、INSERT/UPDATE RETURNINGとの互換性を保つ。STABLE関数内で新規行を再検索することによる拒否を防ぐ。他者の表示条件は維持する。

適用後にポリシー式、version=20260907000400の履歴、INSERTの本人限定チェックが維持されていることを確認。ローカルでは補正前の再現失敗、補正後の投稿・更新取得と既存の権限・同時操作テストが成功。CIは補正後の本番DBを使って再検証する。
