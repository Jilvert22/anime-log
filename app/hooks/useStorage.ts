'use client';

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { getStorageService } from '../lib/storage';
import type { IStorageService } from '../lib/storage/types';

export function useStorage(): IStorageService {
  const { user, isLoading } = useAuth();
  
  const storage = useMemo(() => {
    // ローディング中はlocalStorageを使用（安全側に倒す）
    if (isLoading) {
      return getStorageService(false);
    }
    return getStorageService(!!user);
  }, [user, isLoading]);

  return storage;
}


