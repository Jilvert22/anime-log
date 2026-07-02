/**
 * 入力バリデーションの特性テスト
 *
 * Phase 5 の DB CHECK 制約はアプリ側バリデーションと対になる (二重の防壁)。
 * 制約追加で挙動が変わらないよう、現状の検証ルールを固定する。
 */

import { describe, it, expect } from 'vitest';
import {
  validateLength,
  validateUsername,
  validateHandle,
  throwIfInvalid,
  INPUT_LIMITS,
} from '../../app/lib/validation';
import { ValidationError } from '../../app/lib/api/errors';

describe('validateLength', () => {
  it('null/undefined は検証スキップ (オプショナル扱い)', () => {
    expect(validateLength(null, 'x', { max: 10 }).isValid).toBe(true);
    expect(validateLength(undefined, 'x', { max: 10 }).isValid).toBe(true);
  });

  it('前後空白を trim してから判定', () => {
    expect(validateLength('  ab  ', 'x', { max: 2 }).isValid).toBe(true);
  });

  it('最小文字数未満は無効', () => {
    const r = validateLength('', 'ユーザー名', { min: 1, max: 30 });
    expect(r.isValid).toBe(false);
    expect(r.error).toContain('1文字以上');
  });

  it('最大文字数超過は無効 (現在文字数を含む)', () => {
    const r = validateLength('abcde', 'x', { max: 3 });
    expect(r.isValid).toBe(false);
    expect(r.error).toContain('現在: 5文字');
  });
});

describe('validateUsername', () => {
  it('英数字・日本語・一部記号は有効', () => {
    expect(validateUsername('永安_riku-34').isValid).toBe(true);
    expect(validateUsername('ユーザー名テスト').isValid).toBe(true);
  });

  it('使用不可文字 (空白・記号) は無効', () => {
    expect(validateUsername('bad name').isValid).toBe(false);
    expect(validateUsername('star★').isValid).toBe(false);
  });

  it('上限文字数を超えると無効', () => {
    expect(validateUsername('a'.repeat(INPUT_LIMITS.username.max + 1)).isValid).toBe(false);
  });
});

describe('validateHandle', () => {
  it('null/空文字は許可 (null に変換される想定)', () => {
    expect(validateHandle(null).isValid).toBe(true);
    expect(validateHandle('   ').isValid).toBe(true);
  });

  it('英数字とアンダースコアのみ有効', () => {
    expect(validateHandle('riku_34').isValid).toBe(true);
    expect(validateHandle('riku.34').isValid).toBe(false);
    expect(validateHandle('日本語').isValid).toBe(false);
  });
});

describe('throwIfInvalid', () => {
  it('無効な結果は ValidationError を throw', () => {
    expect(() => throwIfInvalid({ isValid: false, error: 'だめ' })).toThrow(ValidationError);
  });

  it('有効な結果は何もしない', () => {
    expect(() => throwIfInvalid({ isValid: true })).not.toThrow();
  });
});
