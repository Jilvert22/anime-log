'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProfile } from './useProfile';
import { useAvatar } from './useAvatar';
import { useFavoriteAnime } from './useFavoriteAnime';
import type { UserProfile } from '../lib/api';

export function useUserProfile() {
  // お気に入りアニメ管理（独立）
  const { favoriteAnimeIds, setFavoriteAnimeIds } = useFavoriteAnime();

  // アバター管理用の一時的なprofile状態
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
  
  // アバター管理（プロフィールに依存）
  const avatar = useAvatar({ profile: tempProfile });

  // プロフィール管理（アバターに依存）
  const profile = useProfile({
    updateAvatarUrl: avatar.updateAvatarUrl,
    uploadAvatar: avatar.uploadAvatar,
  });

  // プロフィールが更新されたらアバターに反映
  useEffect(() => {
    setTempProfile(profile.profile);
  }, [profile.profile]);

  // ========== 後方互換性のための値 ==========
  const userName = profile.profile?.username || 'ユーザー';
  const userIcon = avatar.avatarPublicUrl || (typeof window !== 'undefined' ? localStorage.getItem('userIcon') : null) || null;
  const userHandle = profile.profile?.handle || null;
  const userOtakuType = profile.profile?.otaku_type_custom || profile.profile?.otaku_type || '';
  const otakuType = profile.profile?.otaku_type || 'auto';
  const otakuTypeCustom = profile.profile?.otaku_type_custom || null;
  const isProfilePublic = profile.profile?.is_public || false;
  const userBio = profile.profile?.bio || '';
  const myProfile = profile.profile;

  // 既存のsetterも維持（必要に応じて）- useCallbackでメモ化
  const setUserName = useCallback((name: string) => {
    profile.saveProfile({ username: name });
  }, [profile.saveProfile]);
  
  const setUserIcon = useCallback((file: File) => {
    profile.saveProfile({ avatarFile: file });
  }, [profile.saveProfile]);
  
  const setUserHandle = useCallback((handle: string | null) => {
    profile.saveProfile({ handle });
  }, [profile.saveProfile]);
  
  const setUserOtakuType = useCallback((type: string) => {
    // localStorageに保存（後でSupabaseに保存される）
    if (typeof window !== 'undefined') {
      localStorage.setItem('userOtakuType', type);
    }
  }, []);
  
  const setIsProfilePublic = useCallback((isPublic: boolean) => {
    profile.saveProfile({ is_public: isPublic });
  }, [profile.saveProfile]);
  
  const setUserBio = useCallback((bio: string) => {
    profile.saveProfile({ bio });
  }, [profile.saveProfile]);
  
  const setMyProfile = useCallback((newProfile: UserProfile | null) => {
    profile.setProfile(newProfile);
  }, [profile.setProfile]);

  return {
    // 新しいAPI
    profile: profile.profile,
    loading: profile.loading,
    avatarPublicUrl: avatar.avatarPublicUrl,
    saveProfile: profile.saveProfile,
    saveOtakuType: profile.saveOtakuType,
    loadProfile: profile.loadProfile,
    
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
    setUserName,
    setUserIcon,
    setUserHandle,
    setUserOtakuType,
    setIsProfilePublic,
    setUserBio,
    setMyProfile,
  };
}
