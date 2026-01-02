# プッシュ通知機能 実装内容まとめ

## 実装日
2024年（最新コミット: 49ba623）

## 実装内容

### 1. プッシュ通知購読処理（クライアント側）

**ファイル**: `app/lib/push-notifications.ts`

#### 主な機能
- `subscribeToPushNotifications(user: User)`: プッシュ通知に購読
  - 通知権限をリクエスト
  - Service Workerを登録/取得
  - VAPID公開鍵を使用してpushManagerで購読を作成
  - 購読情報をSupabaseの`push_subscriptions`テーブルに保存
  
- `unsubscribeFromPushNotifications(user: User)`: プッシュ通知の購読を解除
  - 購読を解除
  - Supabaseから購読情報を削除

- `isSubscribedToPushNotifications()`: 現在の購読状態を確認

#### 技術詳細
- VAPID公開鍵をUint8Arrayに変換する処理
- Service Workerの登録状態を確認
- エラーハンドリングとログ出力

### 2. Service Workerのプッシュ通知処理

**ファイル**: `public/sw-custom.js` → ビルド時に`public/sw.js`に注入

#### 実装内容
- **pushイベントリスナー**: プッシュ通知を受信して表示
  - 通知データをJSON形式で受信
  - `self.registration.showNotification()`で通知を表示
  - 通知内容:
    - title: 「アニメログ」
    - body: 作品名と放送時間を含むメッセージ
    - icon: `/icon-192.png`
    - badge: `/icon-192.png`
    - data: クリック時の遷移先URL

- **notificationclickイベントリスナー**: 通知クリック時の処理
  - 通知を閉じる
  - 既に開いているウィンドウがあればフォーカス
  - なければ新しいウィンドウを開く

#### ビルドプロセス
- `scripts/inject-push-notifications.js`: ビルド後に生成されたService Workerにプッシュ通知コードを注入
- `package.json`の`build`スクリプトに自動実行を追加

### 3. 通知設定UI（WatchlistDetailSheet）

**ファイル**: `app/components/modals/WatchlistDetailSheet.tsx`

#### 機能
- **通知ON/OFFトグル**
  - 通知をONにする際、通知権限をリクエスト
  - 権限が拒否された場合は設定を保存しない
  - プッシュ通知の購読/購読解除を実行

- **通知タイミング設定（複数選択可）**
  - 30分前
  - 1時間前
  - 3時間前
  - 当日朝（9:00）
  - **カスタム時間**: 自由に時間を設定可能（新機能）

- **楽観的更新**
  - UIを即座に更新し、バックグラウンドで保存
  - エラー時は状態を元に戻す

#### 技術詳細
- `maybeSingle()`を使用して406エラーを回避
- エラーハンドリングの改善
- ローディング状態の管理

### 4. データベーススキーマ

**ファイル**: `supabase_notification_tables.sql`

#### テーブル

**notification_settings**
- `id`: UUID (主キー)
- `user_id`: UUID (auth.users参照)
- `watchlist_id`: UUID (watchlist参照)
- `enabled`: BOOLEAN (通知有効/無効)
- `timing`: TEXT[] (通知タイミング配列: '30min', '1hour', '3hour', 'morning', 'custom:HH:MM')
- `created_at`, `updated_at`: TIMESTAMP
- UNIQUE制約: (user_id, watchlist_id)

**push_subscriptions**
- `id`: UUID (主キー)
- `user_id`: UUID (auth.users参照)
- `endpoint`: TEXT (プッシュ通知エンドポイント)
- `p256dh`: TEXT (暗号化キー)
- `auth`: TEXT (認証キー)
- `created_at`: TIMESTAMP
- UNIQUE制約: (user_id, endpoint)

#### RLSポリシー
- ユーザーは自分の通知設定とプッシュ購読情報のみアクセス可能

### 5. 環境変数

**必要な環境変数**:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: VAPID公開鍵（クライアント側で使用）
- `VAPID_PRIVATE_KEY`: VAPID秘密鍵（サーバー側で使用、定期実行処理で必要）

**設定場所**:
- ローカル: `.env.local`
- Vercel: プロジェクト設定のEnvironment Variables

### 6. next-pwaの設定

**ファイル**: `next.config.ts`

- `runtimeCaching`: オフライン対応のキャッシュ戦略
- ビルド時にService Workerを生成
- カスタムService Workerコードを注入

## 実装の流れ

1. **VAPIDキーの生成**
   - `npx web-push generate-vapid-keys`で生成
   - 公開鍵と秘密鍵を環境変数に設定

2. **データベースの設定**
   - `supabase_notification_tables.sql`を実行

3. **クライアント側の実装**
   - プッシュ通知購読処理の実装
   - Service Workerの拡張
   - 通知設定UIの実装

4. **ビルドとデプロイ**
   - ビルド時にService Workerにプッシュ通知コードを注入
   - Vercelに環境変数を設定
   - デプロイ

## 修正履歴

### 初回実装 (78aadab)
- プッシュ通知機能の基本実装

### UI操作問題の修正 (f73084d)
- 通知ON時の権限チェックを修正
- 通知タイミング変更時の楽観的更新を実装
- カスタム時間設定機能を追加
- UIが固まる問題を解消

### 406エラーの修正 (cdd2d29, 49ba623)
- 406エラーのハンドリングを改善
- `single()`を`maybeSingle()`に変更して406エラーを解消

## 次のステップ（未実装）

### 定期実行処理（サーバー側）
放送時間に基づいてプッシュ通知を送信する定期実行処理が必要です。

**必要な実装**:
1. Vercel Cron Jobsまたは外部サービス（例: GitHub Actions, Supabase Edge Functions）で定期実行
2. 通知設定を有効にしているユーザーを取得
3. 各アニメの放送時間を計算
4. 設定されたタイミング（30分前、1時間前など）に通知を送信
5. Web Push APIを使用してプッシュ通知を送信

**実装例**:
```typescript
// app/api/cron/send-notifications/route.ts
import { webpush } from 'web-push';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // 認証チェック（Cron Secretなど）
  
  // 通知設定を有効にしているユーザーを取得
  // 放送時間を計算
  // プッシュ通知を送信
  
  return Response.json({ success: true });
}
```

## 注意事項

1. **VAPIDキーの管理**
   - `VAPID_PRIVATE_KEY`は秘密情報のため、GitHubなどに公開しない
   - 本番運用前に新しいキーを再生成することを推奨

2. **通知権限**
   - ブラウザの通知権限が必要
   - iOSではホーム画面に追加すると通知が届く

3. **Service Worker**
   - HTTPS環境でのみ動作
   - 開発環境では`next.config.ts`で無効化されている

4. **406エラー**
   - `maybeSingle()`を使用することで解消
   - レコードが存在しない場合でもエラーが発生しない

## 関連ファイル

- `app/lib/push-notifications.ts`: プッシュ通知購読処理
- `app/components/modals/WatchlistDetailSheet.tsx`: 通知設定UI
- `public/sw-custom.js`: Service Workerのプッシュ通知コード（ビルド時に注入）
- `scripts/inject-push-notifications.js`: ビルド後にService Workerにコードを注入
- `supabase_notification_tables.sql`: データベーススキーマ
- `next.config.ts`: next-pwaの設定
- `VERCEL_ENV_SETUP.md`: Vercel環境変数設定ガイド

