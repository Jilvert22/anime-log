'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 現在のセッションを確認
    const initSession = async () => {
      try {
        if (!supabase) {
          console.warn('[useAuth] Supabaseクライアントが利用できません');
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
        }
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
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      return () => {
        mounted = false;
      };
    }
  }, []);

  const handleLogout = useCallback(async (): Promise<boolean> => {
    try {
      if (!supabase) {
        console.warn('[useAuth] Supabaseクライアントが利用できません');
        return false;
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
