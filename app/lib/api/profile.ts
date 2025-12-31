/**
 * プロフィール関連のAPI
 */

'use client';

import { supabase } from '../supabase';
import { requireAuth } from './auth';
import {
  SupabaseError,
  ValidationError,
  translateSupabaseError,
  logError,
  normalizeError,
} from './errors';
import type { UserProfile, UserProfileInput } from './types';

/**
 * ハンドルから@を除去して正規化
 */
function normalizeHandle(handle: string): string {
  return handle.startsWith('@') ? handle.substring(1).toLowerCase() : handle.toLowerCase();
}

/**
 * アバター画像をSupabase Storageにアップロード
 */
export async function uploadAvatar(file: File): Promise<string> {
  try {
    const user = await requireAuth();

    // ファイル拡張子を取得
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}.${extension}`;

    // 既存のアバターを削除（オプション）
    try {
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        // 古いファイルを削除（最新の1つだけ保持する場合）
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage
          .from('avatars')
          .remove(filesToDelete);
      }
    } catch (error) {
      // 既存ファイルの削除に失敗しても続行（初回アップロードの場合など）
      logError(error, 'uploadAvatar (delete existing)');
    }

    // 新しいファイルをアップロード
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'アバター画像のアップロードに失敗しました',
        undefined,
        error
      );
    }

    if (!data) {
      throw new SupabaseError('アバター画像のアップロードに失敗しました');
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    logError(error, 'uploadAvatar');
    throw normalizeError(error);
  }
}

/**
 * プロフィールを作成・更新
 */
export async function upsertUserProfile(profile: UserProfileInput): Promise<UserProfile> {
  try {
    const user = await requireAuth();

    // 既存のプロフィールを取得
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('handle')
      .eq('id', user.id)
      .single();

    // handleを正規化（@を除去、小文字に変換）
    // 空文字列の場合はnullに変換（UNIQUE制約のため）
    let normalizedHandle: string | null = null;
    if (profile.handle && profile.handle.trim() !== '') {
      normalizedHandle = normalizeHandle(profile.handle);
      // 正規化後も空文字列になった場合はnullに
      if (normalizedHandle === '') {
        normalizedHandle = null;
      } else {
        // handleが変更される場合のみ重複チェック（自分自身のハンドルは除外）
        if (existingProfile?.handle !== normalizedHandle) {
          const { data: duplicateCheck } = await supabase
            .from('user_profiles')
            .select('id, username')
            .eq('handle', normalizedHandle)
            .neq('id', user.id)
            .maybeSingle();

          if (duplicateCheck) {
            throw new ValidationError(`ハンドル「@${normalizedHandle}」は既に使用されています`);
          }
        }
      }
    }

    const normalizedProfile = {
      ...profile,
      handle: normalizedHandle,
      otaku_type: profile.otaku_type || null,
      otaku_type_custom: profile.otaku_type_custom || null,
      avatar_url: profile.avatar_url || null,
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        ...normalizedProfile,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'プロフィールの保存に失敗しました',
        undefined,
        error
      );
    }

    if (!data) {
      throw new SupabaseError('プロフィールの保存に失敗しました');
    }

    return data;
  } catch (error) {
    logError(error, 'upsertUserProfile');
    throw normalizeError(error);
  }
}

/**
 * 自分のプロフィールを取得
 */
export async function getMyProfile(): Promise<UserProfile | null> {
  try {
    const user = await requireAuth();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // プロフィールが存在しない場合はnullを返す
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new SupabaseError(
        translateSupabaseError(error) || 'プロフィールの取得に失敗しました',
        undefined,
        error
      );
    }

    return data;
  } catch (error) {
    logError(error, 'getMyProfile');
    throw normalizeError(error);
  }
}

/**
 * usernameで公開プロフィールを取得
 */
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    if (!username || !username.trim()) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .eq('is_public', true)
      .single();

    if (error) {
      // プロフィールが存在しない場合はnullを返す
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new SupabaseError(
        translateSupabaseError(error) || 'プロフィールの取得に失敗しました',
        undefined,
        error
      );
    }

    return data;
  } catch (error) {
    logError(error, 'getProfileByUsername');
    throw normalizeError(error);
  }
}

/**
 * handleで公開プロフィールを取得
 */
export async function getProfileByHandle(handle: string): Promise<UserProfile | null> {
  try {
    if (!handle || !handle.trim()) {
      return null;
    }

    const normalizedHandle = normalizeHandle(handle);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('handle', normalizedHandle)
      .eq('is_public', true)
      .single();

    if (error) {
      // プロフィールが存在しない場合はnullを返す
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new SupabaseError(
        translateSupabaseError(error) || 'プロフィールの取得に失敗しました',
        undefined,
        error
      );
    }

    return data;
  } catch (error) {
    logError(error, 'getProfileByHandle');
    throw normalizeError(error);
  }
}

