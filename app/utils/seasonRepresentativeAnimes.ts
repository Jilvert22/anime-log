/**
 * シーズンの覇権アニメを取得するユーティリティ関数
 */

import { searchAnimeBySeason, type AniListMedia } from '../lib/api/anilist';
import { parseSeasonName } from './helpers';

export type DominantAnime = {
  id: number;
  title: string;
  image: string;
  averageScore: number | null;
};

/**
 * シーズンの覇権アニメを取得する関数
 * AniList APIからそのシーズンのアニメを人気順（POPULARITY_DESC）で取得し、上位1-3個を返す
 * 覇権アニメ = そのクールで最も話題になった・最も視聴されたアニメ（人気度基準）
 * 
 * @param seasonName シーズン名（例: "2024年春"）
 * @param limit 取得する件数（デフォルト: 3）
 * @returns 覇権アニメの配列
 */
export async function getDominantAnimes(
  seasonName: string,
  limit: number = 3
): Promise<DominantAnime[]> {
  // シーズン名を解析
  const parsed = parseSeasonName(seasonName);
  if (!parsed) {
    return [];
  }

  const { year, season } = parsed;

  try {
    // AniList APIからそのシーズンのアニメを人気順（POPULARITY_DESC）で取得
    // searchAnimeBySeasonは既にPOPULARITY_DESCでソートされているので、そのまま上位を取得
    const result = await searchAnimeBySeason(season, year, 1, limit);

    // 人気順で取得した上位をそのまま返す（覇権アニメは人気度基準）
    const dominantAnimes = result.media
      .slice(0, limit)
      .map((anime): DominantAnime => ({
        id: anime.id,
        title: anime.title?.romaji || anime.title?.native || 'タイトル不明',
        image: anime.coverImage?.large || anime.coverImage?.medium || '',
        averageScore: anime.averageScore || null,
      }));

    return dominantAnimes;
  } catch (error) {
    console.error('覇権アニメの取得に失敗しました:', error);
    return [];
  }
}

