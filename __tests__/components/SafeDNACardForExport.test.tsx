import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  SafeDNACardForExport,
  buildSafeDNAExportHighlights,
} from '../../app/components/tabs/mypage/DNACardForExport';

describe('SafeDNACardForExport', () => {
  it('作品画像、作品名、ハンドル、ユーザーアイコンを出力しない', () => {
    const { container } = render(
      <SafeDNACardForExport
        userName="テストユーザー"
        otakuTypeDisplay="ストーリー重視"
        highlights={['記録数 2作品', '平均評価 4.5', '周回 1回']}
      />
    );

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).not.toContain('SENTINEL_ANIME_TITLE');
    expect(container.textContent).not.toContain('@sentinel_handle');
    expect(container.textContent).not.toContain('https://example.com/icon.png');
    expect(
      screen.getByText('作品画像・作品名・ハンドル・ユーザーアイコンは含めていません。')
    ).toBeInTheDocument();
  });

  it('safe export 用のハイライトを統計値から作る', () => {
    expect(
      buildSafeDNAExportHighlights({ animeCount: 3, averageRating: 4.333, rewatchCount: 2 })
    ).toEqual(['記録数 3作品', '平均評価 4.3', '周回 2回']);

    expect(
      buildSafeDNAExportHighlights({ animeCount: 0, averageRating: 0, rewatchCount: 0 })
    ).toEqual(['記録数 0作品', '平均評価 未評価', '周回 0回']);
  });
});
