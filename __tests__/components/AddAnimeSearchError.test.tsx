import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AddAnimeFormModal } from '../../app/components/modals/AddAnimeFormModal';
import { searchAnime } from '../../app/lib/api/anilist';

vi.mock('../../app/lib/api/anilist', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../app/lib/api/anilist')>()),
  searchAnime: vi.fn(),
}));
vi.mock('../../app/lib/api/annict', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../app/lib/api/annict')>()),
  searchAnnictByTitle: vi.fn().mockResolvedValue([]),
  mergeWithAnnictData: vi.fn(async (items) => items),
}));
vi.mock('../../app/contexts/FeedbackContext', () => ({
  useFeedback: () => ({ showToast: vi.fn() }),
}));

it('検索前と障害時には0件を表示せず、再試行後に正常な0件を表示する', async () => {
  vi.mocked(searchAnime).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  render(
    <AddAnimeFormModal
      show
      onClose={vi.fn()}
      seasons={[]}
      setSeasons={vi.fn()}
      expandedSeasons={new Set()}
      setExpandedSeasons={vi.fn()}
      user={null}
      extractSeriesName={() => undefined}
      getSeasonName={(value) => value}
      animeToSupabase={vi.fn()}
    />
  );
  fireEvent.change(screen.getByPlaceholderText('アニメタイトルで検索'), {
    target: { value: 'ui-retry' },
  });
  expect(screen.queryByText('検索結果が見つかりませんでした')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^検索$/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('作品検索に接続できませんでした');
  expect(screen.queryByText('検索結果が見つかりませんでした')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '再試行' }));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(screen.getByText('検索結果が見つかりませんでした')).toBeInTheDocument();
  expect(searchAnime).toHaveBeenCalledTimes(2);
});
