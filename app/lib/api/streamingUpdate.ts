import { searchAnnictByTitle, extractStreamingServices, extractBroadcastTime } from './annict';
import { createBrowserSupabaseClient } from '../supabase/client';

type UpdateResult = {
  success: boolean;
  streamingSites?: string[];
  broadcastTime?: string;
  error?: string;
};

// アニメの配信情報を更新
export async function updateAnimeStreamingInfo(
  animeId: number,
  title: string
): Promise<UpdateResult> {
  try {
    // Annictから最新情報を取得
    const annictResults = await searchAnnictByTitle(title);
    
    if (!annictResults || annictResults.length === 0) {
      return { success: false, error: '配信情報が見つかりませんでした' };
    }

    const annictData = annictResults[0];
    const streamingSites = extractStreamingServices(annictData.programs.nodes);
    const broadcastTime = extractBroadcastTime(annictData.programs.nodes);

    // DBを更新
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from('animes')
      .update({
        streaming_sites: streamingSites,
        streaming_updated_at: new Date().toISOString(),
      })
      .eq('id', animeId);

    if (error) throw error;

    return { success: true, streamingSites, broadcastTime: broadcastTime || undefined };
  } catch (error) {
    console.error('配信情報の更新に失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '更新に失敗しました';
    return { success: false, error: errorMessage };
  }
}

// 積みアニメの配信情報を更新
export async function updateWatchlistStreamingInfo(
  watchlistId: string,
  title: string
): Promise<UpdateResult> {
  try {
    // Annictから最新情報を取得
    const annictResults = await searchAnnictByTitle(title);
    
    if (!annictResults || annictResults.length === 0) {
      return { success: false, error: '配信情報が見つかりませんでした' };
    }

    const annictData = annictResults[0];
    const streamingSites = extractStreamingServices(annictData.programs.nodes);
    const broadcastTime = extractBroadcastTime(annictData.programs.nodes);

    // DBを更新
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from('watchlist')
      .update({
        streaming_sites: streamingSites,
        streaming_updated_at: new Date().toISOString(),
      })
      .eq('id', watchlistId);

    if (error) throw error;

    return { success: true, streamingSites, broadcastTime: broadcastTime || undefined };
  } catch (error) {
    console.error('配信情報の更新に失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '更新に失敗しました';
    return { success: false, error: errorMessage };
  }
}

