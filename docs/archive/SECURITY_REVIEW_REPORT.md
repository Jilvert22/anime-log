# セキュリティレビューレポート

**作成日**: 2025年
**対象**: anime-log プロジェクト

## 📋 概要

このレポートは、API Routes、RLSポリシー、入力検証に関するセキュリティレビューの結果をまとめたものです。

---

## 1. API Routesのセキュリティ検証

### 1.1 `/api/delete-account/route.ts`

#### ✅ 認証チェック
- **状態**: ✅ 適切に実装
- **詳細**: 
  - `supabase.auth.getUser()` で認証チェック
  - 未認証の場合は401エラーを返却
  - 認証されたユーザーIDを使用して削除処理を実行

#### ⚠️ SQLインジェクションリスク
- **状態**: ⚠️ **潜在的リスクあり**
- **詳細**: 
  - 77行目で `.or()` メソッドに文字列連結を使用
  ```typescript
  .or(`follower_id.eq.${userId},following_id.eq.${userId}`);
  ```
  - `userId` は UUID で `auth.getUser()` から取得されているため、現時点では安全
  - ただし、将来的な変更やコードの再利用時にリスクがある可能性
  - **推奨**: Supabase のパラメータ化クエリメソッドを使用することを推奨（現状はUUIDであるため実質的なリスクは低い）

#### ✅ エラーハンドリング
- **状態**: ✅ 適切
- **詳細**: 
  - 機密情報（サービスロールキーなど）をエラーメッセージに含めない
  - 一般ユーザー向けのエラーメッセージと内部ログを適切に分離
  - サーバー設定エラー時は一般ユーザーに詳細を漏らさない

#### ❌ レート制限
- **状態**: ❌ 実装なし
- **詳細**: 
  - アカウント削除は重要な操作のため、レート制限の実装を推奨
  - **推奨**: Vercel Edge Middleware または Next.js Middleware でレート制限を実装

#### ✅ 権限チェック
- **状態**: ✅ 適切
- **詳細**: 
  - 認証されたユーザー自身のデータのみ削除可能
  - サービスロールキーを使用しているが、認証済みユーザーのIDに基づいて削除しているため安全

---

### 1.2 `/api/proxy-image/route.ts`

#### ❌ 認証チェック
- **状態**: ❌ **認証なし（公開エンドポイント）**
- **詳細**: 
  - 認証チェックが実装されていない
  - 意図的に公開エンドポイントとして設計されている可能性あり

#### ⚠️ SSRF (Server-Side Request Forgery) リスク
- **状態**: ⚠️ **高リスク**
- **詳細**: 
  - 4行目で `request.nextUrl.searchParams.get('url')` からURLを取得
  - 11行目でそのURLに直接リクエストを送信
  - **問題点**:
    - 内部ネットワークへのアクセスが可能
    - ローカルホストへのアクセスが可能
    - 任意のURLにリクエストを送信可能
  - **推奨対策**:
    1. ホワイトリスト方式で許可されたドメインのみ許可
    2. プライベートIPアドレス範囲（10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8）をブロック
    3. `file://`, `ftp://` などのプロトコルをブロック
    4. AniList API の画像URLのみを許可するホワイトリスト実装

#### ⚠️ 入力検証
- **状態**: ⚠️ 不十分
- **詳細**: 
  - URLパラメータの検証が `!url` チェックのみ
  - URLの形式検証、プロトコルチェック、ホスト検証がない

#### ❌ レート制限
- **状態**: ❌ 実装なし
- **詳細**: 
  - 画像プロキシとして使用されるため、レート制限の実装を推奨

---

### 1.3 `/api/og/route.tsx`

#### ❌ 認証チェック
- **状態**: ❌ **認証なし（公開エンドポイント）**
- **詳細**: 
  - OGP画像生成エンドポイントのため、意図的に公開されている可能性あり

#### ✅ 入力検証
- **状態**: ✅ 適切
- **詳細**: 
  - `username` パラメータを取得
  - 存在しない場合はデフォルトOGPを返却
  - 公開プロフィール（`is_public = true`）のみ取得

#### ✅ データアクセス制限
- **状態**: ✅ 適切
- **詳細**: 
  - `is_public = true` のプロフィールのみ取得
  - RLSポリシーと組み合わせて適切に保護されている

#### ⚠️ レート制限
- **状態**: ⚠️ 実装なし（低優先度）
- **詳細**: 
  - OGP画像生成はキャッシュ可能なため、優先度は低い
  - ただし、大量リクエストによる負荷を考慮してレート制限を検討

---

## 2. RLSポリシーの検証

### 2.1 `supabase_sns.sql` - SNS機能テーブル

#### ✅ `user_profiles` テーブル

**SELECTポリシー**:
```sql
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.user_profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);
```
- ✅ 公開プロフィールは全員が閲覧可能
- ✅ 自分のプロフィールは常に閲覧可能
- ✅ 非公開プロフィールは本人のみ閲覧可能

**UPDATEポリシー**:
```sql
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);
```
- ✅ 自分のプロフィールのみ更新可能

