import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
const mock = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
}));
vi.mock('../../app/lib/api', () => mock);
import { useAuth } from '../../app/hooks/useAuth';
let listener: (event: AuthChangeEvent, session: Session | null) => void;
beforeEach(() => {
  vi.clearAllMocks();
  mock.onAuthStateChange.mockImplementation((callback) => {
    listener = callback;
    return () => {};
  });
  mock.signOut.mockResolvedValue(undefined);
  mock.getSession.mockResolvedValue(null);
});
it('サインアウトの通知と明示ログアウトでゲスト記録を削除しない', async () => {
  const { result } = renderHook(() => useAuth());
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  act(() => listener('SIGNED_OUT', null));
  await act(async () => {
    await result.current.handleLogout();
  });
  expect(localStorage.removeItem).not.toHaveBeenCalled();
});
it('ログアウト後に到着した初回セッションで古いアカウントへ戻さない', async () => {
  let resolve!: (session: Session) => void;
  mock.getSession.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  const { result } = renderHook(() => useAuth());
  act(() => listener('SIGNED_OUT', null));
  await act(async () => {
    resolve({ user: { id: 'old-owner' } } as Session);
  });
  expect(result.current.user).toBeNull();
  expect(result.current.isLoading).toBe(false);
});
