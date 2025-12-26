'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { getMyProfile } from '../lib/supabase';
import type { UserProfile } from '../lib/supabase';

export function useUserProfile(user: User | null) {
  const [userName, setUserName] = useState<string>('ユーザー');
  const [userIcon, setUserIcon] = useState<string>('👤');
  const [userOtakuType, setUserOtakuType] = useState<string>('');
  const [favoriteAnimeIds, setFavoriteAnimeIds] = useState<number[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [userBio, setUserBio] = useState('');
  const [userHandle, setUserHandle] = useState<string>('');

  // localStorageから初期値を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('userName');
      const savedIcon = localStorage.getItem('userIcon');
      const savedOtakuType = localStorage.getItem('userOtakuType');
      const savedFavoriteAnimeIds = localStorage.getItem('favoriteAnimeIds');
      
      if (savedName) setUserName(savedName);
      if (savedIcon) setUserIcon(savedIcon);
      if (savedOtakuType) setUserOtakuType(savedOtakuType);
      if (savedFavoriteAnimeIds) {
        try {
          setFavoriteAnimeIds(JSON.parse(savedFavoriteAnimeIds));
        } catch (e) {
          console.error('Failed to parse favoriteAnimeIds', e);
        }
      }
    }
  }, []);

  // ユーザー情報をlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userName', userName);
      localStorage.setItem('userIcon', userIcon);
      if (userOtakuType) {
        localStorage.setItem('userOtakuType', userOtakuType);
      } else {
        localStorage.removeItem('userOtakuType');
      }
      localStorage.setItem('favoriteAnimeIds', JSON.stringify(favoriteAnimeIds));
    }
  }, [userName, userIcon, userOtakuType, favoriteAnimeIds]);

  // ログイン時にプロフィール情報を読み込む
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profile = await getMyProfile();
          if (profile) {
            setMyProfile(profile);
            setUserName(profile.username || userName);
            setUserBio(profile.bio || '');
            setIsProfilePublic(profile.is_public || false);
            setUserHandle(profile.handle || '');
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      } else {
        setMyProfile(null);
        setUserHandle('');
      }
    };
    
    loadProfile();
  }, [user]);

  return {
    userName,
    setUserName,
    userIcon,
    setUserIcon,
    userOtakuType,
    setUserOtakuType,
    favoriteAnimeIds,
    setFavoriteAnimeIds,
    myProfile,
    setMyProfile,
    isProfilePublic,
    setIsProfilePublic,
    userBio,
    setUserBio,
    userHandle,
    setUserHandle,
  };
}

