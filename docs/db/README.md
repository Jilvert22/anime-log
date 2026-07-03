# DB マイグレーション運用ガイド

anime-log の Supabase データベースのスキーマ変更・マイグレーションの手順書。
**このリポジトリからは本番 DB に触れないため、スキーマ変更は下記の手順に沿って人間が実行する。**

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

## UNIQUE 制約の追加 (2026-07 の保留作業)

`animes` / `watchlist` に `(user_id, anilist_id)` の重複を許す穴があるため、
DB レベルの UNIQUE 制約を追加する。**必ず順番に実行すること。**

1. **重複チェック** — `docs/db/migrations-pending/01_check_duplicates.sql` を
   Dashboard の SQL Editor で実行。**0 行なら手順3へ、1行でもあれば手順2へ。**

2. **重複修復** — `02_repair_duplicates.sql` を実行。
   - 末尾は安全のため `ROLLBACK;` になっている。まず実行して削除件数を確認し、
     問題なければ `ROLLBACK;` を `COMMIT;` に変えて再実行する。
   - ⚠️ `animes` 削除は `reviews` を CASCADE 削除する。⚠️ `watchlist` 削除は
     `notification_settings` が参照していると FK 違反になる (現状 ON DELETE 未設定)。
     ファイル内コメント参照。

3. **制約追加** — `03_add_unique_constraints.sql` を CLI マイグレーション化して push:
   ```bash
   npx supabase migration new add_unique_constraints
   # 生成ファイルに 03 の本文を貼り付け
   npx supabase db push
   ```
   (Dashboard で直接実行してもよい)

4. **(任意) CHECK 制約** — `04_optional_check_constraints.sql`。事前確認クエリが
   全て 0 件のときのみ追加。

5. 適用が終わったら `migrations-pending/` の該当ファイルを `legacy/` へ移すか削除する。

## 制約追加後のアプリ挙動

制約を追加すると、同じ作品を二重登録しようとした際に PostgreSQL が
エラーコード **23505 (unique_violation)** を返す。アプリ側はこれを
`DuplicateAnimeError` に変換し、「すでに追加済みです」の確認ダイアログを出す
(`app/lib/api/animes.ts` / `app/lib/api/errors.ts`)。制約適用前は従来通り
重複登録できる (コードは前後どちらでも壊れない)。
