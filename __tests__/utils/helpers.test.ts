import { describe, it, expect } from 'vitest';
import { extractSeriesName, getSeasonName } from '../../app/utils/helpers';

describe('extractSeriesName', () => {
  it('シリーズ名を正しく抽出する', () => {
    expect(extractSeriesName('進撃の巨人 Season 3')).toBe('進撃の巨人');
    expect(extractSeriesName('進撃の巨人 The Final Season')).toBe('進撃の巨人');
  });

  it('シリーズ名がない場合はそのまま返す', () => {
    expect(extractSeriesName('ぼっち・ざ・ろっく！')).toBe('ぼっち・ざ・ろっく！');
  });

  it('第2期などのパターンを処理する', () => {
    expect(extractSeriesName('鬼滅の刃 第2期')).toBe('鬼滅の刃');
  });
});

describe('getSeasonName', () => {
  it('年とクォーターからシーズン名を生成する', () => {
    expect(getSeasonName(2024, 1)).toBe('2024年冬');
    expect(getSeasonName(2024, 2)).toBe('2024年春');
    expect(getSeasonName(2024, 3)).toBe('2024年夏');
    expect(getSeasonName(2024, 4)).toBe('2024年秋');
  });
});


