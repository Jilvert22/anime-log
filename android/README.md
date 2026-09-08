# Android版アニメログ

`https://animelog.jp/` を開くTrusted Web Activity（TWA）。Web側の更新はサイトのデプロイで反映される。

| 項目 | 値 |
|---|---|
| package / namespace | `jp.animelog.twa` |
| 起動URL | `https://animelog.jp/` |
| versionCode / versionName | `3` / `1.0.2` |
| min / compile / target SDK | `23` / `36` / `36` |
| Android Gradle Plugin / Gradle | `9.0.1` / `9.1.0` |
| Android Browser Helper | `2.7.3` |

## ビルド

JDK 17以上（検証はJDK 21）、Android SDKの`platforms;android-36`と`build-tools;36.0.0`が必要。`JAVA_HOME`と`ANDROID_HOME`を各端末のインストール先に設定する。

```sh
cd android
./gradlew --no-daemon :app:bundleRelease :app:lintRelease
```

通常は未署名の`app/build/outputs/bundle/release/app-release.aab`を生成する。CIも未署名でビルドするため、その成果物は直接Playに提出しない。署名付きAPKは`:app:assembleRelease`。

署名時のみ、プロセス環境に以下の4変数をまとめて設定する。秘密情報をシェル履歴、ログ、`gradle.properties`に書かない。

- `ANIMELOG_KEYSTORE`: 既存アニメログのkeystoreの絶対パス
- `ANIMELOG_KEY_ALIAS`: 鍵のalias
- `ANIMELOG_STORE_PASSWORD`: keystoreのパスワード
- `ANIMELOG_KEY_PASSWORD`: 鍵のパスワード

新しい鍵を作らず、旧アニメログの署名との一致を検証する。署名鍵・秘密情報・AAB/APK・SDK設定はGit管理対象外。公開リポジトリには追加しない。

## 設定の意図と検証

- ランチャーアイコンは既存の`public/icons/`からコピー。変更時はWeb/Android両方を更新する。
- Adaptive Iconは既存のmaskable画像を前景の中央72/108領域に配置する。背景に画像全体を直接貼ると、Androidのマスクで図柄が拡大・切り抜きされるため、前景に各辺1/6の余白と不透明な背景を設ける。参照: [AdaptiveIconDrawable](https://developer.android.com/reference/android/graphics/drawable/AdaptiveIconDrawable)。
- Android 7.1以降の「視聴中」ショートカットは`/?tab=watching`を開く。
- TWA非対応ブラウザではCustom Tabsにフォールバックする。
- 通知のネイティブ委譲サービスは追加していない。通知はWeb/ブラウザ側の許可に依存し、実機での確認が必要。
- アプリ内に独自のアカウントDB・決済SDK・広告SDKはない。Web側の収集データはData Safetyの対象として別途確認する。
- ネイティブ側のバックアップを無効にしている。ブラウザ内のCookie/localStorageはブラウザが管理し、この設定では削除されない。

`bundletool validate`とマニフェストのdumpでpackage、SDK、version、URLを検証し、`jarsigner -verify`（AAB）/`apksigner verify`（APK）で署名を確認する。Play App Signing導入後は、Googleが配信用に使う**アプリ署名鍵**のSHA-256をWeb側の`public/.well-known/assetlinks.json`に追加する。アップロード鍵の一致だけではPlay版のTWA検証は完了しない。

ローカルビルド・Android lint・AAB構造・署名の検証と、実機でのログイン/保存/戻る/共有/復帰/削除の確認は別の工程。後者の完了前に配信可と判断しない。

互換性の根拠: [GoogleのAGP 9.0リリース情報](https://developer.android.com/build/releases/agp-9-0-0-release-notes)。Gradle wrapperはApache License 2.0のGradle配布物。TWAは[Google Android Browser Helper](https://github.com/GoogleChrome/android-browser-helper)を使用する。