**INSERTポリシー**:
```sql
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```
- ✅ 自分のプロフィールのみ挿入可能
- ⚠️ **レート制限なし**: 大量のINSERTリクエストを防ぐ仕組みがない
  - ただし、`id` がPRIMARY KEYであるため、同一ユーザーからの重複INSERTは制約により防がれる

#### ✅ `follows` テーブル

**SELECTポリシー**:
```sql
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT
  USING (true);
```
- ✅ フォロー関係は公開情報として全員が閲覧可能（意図的な設計）

**INSERTポリシー**:
```sql
CREATE POLICY "Users can insert own follows"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);
```
- ✅ 自分のフォロー関係のみ作成可能
- ✅ `CHECK(follower_id != following_id)` により自己フォローを防止
- ⚠️ **レート制限なし**: スパム的な大量フォローを防ぐ仕組みがない

**DELETEポリシー**:
```sql
CREATE POLICY "Users can delete own follows"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);
```
- ✅ 自分のフォロー関係のみ削除可能

---

### 2.2 `supabase_reviews.sql` - 感想テーブル

#### ✅ `reviews` テーブル

**SELECTポリシー**:
```sql
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT
  USING (true);
```
- ✅ 全員が感想を閲覧可能（意図的な設計）

**INSERTポリシー**:
```sql
CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```
- ✅ ログインユーザーのみ感想を投稿可能
- ✅ 自分のuser_idのみ設定可能
- ⚠️ **レート制限なし**: スパム的な大量投稿を防ぐ仕組みがない

**UPDATEポリシー**:
```sql
CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE
  USING (auth.uid() = user_id);
```
- ✅ 自分の感想のみ更新可能

**DELETEポリシー**:
```sql
CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE
  USING (auth.uid() = user_id);
```
- ✅ 自分の感想のみ削除可能

#### ✅ `review_likes` テーブル

**SELECTポリシー**:
```sql
CREATE POLICY "Anyone can view review likes" ON review_likes
  FOR SELECT
  USING (true);
```
- ✅ 全員がいいねを閲覧可能

**INSERTポリシー**:
```sql
CREATE POLICY "Users can insert their own likes" ON review_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```
- ✅ ログインユーザーのみいいねを追加可能
- ✅ `UNIQUE(review_id, user_id)` により重複いいねを防止

**DELETEポリシー**:
```sql
CREATE POLICY "Users can delete their own likes" ON review_likes
  FOR DELETE
  USING (auth.uid() = user_id);
```
- ✅ 自分のいいねのみ削除可能

#### ✅ `review_helpful` テーブル
- `review_likes` と同様の適切なポリシー設定

---

### 2.3 `supabase_watchlist.sql` - 積みアニメテーブル

#### ✅ `watchlist` テーブル

**SELECTポリシー**:
```sql
CREATE POLICY "Users can view their own watchlist" ON watchlist
  FOR SELECT
  USING (auth.uid() = user_id);
```
- ✅ 自分の積みアニメのみ閲覧可能

**INSERTポリシー**:
```sql
CREATE POLICY "Users can insert their own watchlist" ON watchlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```
- ✅ ログインユーザーのみ積みアニメを追加可能
- ✅ 自分のuser_idのみ設定可能

**UPDATEポリシー**:
```sql
CREATE POLICY "Users can update their own watchlist" ON watchlist
  FOR UPDATE
  USING (auth.uid() = user_id);
```
- ✅ 自分の積みアニメのみ更新可能

**DELETEポリシー**:
```sql
CREATE POLICY "Users can delete their own watchlist" ON watchlist
  FOR DELETE
  USING (auth.uid() = user_id);
```
- ✅ 自分の積みアニメのみ削除可能

---

## 3. 入力が保存される箇所の検証

### 3.1 `app/lib/api/profile.ts`

#### ✅ 認証チェック
- **状態**: ✅ すべての関数で `requireAuth()` を使用
- **詳細**: 
  - `uploadAvatar()`, `upsertUserProfile()`, `getMyProfile()` で認証チェック

#### ⚠️ XSS対策
- **状態**: ⚠️ **不十分**
- **詳細**: 
  - HTMLエスケープ処理が実装されていない
  - Supabaseに直接保存しており、フロントエンド側で表示時にエスケープする必要がある
  - **推奨**: 
    - フロントエンドでの表示時にReactの自動エスケープ機能を活用（既存実装を確認）
    - または、保存前にサニタイズライブラリ（例: `DOMPurify`）を使用

#### ✅ SQLインジェクション対策
- **状態**: ✅ 適切
- **詳細**: 
  - Supabaseクライアントを使用しており、パラメータ化クエリが自動的に適用される
  - 文字列連結によるSQL構築がない

#### ⚠️ 入力長制限
- **状態**: ⚠️ **不十分**
- **詳細**: 
  - データベース側の制約に依存している可能性
  - アプリケーション側での明示的な長さ検証がない
  - **推奨**: 
    - `username`, `bio`, `handle` などの入力長を明示的に検証
    - 例: `username` は50文字以内、`bio` は500文字以内など

