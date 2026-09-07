import type { SupabaseClient } from '@supabase/supabase-js';

export class AccountDeletionError extends Error {}

// サーバーのRoute Handler専用。認証済み本人のIDと管理者クライアントを渡す。
// StorageとAuthは別サービスのため画像を先に削除する。失敗時にアカウントを消さない。
export async function deleteAccount(admin: SupabaseClient, userId: string): Promise<void> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))
    throw new AccountDeletionError('認証情報を確認できませんでした');
  const bucket = admin.storage.from('avatars');
  async function collectFiles(): Promise<string[]> {
    const paths: string[] = [];
    const directories = [userId];
    let visited = 0;
    while (directories.length) {
      const directory = directories.shift()!;
      if (++visited > 1000)
        throw new AccountDeletionError(
          '画像が多いため削除を完了できませんでした。お問い合わせください'
        );
      for (let offset = 0; ; offset += 100) {
        const { data, error } = await bucket.list(directory, {
          limit: 100,
          offset,
          sortBy: { column: 'name', order: 'asc' },
        });
        if (error || !data)
          throw new AccountDeletionError(
            '画像一覧を確認できませんでした。アカウントは削除していません。時間をおいて再試行してください'
          );
        for (const file of data) {
          if (!file.name || file.name === '.' || file.name === '..' || file.name.includes('/'))
            throw new AccountDeletionError('画像の保存先を確認できませんでした');
          const path = `${directory}/${file.name}`;
          if (file.id === null) directories.push(path);
          else paths.push(path);
          if (paths.length + directories.length > 10000)
            throw new AccountDeletionError(
              '画像が多いため削除を完了できませんでした。お問い合わせください'
            );
        }
        if (data.length < 100) break;
      }
    }
    return paths;
  }
  const files = await collectFiles();
  for (let index = 0; index < files.length; index += 100) {
    const { error } = await bucket.remove(files.slice(index, index + 100));
    if (error)
      throw new AccountDeletionError(
        '画像の削除を完了できませんでした。アカウントは残っています。時間をおいて再試行してください'
      );
  }
  if ((await collectFiles()).length)
    throw new AccountDeletionError(
      '画像の更新があったため削除を中断しました。他の画面を閉じて再試行してください'
    );
  // auth.usersの削除と関連テーブルのCASCADEはDB内の1トランザクション。
  // 先行する個別DELETEで視聴記録だけが失われる状態を作らない。
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error)
    throw new AccountDeletionError(
      'アカウントの削除を完了できませんでした。画像は削除済みの場合があります。時間をおいて再試行してください'
    );
}
