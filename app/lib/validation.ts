/**
 * 入力値バリデーション
 */

import { ValidationError } from './api/errors';

// 各フィールドの文字数制限
export const INPUT_LIMITS = {
  username: { min: 1, max: 30 },
  handle: { min: 1, max: 30 },
  bio: { max: 500 },
  otakuTypeCustom: { max: 50 },
  reviewContent: { min: 1, max: 5000 },
  watchlistMemo: { max: 1000 },
  quoteText: { max: 500 },
  quoteCharacter: { max: 100 },
} as const;

type ValidationResult = {
  isValid: boolean;
  error?: string;
};

/**
 * 文字数制限を検証
 */
export function validateLength(
  value: string | null | undefined,
  fieldName: string,
  limits: { min?: number; max: number }
): ValidationResult {
  // null/undefinedの場合は検証をスキップ（オプショナルフィールド）
  if (value === null || value === undefined) {
    return { isValid: true };
  }
  
  const trimmed = value.trim();
  
  // 最小文字数チェック
  if (limits.min !== undefined && trimmed.length < limits.min) {
    return {
      isValid: false,
      error: `${fieldName}は${limits.min}文字以上で入力してください`,
    };
  }
  
  // 最大文字数チェック
  if (trimmed.length > limits.max) {
    return {
      isValid: false,
      error: `${fieldName}は${limits.max}文字以内で入力してください（現在: ${trimmed.length}文字）`,
    };
  }
  
  return { isValid: true };
}

/**
 * ユーザー名の検証（文字数 + 使用可能文字）
 */
export function validateUsername(value: string): ValidationResult {
  const trimmed = value.trim();
  const limits = INPUT_LIMITS.username;
  
  // 文字数チェック
  const lengthCheck = validateLength(trimmed, 'ユーザー名', limits);
  if (!lengthCheck.isValid) return lengthCheck;
  
  // 使用可能文字チェック（英数字、日本語、一部記号）
  const validPattern = /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF_\-]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'ユーザー名に使用できない文字が含まれています',
    };
  }
  
  return { isValid: true };
}

/**
 * ハンドルの検証（英数字とアンダースコアのみ）
 */
export function validateHandle(value: string | null | undefined): ValidationResult {
  // null/undefinedの場合は検証をスキップ（オプショナルフィールド）
  if (!value) {
    return { isValid: true };
  }
  
  const trimmed = value.trim();
  
  // 空文字列の場合は許可（nullに変換される）
  if (trimmed === '') {
    return { isValid: true };
  }
  
  const limits = INPUT_LIMITS.handle;
  
  const lengthCheck = validateLength(trimmed, 'ハンドル', limits);
  if (!lengthCheck.isValid) return lengthCheck;
  
  // 英数字とアンダースコアのみ
  const validPattern = /^[a-zA-Z0-9_]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'ハンドルは英数字とアンダースコアのみ使用できます',
    };
  }
  
  return { isValid: true };
}

/**
 * バリデーション結果からエラーをスロー（エラーがある場合）
 */
export function throwIfInvalid(result: ValidationResult): void {
  if (!result.isValid && result.error) {
    throw new ValidationError(result.error);
  }
}

