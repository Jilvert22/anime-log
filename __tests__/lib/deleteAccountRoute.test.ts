import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  admin: vi.fn(),
  authDelete: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { getUser: mocks.user } }) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.admin }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: vi.fn(), set: vi.fn() }) }));
vi.mock('../../app/lib/env', () => ({
  getSupabaseEnv: () => ({ url: 'https://fixture.invalid', anonKey: 'fixture' }),
  getSupabaseServiceRoleKey: () => 'fixture-admin',
}));
import { POST } from '../../app/api/delete-account/route';
const owner = '11111111-1111-4111-8111-111111111111';
function request(body: unknown = {}) {
  return new NextRequest('https://animelog.jp/api/delete-account', {
    method: 'POST',
    headers: { origin: 'https://animelog.jp', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ data: { user: { id: owner } }, error: null });
  mocks.authDelete.mockResolvedValue({ error: null });
  mocks.list.mockResolvedValue({ data: [], error: null });
  mocks.remove.mockResolvedValue({ error: null });
  const q = {
    delete: vi.fn(() => q),
    eq: vi.fn(() => q),
    or: vi.fn(() => q),
    then: (resolve: (r: unknown) => void) => Promise.resolve({ error: null }).then(resolve),
  };
  mocks.admin.mockReturnValue({
    from: () => q,
    storage: { from: () => ({ list: mocks.list, remove: mocks.remove }) },
    auth: { admin: { deleteUser: mocks.authDelete } },
  });
});
it('未認証では管理者クライアントを作らない', async () => {
  mocks.user.mockResolvedValue({ data: { user: null }, error: null });
  expect((await POST(request())).status).toBe(401);
  expect(mocks.admin).not.toHaveBeenCalled();
});
it('削除対象は本文で指定された他者IDではなく認証したユーザー', async () => {
  expect((await POST(request({ userId: 'other', expectedUserId: owner }))).status).toBe(200);
  expect(mocks.authDelete).toHaveBeenCalledWith(owner);
});

it('別オリジンや確認後に切り替わったアカウントを削除しない', async () => {
  const cross = new NextRequest('https://animelog.jp/api/delete-account', {
    method: 'POST',
    headers: { origin: 'https://other.invalid' },
    body: JSON.stringify({ expectedUserId: owner }),
  });
  expect((await POST(cross)).status).toBe(403);
  expect((await POST(request({ expectedUserId: 'another' }))).status).toBe(409);
  expect(mocks.admin).not.toHaveBeenCalled();
});
it('画像一覧のエラーではAuthを削除しない', async () => {
  mocks.list.mockResolvedValue({ data: null, error: { message: 'private internals' } });
  const response = await POST(request({ expectedUserId: owner }));
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain('private internals');
  expect(mocks.authDelete).not.toHaveBeenCalled();
});
it('Auth削除の失敗を成功にせず、内部エラーを公開しない', async () => {
  mocks.authDelete.mockResolvedValue({ error: { message: 'secret details' } });
  const response = await POST(request({ expectedUserId: owner }));
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain('secret details');
});
