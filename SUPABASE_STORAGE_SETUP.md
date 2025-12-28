# Supabase Storage セットアップガイド

## アバター画像保存用のStorageバケット設定

### 1. Supabaseダッシュボードでバケットを作成

1. Supabaseダッシュボードにログイン
2. 左メニューから「Storage」を選択
3. 「New bucket」をクリック
4. 以下の設定でバケットを作成：
   - **Name**: `avatars`
   - **Public bucket**: ✅ チェック（公開バケット）
   - **File size limit**: 5MB（推奨）
   - **Allowed MIME types**: `image/*`（すべての画像形式を許可）

### 2. RLS（Row Level Security）ポリシーの設定

Storageバケットのセキュリティポリシーを設定します。

#### アップロードポリシー（本人のみアップロード可能）

```sql
-- アバター画像のアップロードを許可（本人のみ）
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 閲覧ポリシー（公開バケットなので全員閲覧可能）

```sql
-- アバター画像の閲覧を許可（全員）
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

#### 削除ポリシー（本人のみ削除可能）

```sql
-- アバター画像の削除を許可（本人のみ）
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. データベーススキーマの更新

`user_profiles`テーブルに以下のカラムを追加します。

```sql
-- otaku_type カラムを追加
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS otaku_type TEXT;

-- otaku_type_custom カラムを追加
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS otaku_type_custom TEXT;

-- avatar_url カラムを追加
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

### 4. 動作確認

1. アプリでプロフィール画像をアップロード
2. Supabase Storageの`avatars`バケットに画像が保存されているか確認
3. `user_profiles`テーブルに`avatar_url`が正しく保存されているか確認
4. オタクタイプを設定し、`otaku_type`または`otaku_type_custom`が正しく保存されているか確認

### 5. トラブルシューティング

#### アップロードに失敗する場合

- RLSポリシーが正しく設定されているか確認
- バケットが公開設定になっているか確認
- ファイルサイズが5MB以下か確認

#### 画像が表示されない場合

- `avatar_url`が正しく保存されているか確認
- Supabase Storageの公開URLが正しく生成されているか確認
- ブラウザのコンソールでエラーを確認

#### オタクタイプが保存されない場合

- `user_profiles`テーブルに`otaku_type`と`otaku_type_custom`カラムが存在するか確認
- ブラウザのコンソールでエラーを確認


