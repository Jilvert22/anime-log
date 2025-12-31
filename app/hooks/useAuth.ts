'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getSession, signOut, onAuthStateChange } from '../lib/api';
import type { User } from '@supabase/supabase-js';

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
        console.error('Failed to get session:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    // 認証状態の変化を監視
    const unsubscribe = onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
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
      console.error('Logout error:', error);
      return false;
    }
  }, []);

  return {
    user,
    isLoading,
    handleLogout,
  };
}
