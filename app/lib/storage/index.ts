'use client';

import { LocalStorageService } from './localStorageService';
import { SupabaseStorageService } from './supabaseStorageService';
import type { IStorageService } from './types';

// ログイン状態に応じて適切なストレージサービスを返す
export function getStorageService(isLoggedIn: boolean): IStorageService {
  if (isLoggedIn) {
    return new SupabaseStorageService();
  }
  return new LocalStorageService();
}

// シングルトンインスタンス（必要に応じて）
let localStorageServiceInstance: LocalStorageService | null = null;
let supabaseStorageServiceInstance: SupabaseStorageService | null = null;

export function getLocalStorageService(): LocalStorageService {
  if (!localStorageServiceInstance) {
    localStorageServiceInstance = new LocalStorageService();
  }
  return localStorageServiceInstance;
}

export function getSupabaseStorageService(): SupabaseStorageService {
  if (!supabaseStorageServiceInstance) {
    supabaseStorageServiceInstance = new SupabaseStorageService();
  }
  return supabaseStorageServiceInstance;
}


