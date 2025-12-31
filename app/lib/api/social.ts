/**
 * SNS機能（フォロー・フォロワー）関連のAPI
 */

'use client';

import { supabase } from '../supabase';
import { requireAuth } from './auth';
import {
  SupabaseError,
  translateSupabaseError,
  logError,
  normalizeError,
} from './errors';
import type { UserProfile, FollowCounts } from './types';

/**
 * ハンドル形式かどうかを判定する関数（@で始まる、英数字・アンダースコア・ハイフンのみ）
 */
function isHandle(str: string): boolean {
  const handleRegex = /^@?[a-z0-9_]+$/i;
  return handleRegex.test(str);
}

/**
 * ハンドルから@を除去して正規化
 */
function normalizeHandle(handle: string): string {
  return handle.startsWith('@') ? handle.substring(1).toLowerCase() : handle.toLowerCase();
}

/**
 * ユーザー検索（ユーザー名またはハンドルで検索）
 */
export async function searchUsers(query: string): Promise<UserProfile[]> {
  try {
    if (!query.trim()) {
      return [];
    }

    const trimmedQuery = query.trim();

    // ハンドル形式の場合はhandleで検索
    if (isHandle(trimmedQuery)) {
      const normalizedHandle = normalizeHandle(trimmedQuery);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('handle', normalizedHandle)
        .eq('is_public', true)
        .limit(20);

      if (error) {
        throw new SupabaseError(
          translateSupabaseError(error) || 'ユーザー検索に失敗しました',
          undefined,
          error
        );
      }

      return data || [];
    }

    // ユーザー名で検索
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .ilike('username', `%${trimmedQuery}%`)
      .eq('is_public', true)
      .limit(20);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'ユーザー検索に失敗しました',
        undefined,
        error
      );
    }

    return data || [];
  } catch (error) {
    logError(error, 'searchUsers');
    throw normalizeError(error);
  }
}

/**
 * おすすめユーザー取得（公開プロフィールのユーザー）
 */
export async function getRecommendedUsers(limit: number = 10): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'おすすめユーザーの取得に失敗しました',
        undefined,
        error
      );
    }

    return data || [];
  } catch (error) {
    logError(error, 'getRecommendedUsers');
    throw normalizeError(error);
  }
}

/**
 * ユーザーをフォロー
 */
export async function followUser(followingId: string): Promise<void> {
  try {
    const user = await requireAuth();

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: followingId,
      });

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'フォローに失敗しました',
        undefined,
        error
      );
    }
  } catch (error) {
    logError(error, 'followUser');
    throw normalizeError(error);
  }
}

/**
 * ユーザーのフォローを解除
 */
export async function unfollowUser(followingId: string): Promise<void> {
  try {
    const user = await requireAuth();

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'フォロー解除に失敗しました',
        undefined,
        error
      );
    }
  } catch (error) {
    logError(error, 'unfollowUser');
    throw normalizeError(error);
  }
}

/**
 * フォロワー一覧取得
 */
export async function getFollowers(userId: string): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'フォロワー一覧の取得に失敗しました',
        undefined,
        error
      );
    }

    if (!data || data.length === 0) {
      return [];
    }

    const followerIds = data.map((item: { follower_id: string }) => item.follower_id);

    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', followerIds);

    if (profilesError) {
      throw new SupabaseError(
        translateSupabaseError(profilesError) || 'フォロワープロフィールの取得に失敗しました',
        undefined,
        profilesError
      );
    }

    return profiles || [];
  } catch (error) {
    logError(error, 'getFollowers');
    throw normalizeError(error);
  }
}

/**
 * フォロー中一覧取得
 */
export async function getFollowing(userId: string): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'フォロー中一覧の取得に失敗しました',
        undefined,
        error
      );
    }

    if (!data || data.length === 0) {
      return [];
    }

    const followingIds = data.map((item: { following_id: string }) => item.following_id);

    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', followingIds);

    if (profilesError) {
      throw new SupabaseError(
        translateSupabaseError(profilesError) || 'フォロー中プロフィールの取得に失敗しました',
        undefined,
        profilesError
      );
    }

    return profiles || [];
  } catch (error) {
    logError(error, 'getFollowing');
    throw normalizeError(error);
  }
}

/**
 * 公開プロフィール取得
 */
export async function getPublicProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .eq('is_public', true)
      .single();

    if (error) {
      // プロフィールが存在しない場合はnullを返す
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new SupabaseError(
        translateSupabaseError(error) || '公開プロフィールの取得に失敗しました',
        undefined,
        error
      );
    }

    return data;
  } catch (error) {
    logError(error, 'getPublicProfile');
    throw normalizeError(error);
  }
}

/**
 * 公開アニメ一覧取得
 */
export async function getPublicAnimes(userId: string): Promise<unknown[]> {
  try {
    const { data, error } = await supabase
      .from('animes')
      .select('*')
      .eq('user_id', userId)
      .eq('watched', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || '公開アニメ一覧の取得に失敗しました',
        undefined,
        error
      );
    }

    return data || [];
  } catch (error) {
    logError(error, 'getPublicAnimes');
    throw normalizeError(error);
  }
}

/**
 * フォロー状態を確認
 */
export async function isFollowing(followingId: string): Promise<boolean> {
  try {
    const user = await requireAuth();

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    // 認証エラーやその他のエラーはfalseを返す
    return false;
  }
}

/**
 * フォロー数・フォロワー数を取得
 */
export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  try {
    const [followingResult, followersResult] = await Promise.all([
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId),
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId),
    ]);

    return {
      following: followingResult.count || 0,
      followers: followersResult.count || 0,
    };
  } catch (error) {
    logError(error, 'getFollowCounts');
    throw normalizeError(error);
  }
}

