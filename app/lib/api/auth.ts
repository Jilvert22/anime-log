/**
 * 認証関連のAPI
 * Supabase Authのラッパー関数
 */

'use client';

import { supabase } from '../supabase';
import {
  AuthenticationError,
  SupabaseError,
  translateSupabaseError,
  logError,
  normalizeError,
} from './errors';
import type { User, Session } from '@supabase/supabase-js';

/**
 * 現在のセッションを取得
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new SupabaseError(translateSupabaseError(error), undefined, error);
    }
    
    return data.session;
  } catch (error) {
    logError(error, 'getSession');
    throw normalizeError(error);
  }
}

/**
 * 現在のユーザーを取得
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new SupabaseError(translateSupabaseError(error), undefined, error);
    }
    
    return data.user;
  } catch (error) {
    logError(error, 'getCurrentUser');
    throw normalizeError(error);
  }
}

/**
 * 認証済みユーザーを取得（未認証の場合はエラーをスロー）
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new AuthenticationError();
  }
  
  return user;
}

/**
 * メールアドレスとパスワードでログイン
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ user: User; session: Session }> {
  try {
    if (!email || !password) {
      throw new AuthenticationError('メールアドレスとパスワードを入力してください');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new AuthenticationError(translateSupabaseError(error), error);
    }
    
    if (!data.user || !data.session) {
      throw new AuthenticationError('ログインに失敗しました');
    }
    
    return {
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    logError(error, 'signInWithPassword');
    throw normalizeError(error);
  }
}

/**
 * 新規ユーザー登録
 */
export async function signUp(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null }> {
  try {
    if (!email || !password) {
      throw new AuthenticationError('メールアドレスとパスワードを入力してください');
    }
    
    if (password.length < 6) {
      throw new AuthenticationError('パスワードは6文字以上で入力してください');
    }
    
    // メール確認後のリダイレクトURLを設定
    const redirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    
    if (error) {
      throw new AuthenticationError(translateSupabaseError(error), error);
    }
    
    return {
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    logError(error, 'signUp');
    throw normalizeError(error);
  }
}

/**
 * ログアウト
 */
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new SupabaseError(translateSupabaseError(error), undefined, error);
    }
  } catch (error) {
    logError(error, 'signOut');
    throw normalizeError(error);
  }
}

/**
 * パスワードリセットメールを送信
 */
export async function resetPasswordForEmail(
  email: string,
  redirectTo?: string
): Promise<void> {
  try {
    if (!email) {
      throw new AuthenticationError('メールアドレスを入力してください');
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      throw new SupabaseError(translateSupabaseError(error), undefined, error);
    }
  } catch (error) {
    logError(error, 'resetPasswordForEmail');
    throw normalizeError(error);
  }
}

/**
 * ユーザー情報を更新
 */
export async function updateUser(updates: {
  email?: string;
  password?: string;
}): Promise<User> {
  try {
    const { data, error } = await supabase.auth.updateUser(updates);
    
    if (error) {
      throw new SupabaseError(translateSupabaseError(error), undefined, error);
    }
    
    if (!data.user) {
      throw new AuthenticationError('ユーザー情報の更新に失敗しました');
    }
    
    return data.user;
  } catch (error) {
    logError(error, 'updateUser');
    throw normalizeError(error);
  }
}

/**
 * メールアドレスを更新
 */
export async function updateEmail(newEmail: string): Promise<User> {
  try {
    if (!newEmail || !newEmail.includes('@')) {
      throw new AuthenticationError('有効なメールアドレスを入力してください');
    }
    
    return await updateUser({ email: newEmail });
  } catch (error) {
    logError(error, 'updateEmail');
    throw normalizeError(error);
  }
}

/**
 * パスワードを更新
 */
export async function updatePassword(newPassword: string): Promise<User> {
  try {
    if (!newPassword || newPassword.length < 6) {
      throw new AuthenticationError('パスワードは6文字以上で入力してください');
    }
    
    return await updateUser({ password: newPassword });
  } catch (error) {
    logError(error, 'updatePassword');
    throw normalizeError(error);
  }
}

/**
 * 認証状態の変化を監視
 * @param callback 認証状態が変化したときに呼ばれるコールバック
 * @returns 購読解除関数
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  try {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    logError(error, 'onAuthStateChange');
    // エラーが発生しても購読解除関数は返す（空の関数）
    return () => {};
  }
}

