# アニメログ (anime-log)

Next.js + Supabase のアニメ視聴記録 Web アプリ。最も活発に開発しているプロダクト。

詳細なプロジェクト背景は [PROJECT.md](PROJECT.md)、リリース手順は [RELEASE_HANDOFF.md](RELEASE_HANDOFF.md) を参照。

## コマンド
- `npm run dev` — 開発サーバー（webpack）
- `npm run build` — ビルド（push 通知注入込み）
- `npm run lint` — ESLint（`--max-warnings 141` の警告バジェット。これを増やす方向の変更は避ける）
- `npm run type-check` — `tsc --noEmit`
- `npm run test` / `test:run` — Vitest

## Git・CI
- コミットは日本語プレフィクス（機能:/修正:/docs:/chore:）+ PR 番号。PR ベースのレビューフロー運用
- GitHub Actions（`.github/workflows/test.yml`）で lint→type-check→vitest→Playwright E2E
- コミット前に最低 `npm run type-check` と `npm run test:run` を通す

## 注意
- ルートに分析/レポート md が多数散乱している。新規の履歴系ドキュメントは `docs/` 配下に置く（ルートを汚さない）
- Supabase 連携。環境変数（`.env`）は読み取り・コミットしない
