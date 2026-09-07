import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { deleteAccount } from '../../app/lib/api/accountDeletion';
const owner = '11111111-1111-4111-8111-111111111111';
function client(
  list: ReturnType<typeof vi.fn>,
  remove = vi.fn().mockResolvedValue({ error: null }),
  authDelete = vi.fn().mockResolvedValue({ error: null })
) {
  return {
    admin: {
      storage: { from: () => ({ list, remove }) },
      auth: { admin: { deleteUser: authDelete } },
    } as unknown as SupabaseClient,
    remove,
    authDelete,
  };
}
it('100件を超える画像とサブフォルダを列挙し、本人のパスだけ削除する', async () => {
  let removed = false;
  const list = vi.fn(async (path: string, options: { offset: number }) => ({
    error: null,
    data: removed
      ? []
      : path === owner
        ? options.offset === 0
          ? [
              { id: null, name: 'nested' },
              ...Array.from({ length: 99 }, (_, i) => ({ id: String(i), name: `image${i}` })),
            ]
          : [{ id: 'last', name: 'last.jpg' }]
        : [{ id: 'nestedfile', name: 'avatar.png' }],
  }));
  const remove = vi.fn(async () => {
    removed = true;
    return { error: null };
  });
  const c = client(list, remove);
  await deleteAccount(c.admin, owner);
  expect(remove.mock.calls).toHaveLength(2);
  const paths = (remove.mock.calls as unknown as [string[]][]).flatMap((call) => call[0]);
  expect(paths).toHaveLength(101);
  expect(paths).toContain(`${owner}/nested/avatar.png`);
  expect(paths.every((path) => path.startsWith(`${owner}/`))).toBe(true);
  expect(list).toHaveBeenCalledWith(owner, expect.objectContaining({ offset: 100 }));
  expect(c.authDelete).toHaveBeenCalledWith(owner);
});
it('画像削除エラーでも再試行のためアカウントを残す', async () => {
  const c = client(
    vi.fn().mockResolvedValue({ data: [{ id: 'one', name: 'avatar.png' }], error: null }),
    vi.fn().mockResolvedValue({ error: { message: 'failed' } })
  );
  await expect(deleteAccount(c.admin, owner)).rejects.toThrow('アカウントは残っています');
  expect(c.authDelete).not.toHaveBeenCalled();
});
it('削除後に新しい画像が見つかった場合もアカウントを消さない', async () => {
  const c = client(
    vi.fn().mockResolvedValue({ data: [{ id: 'one', name: 'avatar.png' }], error: null })
  );
  await expect(deleteAccount(c.admin, owner)).rejects.toThrow('更新があった');
  expect(c.authDelete).not.toHaveBeenCalled();
});
it('一覧に不正なパスがあればStorageを変更しない', async () => {
  const c = client(
    vi.fn().mockResolvedValue({ data: [{ id: 'one', name: '../other.png' }], error: null })
  );
  await expect(deleteAccount(c.admin, owner)).rejects.toThrow('保存先');
  expect(c.remove).not.toHaveBeenCalled();
  expect(c.authDelete).not.toHaveBeenCalled();
});
