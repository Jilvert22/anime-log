# Playリリース準備状況

確認: 2026-09-07。所有者は組織アカウントを保有。ルートの2026年6月の個人アカウント前提資料は旧資料として残し、本資料を優先する。

## Android成果物の確認

| 保存物 | 実際のpackage | targetSdkVersion | 判定 |
|---|---|---|---|
| Downloadsの「アニメログ - Google Play package.zip」内AAB | jp.animelog.twa | 35 | アニメログの旧成果物。versionCode=1、versionName=1.0.0.0 |
| Downloads/Play掲載アセット/09_アップロードするAAB.aab | com.aquarium_map | 36 | 水族館アプリの成果物。アニメログには提出しない |

AABの公開マニフェストを確認した。署名鍵・パスワードは読み出していない。現在のGoogle Play公式要件は2026-08-31から新規・更新ともAPI36以上。アニメログはAPI36以上で再ビルドする。出典: [対象API要件](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)。

`lunacopy-app/android` はAPI36のTWA構成で参照できるが、packageやドメイン、アイコンは別アプリであり流用しない。アニメログのpackageは `jp.animelog.twa`、起動先は `https://animelog.jp/`。

## 提出前の具体的な残件

- Play Consoleの組織アカウントの全アプリ一覧を確認し、アニメログは未作成と確認済み。アニメログを新規登録し、最初のAABと署名を設定する。
- API36対応のAndroidプロジェクトを`android/`に追加。既存のアニメログ鍵で署名したAAB/APKを生成し、bundletool・署名・package `jp.animelog.twa`・versionCode 2を検証済み。再ビルド方法は[Android README](../android/README.md)。Playへのアップロードと実機確認は未実施。
- Play App Signingの「アプリ署名鍵の証明書」SHA-256を `public/.well-known/assetlinks.json` と照合する。現在はPWABuilder生成鍵の指紋1件のみ。アップロード鍵をGoogle配信用署名の代わりに扱わない。
- Webの改善・通報・削除修正をPR経由で公開し、Play配信版でログイン、保存、戻る、共有、オフライン復帰、アカウント削除を確認する。
- ストア素材とData Safetyを現行コードに合わせる。旧資料の「外部送信先は3つのみ」「感想の公開/非公開を選べる」「プッシュ識別子は対象外」「暴力・性的表現はすべてなし」は未確認のまま転記しない。GA4、Annict、Googleフォーム、通報・ブロックも含め確認が必要。
- 有料機能や決済は未提供。関心ボタンは購入ではない。AniListへの問い合わせは所有者希望により送信していない。

## 2026-09-07 Android準備

- Android Gradle Plugin 9.0.1、Gradle 9.1.0、Android Browser Helper 2.7.3でリリースビルド成功。Android lintはエラー0件。Gradle更新案内・単色アイコン未定義の警告2件が残る。
- アイコンはアニメログの既存素材を使用。`/?tab=watching`へのランチャーショートカットを追加。
- 署名鍵は既存公開指紋との一致を確認してローカルビルドのみに使用。一時コピーは削除済み。秘密情報と署名成果物はGitに含めない。
- AAB/APKにネイティブ`.so`はない。実機動作やPlay配信後の署名確認が済んだことを意味しない。
- Android用CIで未署名AABとlintを検証する。
- Consoleの作成フォームは「アニメログ」「日本語」「アプリ」「無料」「jp.animelog.twa」を入力し、パッケージ名が使用可能と確認。ポリシー遵守申告・米国輸出法への同意・アプリ作成は未実行。
- [Data Safety回答案](PLAY_DATA_SAFETY_DRAFT.md)を現行コードに基づき整理。本番解析設定、プライバシーポリシーの外部送信先明示、対象年齢・IARC回答は提出前に確定する。

## Web側の確認資料

- [記録の保全と取り込み](RECORD_IMPORT_REVIEW.md)
- [通報・ブロックと運営CLI](MODERATION_REVIEW.md)
- [アカウント削除](ACCOUNT_DELETION_REVIEW.md)
