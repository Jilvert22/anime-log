// app/lib/api/anime-mapping.ts
import { arm } from '@kawaiioverflow/arm';

/**
 * AniList IDからAnnict IDを取得
 * @param anilistId AniList ID
 * @returns Annict ID（見つからない場合はnull）
 */
export function getAnnictIdFromAniList(anilistId: number): number | null {
  const mapping = arm.find(item => item.anilist_id === anilistId);
  return mapping?.annict_id ?? null;
}

