# iOS / App Store 公開準備

更新: 2026-10-04。現状はiOS基盤の実装・検証段階。署名、Apple登録、TestFlight、審査提出、公開は未実施。

## 構成

- `mobile/` はWebの依存関係から分離したCapacitor 8.5.2プロジェクト。Node 22以上、Xcode 26以上、iOS 15以上。初版の対象端末はiPhone。
- Bundle ID候補は `jp.animelog.ios`。Apple側の登録・利用可否は未確認。App Store Connectでアプリを作成する前に確定する。
- Capacitorはローカルの `www/index.html` を同梱して起動。独立した `WKWebView` に `https://animelog.jp/` を表示する。Capacitorの `server.url` は使わない。
- リモートWebViewは独立したconfigurationと永続data storeを使用し、CapacitorのJavaScript/native bridgeを渡さない。将来のAPNsやPreferences連携は追加の権限設計が必要。
- Webサーバー・Supabase・既存同一オリジンAPIを維持する。Next.jsの静的export、Cookie認証・削除APIのCORS緩和、本番DB変更は行っていない。
- アプリ内遷移はHTTPSの `animelog.jp` のみ（ポート省略または443、URL内の認証情報は不可）。外部HTTPSの明示的なリンク操作はSafari画面へ送る。任意スキームや外部へのリダイレクトは許可しない。CDN画像やfetchはトップレベル遷移とは別。
- ネイティブの戻る・進む・再読込・リンク共有、safe-area・キーボード対応、接続失敗・WebKitプロセス中断時の再試行を追加。
- リンク共有はトップページまたは公開プロフィール・共有ページのみ。クエリとフラグメントを除去し、認証コードやリセットリンクを共有しない。非公開プロフィールの共有リンクを受け取った場合のアクセス制御は既存Web側が担う。
- ファイルダウンロードはWebKitから受け取り、端末の共有シートで保存・共有する。完了・キャンセル後に一時ファイルを削除する。画像Blobと記録エクスポートは実機で要検証。
- ネイティブ通知・アプリ内購入は未実装。通知を初版の掲載文で案内しない。視聴記録はSafari/PWAと自動共有されない。ログイン同期または既存取り込み機能で移行する。

独立Codexによる設計監査を実施。通常のWKWebViewとして技術的に成立するが、ネイティブtoolbarの追加だけでAppleの4.2 Minimum Functionalityを満たすとは扱わない。視聴記録・積みアニメ・振り返りの実用性とiPhone上の完成度を審査説明・実機検収で示す。

## 開発・ビルド

このMacにはXcode 27.0（27A266a）がインストール済み。システムの `xcode-select` はCommand Line Toolsを選択しているので、コマンド単位で `DEVELOPER_DIR` を指定する。システム全体の設定は変更しない。

```sh
cd mobile
npm ci --ignore-scripts
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npm run sync
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npm run open
```

Webの `.env*` は不要で、読み込まない。ローカル資産・Capacitor設定はsyncで生成するため、Xcodeを開く前にsyncする。

リポジトリルートから未署名のシミュレータービルド:

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild \
  -project mobile/ios/App/App.xcodeproj -scheme App \
  -configuration Debug -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/animelog-ios-build CODE_SIGNING_ALLOWED=NO build
```

遷移・認証URL共有防止の境界テスト:

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun swiftc \
  -module-cache-path /tmp/animelog-swift-cache \
  mobile/ios/App/App/NavigationPolicy.swift mobile/tests/main.swift \
  -o /tmp/animelog-navigation-tests
/tmp/animelog-navigation-tests
```

## 公開前の必須検収

| 項目 | 検収内容 | 状態 |
| --- | --- | --- |
| Appleアカウント | Developer Program加入・契約・個人/組織・販売者名を確認 | ユーザー回答待ち |
| Bundle IDと署名 | `jp.animelog.ios` の利用可否、Team設定、証明書・プロビジョニング | 未確認 |
| アイコン | 現在は生成テンプレート。正式な1024pxのApp Store用アイコンに差し替え | 未実施 |
| ログイン | 新規登録・既存ログイン・ログアウト・再起動後のセッション | 未検証 |
| メール帰還 | メール確認・パスワードリセットがSafariで開く場合のPKCE/Cookie分離とアプリ復帰 | 未検証・公開前必須 |
| ゲスト記録 | 保存・終了・再起動・更新・同期と取り込み。localStorageの耐久性は保証しない | 未検証 |
| 中核フロー | 検索・作品追加・進捗・評価・感想・積みアニメ・シーズン切替・統計 | 未検証 |
| 入出力 | プロフィール画像選択、PNG共有、ファイル保存、記録の取り込み | 未検証 |
| 削除 | アプリ内からアカウント削除でき、ログアウトと関連データ削除まで完了 | 実アカウント未検証 |
| 投稿と作品画像 | フィルタリング、通報・ブロック・連絡先・運営対応、作品画像/APIの利用権限 | 最終検収待ち |
| 通知 | 現行画面ではコメントアウト。iOSから操作不能な通知UIが出ないこと | 実機未検証 |
| 有料機能見本 | `RecapPreview` の料金案と未販売見本が審査上の未完成機能に見えないよう公開方針を決める | 未決 |
| プライバシー | Webを含むGA4・Vercel・Supabaseの収集実態とApp Privacy、必要なPrivacy Manifest・ATT判定 | 未確定 |
| 端末操作 | ノッチ、ホームバー、キーボード、横画面、文字拡大、VoiceOver、低速・オフライン復帰 | 未検証 |
| TestFlight | 署名版を配布し、実機検収を記録 | 未実施 |

