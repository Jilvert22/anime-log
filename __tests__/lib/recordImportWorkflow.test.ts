import { beforeEach, expect, it, vi } from 'vitest';
import type { RecordBundle } from '../../app/lib/records/importValidation';
const mock = vi.hoisted(() => ({ session: vi.fn(), read: vi.fn(), save: vi.fn() }));
vi.mock('../../app/lib/api/auth', () => ({ getSession: mock.session }));
vi.mock('../../app/lib/api/recordImport', () => ({
  getAccountRecords: mock.read,
  importAccountRecords: mock.save,
}));
import { applyImport, createImportPreview } from '../../app/lib/records/importWorkflow';
const source: RecordBundle = {
  seasons: [
    {
      name: '2026年夏',
      animes: [{ id: 1, title: '手動作品', image: '', rating: 4, watched: true }],
    },
  ],
  watchlist: [],
};
beforeEach(() => {
  vi.clearAllMocks();
  mock.session.mockResolvedValue({ user: { id: 'owner-a' } });
  mock.read.mockResolvedValue({ seasons: [], watchlist: [] });
  mock.save.mockResolvedValue({ animes_added: 1, watchlist_added: 0 });
});
it('確認したアカウントが切り替わったら書き込まない', async () => {
  const preview = await createImportPreview(source, 'owner-a');
  mock.session.mockResolvedValue({ user: { id: 'owner-b' } });
  await expect(applyImport(preview)).rejects.toThrow('ログイン状態');
  expect(mock.save).not.toHaveBeenCalled();
});
it('確認後に既存データが変わったら再確認を求める', async () => {
  const preview = await createImportPreview(source, 'owner-a');
  mock.read.mockResolvedValue(source);
  await expect(applyImport(preview)).rejects.toThrow('確認後');
  expect(mock.save).not.toHaveBeenCalled();
});
it('保存後に応答を失っても、再確認で保存済み手動作品を重複追加しない', async () => {
  const preview = await createImportPreview(source, 'owner-a');
  mock.save.mockImplementation(async (_owner, saved) => {
    mock.read.mockResolvedValue({
      ...saved,
      seasons: saved.seasons.map((season: RecordBundle['seasons'][number]) => ({
        ...season,
        animes: season.animes.map((anime) => ({ ...anime, id: 'new-db-uuid' })),
      })),
    });
    throw new Error('response lost');
  });
  await expect(applyImport(preview)).rejects.toThrow('response lost');
  const again = await createImportPreview(source, 'owner-a');
  expect(again.plan.animeCount).toBe(0);
  expect(again.plan.skipped).toBe(1);
  expect(localStorage.removeItem).not.toHaveBeenCalled();
});
it('ゲスト向けの確認中にログインした場合も保存先を勝手に変更しない', async () => {
  mock.session.mockResolvedValue({ user: { id: 'owner-a' } });
  await expect(createImportPreview(source, null)).rejects.toThrow('ログイン状態');
  expect(mock.read).not.toHaveBeenCalled();
  expect(mock.save).not.toHaveBeenCalled();
});
