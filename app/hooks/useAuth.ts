'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getSession, signOut, onAuthStateChange } from '../lib/api';
import type { User } from '@supabase/supabase-js';
import { logger } from '../lib/logger';
import { normalizeError } from '../lib/api/errors';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 現在のセッションを確認
    const initSession = async () => {
      try {
        const session = await getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      } catch (error) {
        const normalizedError = normalizeError(error);
        logger.error('Failed to get session', normalizedError, 'useAuth');
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    // 認証状態の変化を監視
    const unsubscribe = onAuthStateChange((event, session) => {
      if (mounted) {
        const newUser = session?.user ?? null;
        setUser(newUser);
        setIsLoading(false);
        // ログアウト時（ユーザーがnullになった時）にlocalStorageをクリア
        if (!newUser && event === 'SIGNED_OUT') {
          localStorage.removeItem('animeSeasons');
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogout = useCallback(async (): Promise<boolean> => {
    try {
      await signOut();
      // ログアウト時にlocalStorageのアニメデータをクリア
      localStorage.removeItem('animeSeasons');
      return true;
    } catch (error) {
      const normalizedError = normalizeError(error);
      logger.error('Logout error', normalizedError, 'useAuth');
      return false;
    }
  }, []);

  return {
    user,
    isLoading,
    handleLogout,
  };
}
