'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/api';
import { upsertUserProfile, onAuthStateChange } from '../lib/api';
import { ApiError } from '../lib/api/errors';

interface UseProfileProps {
  updateAvatarUrl: (avatarUrl: string | null) => void;
  uploadAvatar: (file: File) => Promise<string | null>;
}

export function useProfile({ updateAvatarUrl, uploadAvatar }: UseProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ========== プロフィール読み込み ==========
  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Supabaseからプロフィール取得
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile load error:', error);
      }

      if (data) {
        setProfile(data);
        
        // アバターURLを更新
        if (data.avatar_url) {
          updateAvatarUrl(data.avatar_url);
        } else {
          updateAvatarUrl(null);
        }

        // localStorageにもキャッシュ（オフライン対応）
        localStorage.setItem('userProfile', JSON.stringify(data));
      } else {
        // プロフィールが存在しない場合、新規作成
        const newProfile: Partial<UserProfile> = {
          id: user.id,
          username: user.email?.split('@')[0] || 'ユーザー',
          otaku_type: 'auto',
          is_public: false,
        };
        
        const { data: created, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();
        
        if (createError) {
          console.error('Profile create error:', {
            code: createError.code,
            message: createError.message,
            details: createError.details,
            hint: createError.hint,
            error: createError,
          });
        } else if (created) {
          setProfile(created);
          localStorage.setItem('userProfile', JSON.stringify(created));
        }
      }
    } catch (err) {
      console.error('Profile load error:', err);
      
      // オフライン時はlocalStorageから読み込み
      const cached = localStorage.getItem('userProfile');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setProfile(parsed);
          if (parsed.avatar_url) {
            updateAvatarUrl(parsed.avatar_url);
          } else {
            updateAvatarUrl(null);
          }
        } catch (e) {
          console.error('Failed to parse cached profile:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [updateAvatarUrl]);

  // ========== プロフィール保存 ==========
  const saveProfile = useCallback(async (updates: {
    username?: string;
    handle?: string | null;
    bio?: string | null;
    is_public?: boolean;
    avatarFile?: File | null;
    otaku_type?: string;
    otaku_type_custom?: string | null;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const updateData: Partial<UserProfile> = {};

      // アバター画像のアップロード
      if (updates.avatarFile) {
        const avatarPath = await uploadAvatar(updates.avatarFile);
        if (avatarPath) {
          updateData.avatar_url = avatarPath;
        }
      }

      // 新APIを使用してプロフィールを保存
      const savedProfile = await upsertUserProfile({
        username: updates.username ?? profile?.username ?? 'ユーザー',
        handle: updates.handle !== undefined ? updates.handle : (profile?.handle ?? null),
        bio: updates.bio !== undefined && updates.bio !== null ? updates.bio : (profile?.bio ? profile.bio : undefined),
        is_public: updates.is_public ?? profile?.is_public ?? false,
        otaku_type: updates.otaku_type ?? profile?.otaku_type ?? null,
        otaku_type_custom: updates.otaku_type_custom ?? profile?.otaku_type_custom ?? null,
        avatar_url: updateData.avatar_url ?? profile?.avatar_url ?? null,
      });

      // 状態を更新
      setProfile(savedProfile);
      
      // アバターURLを更新
      if (savedProfile.avatar_url) {
        updateAvatarUrl(savedProfile.avatar_url);
      } else {
        updateAvatarUrl(null);
      }

      // localStorageにもキャッシュ
      localStorage.setItem('userProfile', JSON.stringify(savedProfile));

      return { success: true, data: savedProfile };
    } catch (err) {
      console.error('Profile save error:', err);
      
      // エラーメッセージを取得
      let errorMessage = 'プロフィールの保存に失敗しました';
      if (err instanceof ApiError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }, [profile, uploadAvatar, updateAvatarUrl]);

  // ========== オタクタイプのみ保存（簡易版） ==========
  const saveOtakuType = useCallback(async (type: string, customText?: string) => {
    return saveProfile({
      otaku_type: type === 'auto' ? 'auto' : (customText ? 'custom' : type),
      otaku_type_custom: customText || null,
    });
  }, [saveProfile]);

  // ========== 初期化 ==========
  useEffect(() => {
    loadProfile();

    // 認証状態の変化を監視
    const unsubscribe = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        loadProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        updateAvatarUrl(null);
        localStorage.removeItem('userProfile');
      }
    });

    return () => unsubscribe();
  }, [loadProfile, updateAvatarUrl]);

  return {
    profile,
    loading,
    saveProfile,
    saveOtakuType,
    loadProfile,
    setProfile,
  };
}

