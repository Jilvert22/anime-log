import { describe, it, expect } from 'vitest';
import { formatStartDate } from '../../app/utils/animeDate';

describe('formatStartDate', () => {
  it('year/month/day が揃えば M/D〜 形式', () => {
    expect(formatStartDate({ year: 2026, month: 7, day: 3 })).toBe('7/3〜');
    expect(formatStartDate({ year: 2026, month: 10, day: 15 })).toBe('10/15〜');
  });

  it('day が無ければ M月〜 形式', () => {
    expect(formatStartDate({ year: 2026, month: 4, day: null })).toBe('4月〜');
    expect(formatStartDate({ year: 2026, month: 4 })).toBe('4月〜');
  });

  it('month が無ければ null', () => {
    expect(formatStartDate({ year: 2026, month: null, day: null })).toBeNull();
    expect(formatStartDate({ year: null, month: null, day: null })).toBeNull();
  });

  it('startDate 自体が null/undefined なら null', () => {
    expect(formatStartDate(null)).toBeNull();
    expect(formatStartDate(undefined)).toBeNull();
  });
});
