import { ValidationError } from '../api/errors';
import type { WatchlistProgress } from '../api/types';

export const MAX_EPISODES = 100000;

export function validateProgress(progress: WatchlistProgress): void {
  const { watched_episodes: watched, total_episodes: total } = progress;
  if (!Number.isInteger(watched) || watched < 0 || watched > MAX_EPISODES) {
    throw new ValidationError('観た話数は0〜100000の整数で入力してください');
  }
  if (total !== null && (!Number.isInteger(total) || total < 1 || total > MAX_EPISODES)) {
    throw new ValidationError('全話数は1〜100000の整数で入力してください');
  }
  if (total !== null && watched > total) {
    throw new ValidationError('観た話数が全話数を超えています');
  }
}

export function nextProgress(progress: WatchlistProgress): WatchlistProgress {
  validateProgress(progress);
  const next = { ...progress, watched_episodes: progress.watched_episodes + 1 };
  validateProgress(next);
  return next;
}
