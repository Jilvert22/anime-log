# anime-log リリース引き継ぎ（2026-06-14）

新しいセッションへの引き継ぎ資料。Web公開は完了、Google Play(TWA)申請が進行中。

## プロジェクト概要
- Next.js 16 / React 19 / TypeScript / Tailwind / Supabase の個人向けアニメ視聴記録 **PWA**
- 本番: **https://animelog.jp（既に稼働・公開中）**
- リポジトリ: github.com/Jilvert22/anime-log（テスト=Vitest 25件 + Playwright E2E、CIで実行）

## 現在の到達点（完了・全マージ済み）
- 保守リファクタ: 案件4ステータス集約/案件3 Season統一(PR #4)、案件5ローディング統一(PR #5)、案件2完了アイテム自動除去(PR #6)
- **Web公開**: animelog.jp 稼働、OGを動的`/api/og`に配線(PR #7)。本番で`og:image=https://animelog.jp/api/og`検証済み
- **TWA基盤**: `public/.well-known/assetlinks.json`配信(PR #8、`proxy.ts`のmatcherから`.well-known`除外)、PWABuilder生成鍵のSHA-256指紋を設定(PR #9)。本番配信を検証済み

## 確定事項
- **Play アカウントは「個人(Personal)」で登録** → D-U-N-S番号は不要。本人確認(身分証)のみ。注意点は連絡先住所が公開され得ること
- TWA方式は **PWABuilder** 採用
- package_name = `jp.animelog.twa`
- PWABuilder生成鍵(アップロード鍵)のSHA-256指紋 = `46:AC:C1:F5:8E:E6:5B:B7:E9:E6:66:84:BC:6B:90:7C:45:EB:C4:0B:21:66:6D:90:00:CB:15:6E:DA:82:D3:D0`
- 生成物: `~/Downloads/アニメログ - Google Play package.zip`（`*.aab`=Play提出用 / `signing.keystore`+`signing-key-info.txt`=鍵とパスワード。**リポジトリには非格納、要安全バックアップ**）

## 残タスク

### ユーザー（Play Console・代行不可）
1. Play Console 登録（**個人**選択・$25・本人確認）
2. `signing.keystore`+パスワードを安全にバックアップ（紛失=更新不可）
3. アプリ作成 → `*.aab` アップロード（内部テスト）
4. **Play App Signing 有効化** → 「アプリの署名」の **Google管理鍵 SHA-256** を取得しエージェントへ渡す
5. ストア素材: スクショ2〜8枚 / フィーチャーグラフィック1024×500 / アイコン512×512
6. Data Safety・コンテンツレーティング・プライバシーポリシーURL(`https://animelog.jp/privacy`)・対象年齢
7. 審査提出

### エージェント（受け取り次第）
1. **Google管理鍵のSHA-256** → `public/.well-known/assetlinks.json` の配列に2つ目として追記（PR→本番検証）。※これが無いと配信版TWAのURLバーが消えない＝最優先の受け渡し
2. **実機スクショ2〜3枚** → `manifest.json` に `screenshots` 配線
3. 着手可能(並行): **Data Safety回答ドラフト**（収集データ: メール認証/ユーザーコンテンツ=視聴記録・レビュー・プロフィール/Vercel解析/プッシュ通知VAPID/アカウント削除導線あり=`/api/delete-account`）、**ストア掲載文ドラフト**、privacy/terms のPlay要件チェック

## 作業の前提・ハマりどころ
- ブランチは最新`main`から切る。各変更後に `npm run type-check` と `npm run test:run`(Vitest)を通す。**`npx jest`は誤り**
- 表示文字列(ステータスラベル/季節名/`...`)はE2E(`tests/anime.spec.ts`)が可視テキストで掴むため変更時は一字一句注意
- 節目でCodexをdiffレビューに使う(`codex exec --sandbox read-only`)。各PRはCIでPlaywright E2E
- **CIのMCR障害**: `mcr.microsoft.com/playwright`のpullが稀に"The request is blocked"で失敗→`gh run rerun <id> --failed`で再実行
- Vercelプレビューは**SSO保護で401**。検証は本番(animelog.jp)で行う
- PRは squash merge 運用

## ストア以外の公開（既に可能）
- PWA: animelog.jp を「ホーム画面に追加」で即利用可（=実質公開済み）
- APK直接配布: zip内`*.apk`をサイト/QRで（提供元不明アプリ許可・自動更新なし）
- 代替ストア(Amazon/Galaxy等)も選択肢
