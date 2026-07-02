import { searchAnnictByTitle, extractStreamingServices, extractBroadcastTime } from './annict';
import { createBrowserSupabaseClient } from '../supabase/client';

type UpdateResult = {
  success: boolean;
  streamingSites?: string[];
  broadcastTime?: string;
  error?: string;
};

/**
 * 配信情報をタイトル検索で取得し、指定テーブルの1行を更新する共通処理。
 * animes は id が number、watchlist は id が string。
 *
 * 注: 以前は AniList ID → Annict ID マッピングを優先する分岐があったが、
 *     searchAnnictById が常に null を返す仕様のため到達不能なデッドコードだった。
 *     タイトルマッチング一本に統合した。
 */
async function updateStreamingInfo(
  table: 'animes' | 'watchlist',
  id: number | string,
  title: string
): Promise<UpdateResult> {
  try {
    const annictResults = await searchAnnictByTitle(title);

    if (!annictResults || annictResults.length === 0) {
      return { success: false, error: '配信情報が見つかりませんでした' };
    }

    const annictData = annictResults[0];
    const streamingSites = extractStreamingServices(annictData.programs.nodes);
    const broadcastTime = extractBroadcastTime(annictData.programs.nodes);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from(table)
      .update({
        streaming_sites: streamingSites,
        streaming_updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    return { success: true, streamingSites, broadcastTime: broadcastTime || undefined };
  } catch (error) {
    console.error('配信情報の更新に失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '更新に失敗しました';
    return { success: false, error: errorMessage };
  }
}

// アニメの配信情報を更新
export function updateAnimeStreamingInfo(animeId: number, title: string): Promise<UpdateResult> {
  return updateStreamingInfo('animes', animeId, title);
}

// 積みアニメの配信情報を更新
export function updateWatchlistStreamingInfo(
  watchlistId: string,
  title: string
): Promise<UpdateResult> {
  return updateStreamingInfo('watchlist', watchlistId, title);
}
