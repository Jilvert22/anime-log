# アニメログ (anime-log)

Next.js 16 + React 19 + TypeScript + Supabase のアニメ視聴記録 Web アプリ。本番: https://animelog.jp/
詳細背景は [PROJECT.md](PROJECT.md)、リリース手順は [RELEASE_HANDOFF.md](RELEASE_HANDOFF.md)。

## コマンド

- `npm run dev` — 開発サーバー。**`--webpack` 必須**(Turbopack だと next-pwa が動かない)
- `npm run build` — ビルド + push 通知の Service Worker 注入(`scripts/inject-push-notifications.js`)
- `npm run lint` — ESLint。`--max-warnings 137` の**警告バジェット**(後述)
- `npm run type-check` — `tsc --noEmit`
- `npm run test` / `test:run` — Vitest。単一ファイルは `npx vitest run <path>`
- E2E: `npx playwright test`(実 Supabase + `.env.test` のテストユーザーが必要)
- コミット前に最低 `type-check` と `test:run` を通す(husky の pre-commit/pre-push が自動化)

## アーキテクチャの規約(重要・逸脱しない)

- **DB アクセスは必ず `app/lib/api/` のリポジトリ層を経由する。** components/ や hooks/ から
  `supabase.from('animes')` を直接呼ぶことは ESLint(`no-restricted-syntax`)で**禁止**。
  animes は `app/lib/api/animes.ts`、watchlist は `watchlist.ts`。他テーブルも同様に集約する。
- **ユーザー通知は `FeedbackContext` を使う。** `showToast(msg, 'error')` と
  `confirmDialog({...})`。ネイティブ `alert`/`confirm`/`prompt` は ESLint(`no-alert`)で**禁止**。
- **データ層はエラーを throw する。** `app/lib/api/errors.ts` の `SupabaseError`/`ApiError` 系。
  握りつぶして空配列を返すのは検索系(`searchAnime` 等)の**意図的な既存挙動のみ**(0件と通信エラーを同一視)。
- **取得失敗は握りつぶさず UI に出す。** 例: `useAnimeData` は `loadError` を持ち、
  `HomeClient` が `ErrorState`(再試行ボタン)を表示する。
- **型の正はここ**: ドメイン型 `app/types/index.ts`、API型 `app/lib/api/types.ts`、
  AniList 型 `app/lib/api/anilist.ts`(`AniListMedia`)。重複定義を作らない。
- **新規コンポーネントは 300 行を目安に。** 超えたら子コンポーネント/フックへ分割する。
  既存の巨大ファイル(WatchlistTab/SettingsSection 等)は「触るときに分割」でよい。

## ドメイン知識の罠(知らないとバグる)

- `animes.id` は**ローカル合成 ID**(`Math.max(...ids)+1`)。作品の同一性は **`anilist_id`** で判断する。
- 慣習: `id < 1_000_000` なら AniList ID の可能性が高いと見なすコードがある。
- **手動追加**の作品は `animes.anilist_id = NULL` / `watchlist.anilist_id = -1`(センチネル)。
  UNIQUE 制約はこれらを部分インデックスで除外している。
- 連続2クール判定(`app/utils/continuingAnime.ts`): 話数 `>= 14` を「2クール以上」の主シグナルにする(週1配信前提)。
- シーズンは「年 + 季(WINTER/SPRING/SUMMER/FALL)」の4分割。`seasonIndex()` で時系列比較する。
- 未ログイン時はデータを **localStorage**(`animeSeasons`)に保存。ログイン時は Supabase。切替は `useAnimeData` に集約。

## DB / マイグレーション

- スキーマ変更は **[docs/db/README.md](docs/db/README.md)** の手順に従う(Supabase CLI 運用)。
  このリポジトリからは本番 DB に触れないため、SQL は用意し人間が適用する。
- 適用済み SQL の履歴は `docs/db/legacy/`、未適用は `docs/db/migrations-pending/`。
- `animes`/`watchlist` に `(user_id, anilist_id)` の UNIQUE 制約(適用は保留中)。
  制約違反(PostgreSQL 23505)はリポジトリ層で `DuplicateAnimeError` に変換される。

## 品質ゲート / Git・CI

- **警告バジェット(ラチェット)**: `--max-warnings 137`。**警告を増やす変更は CI が落ちる**。
  警告を減らしたら `package.json` の数値も下げて締める(緩める方向には動かさない)。
- CI(`.github/workflows/test.yml`): lint → prettier --check → type-check → vitest → Playwright E2E。
  **緑 = マージ可**の状態を維持する。`continue-on-error` で誤魔化さない。
- コミットは日本語プレフィクス(`機能:`/`修正:`/`docs:`/`chore:`/`リファクタ:`/`テスト:`)。
  **main 直 push はしない**、必ず PR 経由。1 PR = 1 関心事。
- 新規の分析/レポート系ドキュメントは `docs/` 配下に置く(ルートを汚さない)。
- Supabase の環境変数(`.env*`)は読み取らない・コミットしない。

## テストの考え方

- リファクタ前に**特性テスト**(characterization test)で現挙動を固定してから書き換える。
  「正しさ」ではなく「変えていないこと」を検証する(例: `__tests__/lib/anilist.test.ts`)。
- コアロジックはユニットテスト(`app/lib/**`, `app/utils/**` をカバレッジ対象に)、
  主要フローは Playwright E2E。UI コンポーネントのカバレッジは追わない。