#### ✅ 入力正規化
- **状態**: ✅ 適切
- **詳細**: 
  - `normalizeHandle()` 関数でハンドルの正規化（@除去、小文字変換）
  - `trim()` で前後の空白を除去

#### ✅ 重複チェック
- **状態**: ✅ 適切
- **詳細**: 
  - 109-121行目でハンドルの重複チェックを実装
  - 自分自身のハンドルは除外してチェック

---

### 3.2 `app/lib/api/social.ts`

#### ✅ 認証チェック
- **状態**: ✅ 適切
- **詳細**: 
  - `followUser()`, `unfollowUser()`, `isFollowing()` で `requireAuth()` を使用
  - `searchUsers()`, `getRecommendedUsers()`, `getFollowers()`, `getFollowing()`, `getPublicProfile()`, `getPublicAnimes()`, `getFollowCounts()` は公開情報取得のため認証不要（適切）

#### ⚠️ SQLインジェクション対策（検索クエリ）
- **状態**: ⚠️ **注意が必要**
- **詳細**: 
  - 68行目で `ilike('username', \`%${trimmedQuery}%\`)` を使用
  - Supabaseの `ilike` メソッドはパラメータ化クエリを使用しているため、実質的には安全
  - ただし、`trimmedQuery` はユーザー入力であり、特殊文字が含まれる可能性がある
  - Supabaseクライアントが自動的にエスケープしているため現状は安全だが、将来的な変更に注意

#### ⚠️ 入力検証（検索クエリ）
- **状態**: ⚠️ **基本的な検証のみ**
- **詳細**: 
  - `trim()` で空白を除去
  - ハンドル形式の判定（正規表現）
  - **不足**: 
    - 検索クエリの長さ制限がない
    - 特殊文字の検証がない（Supabaseが処理しているため実質的に問題なし）

#### ⚠️ レート制限
- **状態**: ❌ 実装なし
- **詳細**: 
  - `searchUsers()` は公開エンドポイントのため、レート制限の実装を推奨
  - 大量の検索リクエストによる負荷を考慮

---

## 📊 総合評価

### ✅ 良好な点

1. **認証チェック**: ほとんどのAPI関数で `requireAuth()` を使用
2. **RLSポリシー**: 適切に設定され、他ユーザーのデータアクセスを適切に制限
3. **SQLインジェクション対策**: Supabaseクライアントによるパラメータ化クエリ
4. **エラーハンドリング**: 機密情報をエラーメッセージに含めない

### ⚠️ 改善が必要な点

1. **SSRF対策（重要）**: `/api/proxy-image/route.ts` でSSRF対策が必要
2. **レート制限**: 重要な操作（アカウント削除、フォロー、感想投稿など）にレート制限を実装
3. **入力長制限**: アプリケーション側での明示的な入力長検証
4. **XSS対策**: フロントエンド側での表示時のエスケープ確認（Reactの自動エスケープを活用）

---

## 🔒 優先度別の推奨事項

### 🔴 高優先度（即座に対応）

1. **`/api/proxy-image/route.ts` のSSRF対策** ✅ **完了**
   - ホワイトリスト方式で許可されたドメインのみ許可
   - プライベートIPアドレス範囲をブロック
   - 危険なプロトコルをブロック
   - Content-Type検証、ファイルサイズ制限を追加

2. **`/api/delete-account/route.ts` のレート制限** ✅ **完了**
   - アカウント削除は重要な操作のため、レート制限を実装
   - 1時間に3回までに制限
   - インメモリ方式を実装（複数インスタンス環境ではVercel KV/Upstash Redisの使用を推奨）

### 🟡 中優先度（短期間に対応）

3. **入力長制限の実装** ✅ **完了**
   - `profile.ts` で `username`, `bio`, `handle`, `otaku_type_custom` の長さ検証
   - `watchlist.ts` で `memo` の長さ検証
   - `ReviewModal.tsx` で `content` の長さ検証
   - 共通バリデーション関数（`app/lib/validation.ts`）を作成

4. **フォロー・感想投稿のレート制限**
   - スパム防止のため、RLSポリシーに加えてアプリケーション側でレート制限

5. **`/api/proxy-image/route.ts` のレート制限**
   - 画像プロキシとしての使用を考慮してレート制限を実装

### 🟢 低優先度（長期計画）

6. **XSS対策の確認**
   - フロントエンド側での表示時のエスケープ実装を確認（Reactの自動エスケープを活用）

7. **`/api/og/route.tsx` のレート制限**
   - キャッシュ可能なため優先度は低いが、大量リクエストを考慮

---

## 📝 補足事項

- SupabaseのRLSポリシーは適切に設定されており、データベースレベルでのセキュリティが確保されている
- Supabaseクライアントによるパラメータ化クエリにより、SQLインジェクションのリスクは低い
- フロントエンド側でのXSS対策については、Reactの自動エスケープ機能を活用していることを前提としているが、実際の実装を確認することを推奨

---

**レビュー担当**: AI Assistant  
**次回レビュー推奨日**: 改善実装後

