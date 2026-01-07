/**
 * Supabaseクエリの共通ヘルパー関数
 * 重複するクエリパターンを抽出して再利用可能にする
 */

import { supabase } from '../supabase';
import { SupabaseError, translateSupabaseError, logError, normalizeError } from './errors';

/**
 * ユーザーIDでフィルタリングされたクエリを構築
 */
export function queryByUserId<T>(
  table: string,
  userId: string,
  select: string = '*'
) {
  return supabase
    .from(table)
    .select(select)
    .eq('user_id', userId);
}

/**
 * 単一レコードを取得（エラーハンドリング付き）
 */
export async function getSingleRecord<T>(
  table: string,
  userId: string,
  id: number | string,
  idColumn: string = 'id'
): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .eq(idColumn, id)
      .single();

    if (error) {
      // レコードが見つからない場合はnullを返す（エラーではない）
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new SupabaseError(
        translateSupabaseError(error) || `${table}の取得に失敗しました`,
        undefined,
        error
      );
    }

    return data as T;
  } catch (error) {
    logError(error, `getSingleRecord:${table}`);
    throw normalizeError(error);
  }
}

/**
 * レコードを挿入（エラーハンドリング付き）
 */
export async function insertRecord<T>(
  table: string,
  userId: string,
  data: Record<string, unknown>
): Promise<T> {
  try {
    const { data: insertedData, error } = await supabase
      .from(table)
      .insert({
        ...data,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || `${table}への追加に失敗しました`,
        undefined,
        error
      );
    }

    if (!insertedData) {
      throw new SupabaseError(`${table}への追加に失敗しました`);
    }

    return insertedData as T;
  } catch (error) {
    logError(error, `insertRecord:${table}`);
    throw normalizeError(error);
  }
}

/**
 * レコードを更新（エラーハンドリング付き）
 */
export async function updateRecord<T>(
  table: string,
  userId: string,
  id: number | string,
  updates: Record<string, unknown>,
  idColumn: string = 'id'
): Promise<T> {
  try {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('user_id', userId)
      .eq(idColumn, id)
      .select()
      .single();

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || `${table}の更新に失敗しました`,
        undefined,
        error
      );
    }

    if (!data) {
      throw new SupabaseError(`${table}の更新に失敗しました`);
    }

    return data as T;
  } catch (error) {
    logError(error, `updateRecord:${table}`);
    throw normalizeError(error);
  }
}

/**
 * レコードを削除（エラーハンドリング付き）
 */
export async function deleteRecord(
  table: string,
  userId: string,
  id: number | string,
  idColumn: string = 'id'
): Promise<void> {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId)
      .eq(idColumn, id);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || `${table}の削除に失敗しました`,
        undefined,
        error
      );
    }
  } catch (error) {
    logError(error, `deleteRecord:${table}`);
    throw normalizeError(error);
  }
}

/**
 * 複数レコードを取得（エラーハンドリング付き）
 */
export async function getRecords<T>(
  table: string,
  userId: string,
  options: {
    select?: string;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    limit?: number;
    filters?: Array<{ column: string; operator: string; value: unknown }>;
  } = {}
): Promise<T[]> {
  try {
    let query = supabase
      .from(table)
      .select(options.select || '*')
      .eq('user_id', userId);

    // フィルターを適用
    if (options.filters) {
      for (const filter of options.filters) {
        query = query.filter(filter.column, filter.operator, filter.value);
      }
    }

    // ソートを適用
    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc',
      });
    }

    // リミットを適用
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || `${table}の取得に失敗しました`,
        undefined,
        error
      );
    }

    return (data || []) as T[];
  } catch (error) {
    logError(error, `getRecords:${table}`);
    throw normalizeError(error);
  }
}

