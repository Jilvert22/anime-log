'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSession, signOut, onAuthStateChange } from '../lib/api';
import type { User } from '@supabase/supabase-js';
import { logger } from '../lib/logger';
import { normalizeError } from '../lib/api/errors';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authChanged = false;

    // 現在のセッションを確認
    const initSession = async () => {
      try {
        const session = await getSession();
        if (mounted && !authChanged) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      } catch (error) {
        const normalizedError = normalizeError(error);
        logger.error('Failed to get session', normalizedError, 'useAuth');
        if (mounted && !authChanged) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    // 認証状態の変化を監視
    const unsubscribe = onAuthStateChange((_event, session) => {
      authChanged = true;
      if (mounted) {
        const newUser = session?.user ?? null;
        setUser(newUser);
        setIsLoading(false);
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
