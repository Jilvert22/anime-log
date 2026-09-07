import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  auth: vi.fn(),
  block: vi.fn(),
  toast: vi.fn(),
  confirm: vi.fn(),
}));
vi.mock('../../app/lib/supabase', () => ({ supabase: { from: mocks.from, rpc: mocks.rpc } }));
vi.mock('../../app/lib/api/auth', () => ({ requireAuth: mocks.auth }));
vi.mock('../../app/contexts/ModerationContext', () => ({
  useModeration: () => ({
    user: { id: 'owner' },
    isLoading: false,
    ready: true,
    error: false,
    block: mocks.block,
  }),
}));
vi.mock('../../app/contexts/FeedbackContext', () => ({
  useFeedback: () => ({ showToast: mocks.toast, confirmDialog: mocks.confirm }),
}));
import { blockUser, reportContent, unblockUser } from '../../app/lib/api/moderation';
import { ContentActions } from '../../app/components/moderation/ContentActions';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ id: 'owner' });
  mocks.confirm.mockResolvedValue(true);
});

describe('通報・ブロックAPI', () => {
  it('認証済み所有者をRPCへ固定し本文を整える', async () => {
    mocks.rpc.mockResolvedValue({ data: 'report-id', error: null });
    expect(await reportContent({ type: 'review', id: 'review' }, 'spam', ' 補足 ', 'owner')).toBe(
      'report-id'
    );
    expect(mocks.rpc).toHaveBeenCalledWith('submit_content_report', {
      expected_reporter: 'owner',
      target_kind: 'review',
      target: 'review',
      report_reason: 'spam',
      report_details: '補足',
    });
  });
  it('アカウントが変わった操作と自己ブロックを実行しない', async () => {
    await expect(blockUser('target', 'old-owner')).rejects.toThrow('アカウント');
    await expect(unblockUser('target', 'old-owner')).rejects.toThrow('アカウント');
    await expect(
      reportContent({ type: 'user', id: 'target' }, 'spam', '', 'old-owner')
    ).rejects.toThrow('アカウント');
    await expect(blockUser('owner', 'owner')).rejects.toThrow('自分');
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('解除は所有者と対象の両方で絞る', async () => {
    const query = {
      delete: vi.fn(() => query),
      eq: vi.fn(() => query),
      then: (done: (result: unknown) => void) => Promise.resolve({ error: null }).then(done),
    };
    mocks.from.mockReturnValue(query);
    await unblockUser('target', 'owner');
    expect(query.eq.mock.calls).toEqual([
      ['blocker_id', 'owner'],
      ['blocked_id', 'target'],
    ]);
  });
  it('上限と不正な本文を成功にしない', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'P0001' } });
    await expect(
      reportContent({ type: 'review', id: 'review' }, 'spam', '', 'owner')
    ).rejects.toThrow('上限');
    mocks.rpc.mockClear();
    await expect(
      reportContent({ type: 'review', id: 'review' }, 'spam', 'a'.repeat(1001), 'owner')
    ).rejects.toThrow('1000');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
describe('通報・ブロック画面', () => {
  it('通報失敗時に入力を保持して再送でき、保存成功後に閉じる', async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: null, error: { code: '500' } })
      .mockResolvedValueOnce({ data: 'report', error: null });
    render(<ContentActions userId="target" userName="相手" reviewId="review" />);
    fireEvent.click(screen.getByText('通報・ブロック'));
    fireEvent.click(screen.getByText('この感想を通報'));
    fireEvent.change(screen.getByLabelText(/補足/), { target: { value: '保持する本文' } });
    fireEvent.click(screen.getByText('通報を送信'));
    expect(await screen.findByRole('alert')).toHaveTextContent('保存できません');
    expect(screen.getByLabelText(/補足/)).toHaveValue('保持する本文');
    fireEvent.click(screen.getByText('通報を送信'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mocks.toast).toHaveBeenCalledTimes(1);
  });
  it('二重クリックでもブロック確認と実行は一度だけ', async () => {
    let accept!: (value: boolean) => void;
    mocks.confirm.mockReturnValue(
      new Promise<boolean>((resolve) => {
        accept = resolve;
      })
    );
    render(<ContentActions userId="target" userName="相手" />);
    fireEvent.click(screen.getByText('通報・ブロック'));
    fireEvent.click(screen.getByText('ブロックする'));
    fireEvent.click(screen.getByText('ブロックする'));
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
    await act(async () => accept(true));
    expect(mocks.block).toHaveBeenCalledTimes(1);
  });
  it('自分自身には通報メニューを出さない', () => {
    const { container } = render(<ContentActions userId="owner" userName="自分" />);
    expect(container).toBeEmptyDOMElement();
  });
});
