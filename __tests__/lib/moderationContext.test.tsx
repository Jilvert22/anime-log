import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
const mocks = vi.hoisted(() => ({
  user: { id: 'a' } as { id: string } | null,
  list: vi.fn(),
  block: vi.fn(),
  unblock: vi.fn(),
}));
vi.mock('../../app/hooks/useAuth', () => ({
  useAuth: () => ({ user: mocks.user, isLoading: false }),
}));
vi.mock('../../app/lib/api/moderation', () => ({
  getBlockedUsers: mocks.list,
  blockUser: mocks.block,
  unblockUser: mocks.unblock,
}));
import { ModerationProvider, useModeration } from '../../app/contexts/ModerationContext';
const wrapper = ({ children }: { children: ReactNode }) => (
  <ModerationProvider>{children}</ModerationProvider>
);
const entry = { blocked_id: 'target', blocked_label: '相手', created_at: '2026-09-07' };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'a' };
  mocks.list.mockResolvedValue([]);
});
it('ブロック中にアカウントが変わっても、新アカウントの一覧取得を無効化しない', async () => {
  let completeBlock!: (entry: unknown) => void;
  let completeList!: (entry: unknown) => void;
  mocks.block.mockReturnValue(
    new Promise((resolve) => {
      completeBlock = resolve;
    })
  );
  const { result, rerender } = renderHook(() => useModeration(), { wrapper });
  await waitFor(() => expect(result.current.ready).toBe(true));
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.block('target');
  });
  mocks.user = { id: 'b' };
  mocks.list.mockReturnValue(
    new Promise((resolve) => {
      completeList = resolve;
    })
  );
  rerender();
  await act(async () => {
    completeBlock(entry);
    await pending;
  });
  expect(result.current.entries).toEqual([]);
  await act(async () => completeList([{ ...entry, blocked_id: 'b-target' }]));
  expect(result.current.ready).toBe(true);
  expect(result.current.entries[0].blocked_id).toBe('b-target');
});
it('古い再取得結果で直前のブロックを消さない。ログアウトしたら一覧を表示しない', async () => {
  mocks.block.mockResolvedValue(entry);
  const { result, rerender } = renderHook(() => useModeration(), { wrapper });
  await waitFor(() => expect(result.current.ready).toBe(true));
  let completeList!: (entry: unknown) => void;
  mocks.list.mockReturnValue(
    new Promise((resolve) => {
      completeList = resolve;
    })
  );
  act(() => result.current.reload());
  await act(async () => result.current.block('target'));
  await act(async () => completeList([]));
  expect(result.current.blockedIds.has('target')).toBe(true);
  mocks.user = null;
  rerender();
  expect(result.current.entries).toEqual([]);
});
