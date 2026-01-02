'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';

// 型定義
type UserProfileContextType = ReturnType<typeof useUserProfile>;

const UserProfileContext = createContext<UserProfileContextType | null>(null);

// Provider
export function UserProfileProvider({ children }: { children: ReactNode }) {
  const profile = useUserProfile();
  
  // valueをメモ化（favoriteAnimeIdsの変更も検知するため、favoriteAnimeIdsを依存配列に含める）
  // useUserProfileは毎回新しいオブジェクトを返すため、favoriteAnimeIdsが変更されると
  // profileオブジェクト全体が新しい参照になるが、念のためfavoriteAnimeIdsも明示的に含める
  const value = useMemo(() => profile, [
    profile,
    profile.favoriteAnimeIds, // favoriteAnimeIdsの変更を確実に検知
  ]);
  
  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

// Consumer hook
export function useUserProfileContext() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfileContext must be used within UserProfileProvider');
  }
  return context;
}

