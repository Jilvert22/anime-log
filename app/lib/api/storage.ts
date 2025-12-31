/**
 * ストレージ関連のAPI
 * Supabase Storageのラッパー関数
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

/**
 * アバター画像をSupabase Storageにアップロード
 * @deprecated profile.tsのuploadAvatarを使用してください
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
 * ストレージからファイルを削除
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  try {
    const user = await requireAuth();

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new SupabaseError(
        translateSupabaseError(error) || 'ファイルの削除に失敗しました',
        undefined,
        error
      );
    }
  } catch (error) {
    logError(error, 'deleteFile');
    throw normalizeError(error);
  }
}

/**
 * ストレージから公開URLを取得
 */
export function getPublicUrl(bucket: string, path: string): string {
  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    logError(error, 'getPublicUrl');
    throw normalizeError(error);
  }
}

