'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/api';
import { upsertUserProfile, onAuthStateChange } from '../lib/api';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarPublicUrl, setAvatarPublicUrl] = useState<string | null>(null);
  const [favoriteAnimeIds, setFavoriteAnimeIds] = useState<number[]>([]);

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
        
        // アバターURLを取得
        if (data.avatar_url) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.avatar_url);
          setAvatarPublicUrl(urlData.publicUrl);
        } else {
          setAvatarPublicUrl(null);
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
          console.error('Profile create error:', createError);
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
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(parsed.avatar_url);
            setAvatarPublicUrl(urlData.publicUrl);
          }
        } catch (e) {
          console.error('Failed to parse cached profile:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(savedProfile.avatar_url);
        setAvatarPublicUrl(urlData.publicUrl);
      } else {
        setAvatarPublicUrl(null);
      }

      // localStorageにもキャッシュ
      localStorage.setItem('userProfile', JSON.stringify(savedProfile));

      return { success: true, data: savedProfile };
    } catch (err) {
      console.error('Profile save error:', err);
      return { success: false, error: 'Unknown error' };
    }
  }, [uploadAvatar]);

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
        setAvatarPublicUrl(null);
        localStorage.removeItem('userProfile');
      }
    });

    return () => unsubscribe();
  }, [loadProfile]);

  // localStorageからfavoriteAnimeIdsを読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favoriteAnimeIds');
      if (saved) {
        try {
          setFavoriteAnimeIds(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse favoriteAnimeIds', e);
        }
      }
    }
  }, []);

  // favoriteAnimeIdsをlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('favoriteAnimeIds', JSON.stringify(favoriteAnimeIds));
    }
  }, [favoriteAnimeIds]);

  // ========== 後方互換性のための値 ==========
  // 既存のコードが userName, userIcon を参照している場合に対応
  const userName = profile?.username || 'ユーザー';
  const userIcon = avatarPublicUrl || (typeof window !== 'undefined' ? localStorage.getItem('userIcon') : null) || null;
  const userHandle = profile?.handle || null;
  const userOtakuType = profile?.otaku_type_custom || profile?.otaku_type || '';
  const otakuType = profile?.otaku_type || 'auto';
  const otakuTypeCustom = profile?.otaku_type_custom || null;
  const isProfilePublic = profile?.is_public || false;
  const userBio = profile?.bio || '';
  const myProfile = profile;

  return {
    // 新しいAPI
    profile,
    loading,
    avatarPublicUrl,
    saveProfile,
    saveOtakuType,
    loadProfile,
    
    // 後方互換性
    userName,
    userIcon,
    userHandle,
    userOtakuType,
    otakuType,
    otakuTypeCustom,
    isProfilePublic,
    userBio,
    myProfile,
    favoriteAnimeIds,
    setFavoriteAnimeIds,
    
    // 既存のsetterも維持（必要に応じて）
    setUserName: (name: string) => saveProfile({ username: name }),
    setUserIcon: (file: File) => saveProfile({ avatarFile: file }),
    setUserHandle: (handle: string | null) => saveProfile({ handle }),
    setUserOtakuType: (type: string) => {
      // localStorageに保存（後でSupabaseに保存される）
      if (typeof window !== 'undefined') {
        localStorage.setItem('userOtakuType', type);
      }
    },
    setIsProfilePublic: (isPublic: boolean) => saveProfile({ is_public: isPublic }),
    setUserBio: (bio: string) => saveProfile({ bio }),
    setMyProfile: (profile: UserProfile | null) => setProfile(profile),
  };
}
