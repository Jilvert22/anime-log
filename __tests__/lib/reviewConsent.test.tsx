import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import type { Anime } from '../../app/types';
const mocks = vi.hoisted(() => ({ create: vi.fn().mockResolvedValue(undefined), toast: vi.fn() }));
vi.mock('../../app/lib/api/reviews', () => ({ createReview: mocks.create }));
vi.mock('../../app/contexts/FeedbackContext', () => ({
  useFeedback: () => ({ showToast: mocks.toast }),
}));
import { ReviewModal } from '../../app/components/modals/ReviewModal';
it('規約への明示同意まで投稿できず、同意後にだけ保存する', async () => {
  render(
    <ReviewModal
      show
      onClose={vi.fn()}
      selectedAnime={{ id: 'anime', title: '作品' } as Anime}
      user={{ id: 'owner' } as User}
      userName="自分"
      userIcon="👤"
      onReviewPosted={async () => {}}
    />
  );
  fireEvent.change(screen.getByPlaceholderText('感想を入力してください...'), {
    target: { value: '感想本文' },
  });
  const submit = screen.getByRole('button', { name: '投稿' });
  expect(submit).toBeDisabled();
  fireEvent.click(submit);
  expect(mocks.create).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('checkbox', { name: /利用規約・禁止事項/ }));
  fireEvent.click(submit);
  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
});
