/**
 * animes テーブルのデータアクセス層 (リポジトリ)
 *
 * これまで各コンポーネント/フックに散在していた `supabase.from('animes')` の
 * 直接クエリをここに集約する。components/ からの直呼びは ESLint で禁止し、
 * DB に関わる変更は必ずこの層を通す (エラー処理・DB制約違反の集約点)。
 *
 * 注: このリポジトリは常にブラウザ用 Proxy クライアント (app/lib/supabase) を使う。
 *     未ログイン時の localStorage フォールバックは呼び出し側 (useAnimeData 等) の責務。
 */

'use client';

import { supabase } from '../supabase';
import { SupabaseError, translateSupabaseError, logError, normalizeError } from './errors';
import { animeToSupabase } from '../../utils/helpers';
import type { Anime, SupabaseAnimeRow } from '../../types';

/**
 * ユーザーの全アニメを取得 (id 昇順)
 */
export async function getAnimesByUser(userId: string): Promise<SupabaseAnimeRow[]> {
  try {
    const { data, error } = await supabase
      .from('animes')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: true });

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'アニメ一覧の取得に失敗しました',
        undefined,
        error
      );
    }

    return data || [];
  } catch (error) {
    logError(error, 'getAnimesByUser');
    throw normalizeError(error);
  }
}

/**
 * 指定 id のアニメ行が存在するか確認し、その id を返す (存在しなければ null)。
 * 感想/いいね系が UUID 相当の実在確認に使う軽量クエリ。
 */
export async function getAnimeRowId(animeId: number, userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('animes')
    .select('id')
    .eq('id', animeId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }
  return data.id;
}

/**
 * アニメを1件追加し、挿入後の行を返す
 */
export async function insertAnime(
  anime: Anime,
  seasonName: string,
  userId: string
): Promise<SupabaseAnimeRow> {
  try {
    const payload = animeToSupabase(anime, seasonName, userId);
    const { data, error } = await supabase.from('animes').insert(payload).select();

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'アニメの追加に失敗しました',
        undefined,
        error
      );
    }

    return (data?.[0] as SupabaseAnimeRow) ?? (payload as SupabaseAnimeRow);
  } catch (error) {
    logError(error, 'insertAnime');
    throw normalizeError(error);
  }
}

/**
 * 複数アニメを一括追加し、挿入後の行を返す
 */
export async function insertAnimes(
  animes: Anime[],
  seasonName: string,
  userId: string
): Promise<SupabaseAnimeRow[]> {
  try {
    const payloads = animes.map((anime) => animeToSupabase(anime, seasonName, userId));
    const { data, error } = await supabase.from('animes').insert(payloads).select();

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'アニメの一括追加に失敗しました',
        undefined,
        error
      );
    }

    return (data as SupabaseAnimeRow[]) || [];
  } catch (error) {
    logError(error, 'insertAnimes');
    throw normalizeError(error);
  }
}

/**
 * アニメの指定フィールドを更新する。
 * user_id を必ず複合条件に含めることで、他人の行を更新できないようにする。
 */
export async function updateAnimeFields(
  animeId: number,
  userId: string,
  patch: Partial<SupabaseAnimeRow>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('animes')
      .update(patch)
      .eq('id', animeId)
      .eq('user_id', userId);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'アニメの更新に失敗しました',
        undefined,
        error
      );
    }
  } catch (error) {
    logError(error, 'updateAnimeFields');
    throw normalizeError(error);
  }
}

/**
 * アニメを削除する (id + user_id の複合条件)
 */
export async function deleteAnime(animeId: number, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('animes')
      .delete()
      .eq('id', animeId)
      .eq('user_id', userId);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'アニメの削除に失敗しました',
        undefined,
        error
      );
    }
  } catch (error) {
    logError(error, 'deleteAnime');
    throw normalizeError(error);
  }
}
