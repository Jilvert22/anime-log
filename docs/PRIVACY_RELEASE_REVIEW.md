# プライバシー説明の更新

2026-09-08。コードに合わせた説明の更新。外部サービスの追加導入、収集項目の拡張、アカウント削除処理の変更はない。本番公開前のレビュー対象。

## 変更

- 外部サービスの説明にSupabase、ホスティング、Annict、Vercel Speed Insights、Googleフォーム、Web Pushの経路を補足。
- 検索語と直接通信のIP情報を明示し、「個人情報は送信されない」という一律の表現を修正。
- パスワードの保存方法を「暗号化」から「ハッシュ化」に修正。
- アカウント削除が対象とするDB・画像と、端末内記録、書き出し、問い合わせ、解析・バックアップ等を区別。「すべて完全に削除」と断言しない。
- 実際にはホームへ移動するだけだった「同意して登録画面に戻る」を「ホームに戻る」に変更。規約同意の状態や認証処理は変更しない。

## 照合した実装

- `app/lib/api/anilist.ts`、`app/lib/api/annict.ts`、`app/api/annict/route.ts`: 検索と送信経路。
- `app/components/analytics/`、`app/lib/analytics/maskPath.ts`: 解析SDK、URLのマスキング。
- `app/lib/api/accountDeletion.ts`、DBの削除CASCADE、`app/delete-account/page.tsx`: 削除対象と限界。
- `app/privacy/page.tsx`: 更新ページ。

## 外部仕様の根拠

- [Supabase Password security](https://supabase.com/docs/guides/auth/password-security): パスワードのハッシュ保存。
- [Vercel Web Analytics](https://vercel.com/docs/analytics)、[Speed Insights Privacy](https://vercel.com/docs/speed-insights/privacy-policy): 解析の対象とCookie不使用。
- [GA4のCookie利用](https://support.google.com/analytics/answer/11397207?hl=en): 識別子の扱い。

## 残る確認

本番GA4のSignals/広告連携、保持期間、委託先のログ/バックアップ設定、Googleフォームの実際の保存・削除運用はコードのみで確定できない。Data Safety回答案に管理画面での確認を残す。この変更だけでPlayの申告・審査や実機検証を完了扱いにはしない。
