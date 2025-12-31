'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/api';

interface UseAvatarProps {
  profile: UserProfile | null;
}

export function useAvatar({ profile }: UseAvatarProps) {
  const [avatarPublicUrl, setAvatarPublicUrl] = useState<string | null>(null);

  // アバターURLを更新するヘルパー関数
  const updateAvatarUrl = useCallback((avatarUrl: string | null) => {
    if (avatarUrl) {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarUrl);
      setAvatarPublicUrl(urlData.publicUrl);
    } else {
      setAvatarPublicUrl(null);
    }
  }, []);

  // プロフィールのavatar_urlが変更されたときにURLを更新
  useEffect(() => {
    if (profile?.avatar_url) {
      updateAvatarUrl(profile.avatar_url);
    } else {
      // フォールバック: localStorageから読み込み
      if (typeof window !== 'undefined') {
        const cachedIcon = localStorage.getItem('userIcon');
        setAvatarPublicUrl(cachedIcon);
      } else {
        setAvatarPublicUrl(null);
      }
    }
  }, [profile?.avatar_url, updateAvatarUrl]);

  // ========== アバター画像アップロード ==========
  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // ファイル名を生成（user_id/timestamp.extension）
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // 古いアバターを削除（あれば）
      if (profile?.avatar_url) {
        try {
          await supabase.storage
            .from('avatars')
            .remove([profile.avatar_url]);
        } catch (e) {
          console.warn('Failed to delete old avatar:', e);
        }
      }

      // 新しいアバターをアップロード
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Avatar upload error:', error);
        return null;
      }

      return data.path;
    } catch (err) {
      console.error('Avatar upload error:', err);
      return null;
    }
  }, [profile?.avatar_url]);

  return {
    avatarPublicUrl,
    setAvatarPublicUrl,
    uploadAvatar,
    updateAvatarUrl,
  };
}

