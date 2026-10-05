# iOS App Privacy 回答案

更新: 2026-10-05。App Store Connectへ未入力。コード、既存のPlay申告記録、提供元の一次資料に基づく提出準備用の案。今回、iOSの実通信・管理画面・保持設定を確認していない。「確定」は実装で保存・送信を確認できた項目を指し、Apple側での回答承認を意味しない。

## 回答の前提

- 「このアプリまたは第三者パートナーがデータを収集しますか」への案は **はい**。Supabaseへアカウント・記録・画像を保存する。ゲスト記録が端末内にあることだけでアプリ全体を収集なしと回答しない。
- Appleの定義では、要求の即時処理を超えて端末外でアクセス可能となるデータが収集対象。アプリのWKWebView内の通信も対象。検索サービスやログの保持が不明な項目を、一時処理の例外で除外しない。
- アカウント・写真・視聴記録は任意入力でも主機能に関わるため申告する。Playの「必須/任意」「収集/共有」の選択をAppleへそのまま転記しない。
- 「ユーザーとの関連付け」と「追跡」は別。アカウントUUIDやCookie識別子と関連する情報を、実名を送らないという理由だけで非関連と回答しない。

基準: [Apple App Privacyの定義・WebView・関連付け・各データ分類](https://developer.apple.com/app-store/app-privacy-details/)、[App Store Connectの入力手順](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)。

## 実装で確定できる保存項目

目的欄の英語はAppleの選択肢。追跡欄は次節の確認後に確定する。複数の送信先が同じ分類を収集する場合、その分類について用途と関連付けをまとめて回答する。

| Apple分類 / 回答案 | 情報・送信先 | 用途案 | ユーザーとの関連付け | 根拠 |
| --- | --- | --- | --- | --- |
| Contact Info → Email Address：申告 | 登録・認証・リセット用メール / Supabase Auth | App Functionality | はい：認証アカウント | `app/lib/api/auth.ts` のsignUp・signInWithPassword・resetPasswordForEmail |
| Identifiers → User ID：申告 | アカウントUUID、ユーザー名・ハンドル / Supabase | App Functionality | はい | `app/lib/api/profile.ts`、`app/lib/api/auth.ts`、`app/types/index.ts` |
| User Content → Photos or Videos：申告 | 利用者が選択・撮影したプロフィール画像 / Supabase Storage | App Functionality | はい：ユーザー別の保存パス・プロフィール | `app/lib/api/profile.ts:35` のuploadAvatar、`app/components/modals/SettingsModal.tsx:202`、`mobile/ios/App/App/Info.plist` |
| User Content → Other User Content：申告 | 評価・感想・視聴メモ・自己紹介・通報本文と対象の写し / Supabase | App Functionality | はい：投稿者・通報者ID等 | `app/lib/api/reviews.ts`、`profile.ts`、`watchlist.ts`、`moderation.ts`、`supabase/migrations/20260907000200_moderation.sql` |
| Usage Data → Product Interaction：申告候補として含める | 保存した視聴作品、視聴済み・進捗・周回数・視聴予定・リアクション / Supabase | App Functionality | はい：ログイン時はuser_id | `app/lib/api/animes.ts`、`watchlist.ts`、`reviews.ts`、`app/hooks/useAnimeData.ts:74` |
| Contacts：申告候補として含める | フォロー関係（アプリ内のsocial graph） / Supabase | App Functionality | はい：両アカウントID | `app/lib/api/social.ts`。端末の連絡先を取得する機能は確認していないが、AppleのContacts定義にはsocial graphを含む |

視聴記録の自由記述・評価はOther User Content、作品選択や視聴行動はProduct Interactionとして分けた案。App Store Connectの現行説明で照合する。作品カタログの画像は、利用者の写真と混同しない。端末だけに保存されるゲスト記録は、それ自体を端末外の収集とは扱わないが、検索・解析通信は別に評価する。

Contact Info → Nameは**要確認**。現在確認した入力はユーザー名・ハンドルで、User IDとして扱う根拠がある。実名や氏名として収集する別フィールド・問い合わせ欄がある場合はNameも追加する。パスワードは認証サービスへ送信するがEmail Addressの分類に含めるものではなく、Appleの分類に当てはまらない認証情報の扱いを提出時に確認する。

## 解析・検索・ログ：要確認の回答候補

| Apple分類 / 暫定案 | 根拠・送信先 | 用途案 / 関連付け案 | 確定に必要なこと |
| --- | --- | --- | --- |
| Usage Data → Product Interaction：解析分も含める | GA4のpage_view等、Vercelの閲覧・インストール・追加機能への関心 | Analytics。GA4はCookie等と関連する案。Vercelは非関連の候補 | iOSで実際に送信されるイベント・識別子を確認。Vercel独自イベントとGA自動計測も対象 |
| Identifiers → Device ID：候補 | GA4のブラウザCookie識別子、Vercelの短期間の訪問者hash等 | Analytics。GA4は関連付け「はい」を暫定案とし、Vercelのhashの分類は要照合 | device-level / browser-level IDへのApple分類、受信データ、再識別・他情報との結合を確認。IDFAを収集していると断定しない |
| Location → Coarse Location：候補として含める | GA4のIP由来の地域、Vercel Web Analyticsの地域、Speed Insightsの国 | Analytics。GA4はCookieとの関連付け要確認。Vercelは非関連の候補 | 実際の地域粒度と保存を確認。位置情報権限なしでも端末外の地域推定は別。Googleが生IPを保存しないことを地域データの収集なしと解釈しない |
| Diagnostics → Performance Data：候補として含める | Vercel Speed InsightsのWeb Vitals・通信性能 | Analytics / App Functionality。非関連の候補 | iOSでの送信、payload、保持、URLの匿名化を確認 |
| Diagnostics → Other Diagnostic Data、または用途に応じた分類：未確定 | Supabase/Vercelの認証・HTTPログ、IP・UA・エラー等 | App Functionality。ログにuser_id等があれば関連あり | 有効なログと保持期間、IPの用途を提供元設定で確認。生IPを一律にDevice IDとしない |
| Search History：候補として含める | 作品検索語・条件をAniListへ直接、AnnictへWebサーバー経由で送信 | App Functionality。関連付けは未確定 | 第三者の保持・ログ、解析に検索語が入るか確認。検索履歴UIがないことは非収集の根拠にならない |
| User Content → Customer Support：候補 | アプリ内リンク先のGoogleフォームへの問い合わせ | App Functionality。メール・名前付きなら関連あり | フォーム項目・保存・アカウント名表示を確認。任意開示の例外条件をすべて満たす証拠がなければ除外しない |
| Other Data Types：必要性未確定 | 上記に分類できない認証情報等 | App Functionality | Appleの分類と実際の保存内容を照合。未確認の情報を安易にこの分類へまとめない |

ローカル根拠:

- `app/layout.tsx:118-134`：本番設定によるGA4読込、VercelInsights。
- `app/components/analytics/GoogleAnalytics.tsx:48-53,80-90`：URL・参照元・タイトルのマスクとpage_view。マスクはCookie識別子の消去や全イベントの匿名化を保証しない。
- `app/components/analytics/VercelInsights.tsx:20-25`、`app/lib/analytics/maskPath.ts`：URLマスク。
- `app/components/PWAInstallBanner.tsx`、`app/hooks/usePWAInstall.ts`、`app/components/tabs/mypage/RecapPreview.tsx:100`：カスタムイベント。追加機能への関心イベントは購入履歴ではない。
- `app/lib/api/anilist.ts:82-87,169-170`、`app/api/annict/route.ts:13-21`：検索条件送信。
- `app/components/tabs/mypage/SettingsSection.tsx`：問い合わせフォームへのリンク。
- `app/privacy/page.tsx:135-151`：外部サービスへの送信についての現行説明。
- [Play申告用記録](PLAY_DATA_SAFETY_DRAFT.md)：2026-09-08のGA4確認ではSignals・ユーザー提供データ収集は未有効、Google広告リンク0件、User-ID送信なし。ただし過去の設定確認であり、今回のiOS版の実通信・現在の設定を証明しない。

提供元一次資料: [Vercel Web Analytics](https://vercel.com/docs/analytics/privacy-policy)はCookieなしでも訪問者hashを用い、地域・閲覧データを扱う。[Speed Insights](https://vercel.com/docs/speed-insights/privacy-policy)はURL・国・Web Vitals等を扱い、個人と関連しない仕組みを説明している。どちらも現在のアプリ実装と設定を照合して非関連を確定する。[Googleの地域・IP処理](https://support.google.com/analytics/answer/12017362?hl=en)は生IPの処理と地域情報を区別している。

## Tracking / ATT の判断案

現時点の案は **追跡に使用しない** だが、提出用の確定回答にはしていない。コードにIDFA取得・ATT要求・広告SDKは確認できず、2026-09-08のGA4確認でも広告連携は確認されていない。一方、GA4の現設定と第三者の利用条件・実通信は今回未確認。

Appleがいう追跡は、広告配信・広告効果測定のための他社データとの結合やデータブローカーへの提供等。通常の機能提供・自社サービス分析だけでATT必須とは判断しない。Cookieを使うだけで追跡と決めず、Cookieを使わないだけで追跡なしとも決めない。[AppleのTracking / ATT](https://developer.apple.com/app-store/user-privacy-and-data-use/)

所有者が確認する項目:

1. 現在のGA4のSignals、Google広告等のリンク、広告パーソナライズ、ユーザー提供データ、データ共有設定、他タグ・外部転送を確認。
2. iOSのWebViewで解析通信を確認し、受信識別子・地域・検索語とイベントを棚卸し。URLマスクが自動計測にも効くか確認する。
3. 各提供元が他社データと広告目的で結合する利用があるか、契約・設定を確認。
4. 追跡を行うなら、ATT許可前・拒否時の追跡停止まで実装・検収する。許可ダイアログを置くだけで完了としない。追跡を行わない方針なら、その設定・提供元の利用を裏付けて各分類の追跡欄を「いいえ」にする。

これらはApple回答と実装の整合性を確認する手順であり、地域別の法的な適法性を断定するものではない。

## Manifest・削除・提出前の最小確認

- App Privacyの回答と`PrivacyInfo.xcprivacy`は別。ネイティブSDKの収集なし宣言だけでは、WKWebView内の収集を説明できない。[AppleのPrivacy Manifestとラベル](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- Capacitor/CordovaのSDK Manifestは既存シミュレータービルドに同梱されていた。署名Release Archiveでも同梱とXcode Privacy Reportを確認。独自SwiftでRequired Reason APIを追加した際は理由宣言を再評価。[Apple SDK要件](https://developer.apple.com/support/third-party-SDK-requirements/)
- iOS初版はネイティブAPNs未実装。Web版の通知購読やAndroidのDevice ID回答を、iOS版へ自動転記しない。現在のiOS画面から通知購読通信が発生しないことを確認する。
- Privacy Policy案: `https://animelog.jp/privacy`。Privacy Choices案: `https://animelog.jp/delete-account`（説明・削除経路への到達を検証してから採用）。`app/hooks/useAccountDeletion.ts`、`app/lib/api/accountDeletion.ts`が認証データ・記録・画像を削除する。ログ・バックアップ・解析集計・書き出したファイルの削除範囲は別。
- 金融、購入、音声、精密位置、端末連絡先、外部Webの閲覧履歴、クラッシュ収集は現コードで収集を確認していない。無地の未選択案は、実通信・追加SDK・リンク先の機能を確認してから確定する。作品の視聴記録は外部WebのBrowsing Historyと混同しない。
- 問い合わせ・通報・視聴嗜好から利用者が任意で機微な情報を記入する可能性と、運営がSensitive Infoを目的として収集・推論する設計を区別する。分類が必要かは実際の入力項目と扱いで判断する。

最終回答を確定するために残る判断は、(1) GA4等をiOSでも有効にする方針と追跡なしの裏付け、(2) 解析・検索・ログの保持と関連付け、(3) Name・Customer Support・Contacts等の最終分類。内部TestFlightの通信検収を進め、その結果でこの案を更新してからApp Store審査用回答を入力する。
