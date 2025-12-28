import type { Anime, Season } from '../types';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * アニメを更新するユーティリティ関数
 * @param animeId 更新するアニメのID
 * @param seasons 現在のシーズン配列
 * @param updater アニメを更新する関数
 * @param user 現在のユーザー（ログイン時のみ）
 * @param supabase Supabaseクライアント
 * @param supabaseUpdater Supabaseを更新する関数（オプション）
 * @returns 更新されたシーズン配列と更新されたアニメ
 */
export async function updateAnimeInSeasons(
  animeId: number,
  seasons: Season[],
  updater: (anime: Anime) => Anime,
  user: User | null,
  supabase: SupabaseClient,
  supabaseUpdater?: (anime: Anime) => Promise<void>
): Promise<{ updatedSeasons: Season[]; updatedAnime: Anime | null }> {
  // 更新対象のアニメを探す
  let targetAnime: Anime | null = null;
  const updatedSeasons = seasons.map(season => ({
    ...season,
    animes: season.animes.map((anime) => {
      if (anime.id === animeId) {
        const updated = updater(anime);
        targetAnime = updated;
        return updated;
      }
      return anime;
    }),
  }));

  // Supabaseを更新（ログイン時のみ）
  if (user && targetAnime && supabaseUpdater) {
    try {
      await supabaseUpdater(targetAnime);
    } catch (error) {
      console.error('Failed to update anime in Supabase:', error);
    }
  }

  return {
    updatedSeasons,
    updatedAnime: targetAnime,
  };
}

