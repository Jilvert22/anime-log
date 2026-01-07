'use client';

import { useState, useEffect } from 'react';
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

  // setUserOtakuType: AnimeDNASectionで使用されているため保持
  const setUserOtakuType = (type: string) => {
    // localStorageに保存（後でSupabaseに保存される）
    if (typeof window !== 'undefined') {
      localStorage.setItem('userOtakuType', type);
    }
    // 実際の保存はsaveOtakuTypeを使用
    profile.saveOtakuType(type);
  };

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
    
    // setUserOtakuType: AnimeDNASectionで使用
    setUserOtakuType,
  };
}