HTTPS等の標準暗号のみを使う現在の基盤では `ITSAppUsesNonExemptEncryption=false` を設定。独自暗号や依存SDKを追加した際は輸出コンプライアンスを再評価する。Privacy ManifestとApp StoreのApp Privacy回答は別物なので、片方で代用しない。

## 今回の検証結果

- Xcode 27でDebug / iOS Simulator、Release / iOSの未署名ビルドが成功。Releaseビルドは署名済みArchiveやAppleへの提出検証を代替しない。
- iPhone 18 Pro / iOS 27シミュレーターへインストール・起動し、本番Webのゲストホームとネイティブ操作バーを画面で確認。スクリーンショットはローカルの `/tmp/animelog-ios-home.png`。操作フロー全体・実機検収は未完了。
- 遷移ポリシーの23チェックが成功。Web側は型検査、35ファイル・273テスト、lintが成功。lintは既存131警告で増加なし。
- 追加ファイルのPrettier検査と `git diff --check` を実施。
- 独立Codex監査の起動経路指摘を修正。Capacitorの非表示rootとは別の表示コンテナを用意し、シミュレーターで修正を確認。再監査で未解決の重大問題なし。
- Webアプリ本体・既存依存関係・本番DBは変更していない。`.env*` は読まず、既存の未コミット変更を保持。

## ストア掲載文のドラフト

名称: アニメログ

サブタイトル案: アニメの視聴記録と振り返り

説明案:

> 観たアニメ、これから観たいアニメをまとめて管理。
>
> アニメログは、アニメの視聴記録をシーズンごとに整理できるアプリです。作品の進捗や評価、感想を残し、自分の好みや視聴の傾向を振り返れます。
>
> ・視聴した作品と進捗を記録
> ・評価や感想をまとめて保存
> ・気になる作品を積みアニメに追加
> ・シーズンごとの記録や統計を確認
> ・アカウントでWeb版と記録を同期
>
> 作品情報の表示や同期にはインターネット接続が必要です。アニメ動画の配信・ダウンロード機能はありません。

実機検収で通った機能だけを最終掲載文に残す。スクリーンショットはiOS版で撮影する。既存Android用画像をそのまま提出しない。

プライバシーURL候補: https://animelog.jp/privacy

サポートURL: 問い合わせ手段が利用できるページを確認して確定する。

年齢区分: 公開感想・プロフィールと検索できる作品を含め、Appleの質問票に実態で回答。Playの年齢設定を転記しない。

審査メモ案: 本アプリは動画視聴アプリではなく、視聴記録・進捗・評価・感想・視聴予定・統計を扱う管理アプリ。ゲスト利用とログイン同期を提供。アカウント機能の審査には専用テストアカウントをApp Store Connectの審査情報欄で提供する。認証情報をGitやこの文書に記録しない。投稿の通報・ブロック・アカウント削除の実際の画面導線を検収後に追記する。

## 提出順序

1. Apple登録とBundle IDを確定し、XcodeのSigning & Capabilitiesで正しいTeamを選択。
2. アイコン・認証帰還・入出力・プライバシーの未完事項を解消。
3. ReleaseでArchiveし、Validate Appで問題を解消。
4. App Store Connectへアップロード、TestFlightで実機検収。
5. スクショ・説明・サポート・年齢・App Privacy・審査情報を入力。
6. 未検収項目が解消した版を審査提出。初回は手動公開を選ぶ。

コード変更はPR経由。mainへの直接pushはしない。Appleへのアップロード・審査・公開は実施した証拠を別々に記録する。

## 一次情報

- [Capacitorの環境要件](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Capacitor設定（server.urlは開発用途）](https://capacitorjs.com/docs/config)
- [カスタムiOSコード](https://capacitorjs.com/docs/ios/custom-code)
- [Apple審査ガイドライン](https://developer.apple.com/app-store/review/guidelines/)
- [Apple提出案内](https://developer.apple.com/app-store/submitting/)
- [App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)
