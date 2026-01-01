'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';

// 型定義
type UserProfileContextType = ReturnType<typeof useUserProfile>;

const UserProfileContext = createContext<UserProfileContextType | null>(null);

// Provider
export function UserProfileProvider({ children }: { children: ReactNode }) {
  const profile = useUserProfile();
  
  // valueをメモ化（profileオブジェクト全体を依存配列に含める）
  const value = useMemo(() => profile, [profile]);
  
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

