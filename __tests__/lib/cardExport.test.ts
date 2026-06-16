import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shareOrDownloadImage } from '../../app/lib/share/cardExport';

/**
 * shareOrDownloadImage の分岐を検証する。
 * renderCardToBlob は html2canvas がjsdomで動かないため対象外。
 */
describe('shareOrDownloadImage', () => {
  const blob = new Blob(['x'], { type: 'image/png' });

  beforeEach(() => {
    // URL.createObjectURL / revokeObjectURL は jsdom に無いのでスタブ
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:mock'),
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
    });
    // <a>.click() の実体（jsdomでは何もしない）
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // navigator に生やした share/canShare を掃除
    delete (navigator as unknown as { share?: unknown }).share;
    delete (navigator as unknown as { canShare?: unknown }).canShare;
  });

  function stubNavigator(opts: {
    canShare?: (data: unknown) => boolean;
    share?: (data: unknown) => Promise<void>;
  }) {
    if (opts.canShare) {
      Object.defineProperty(navigator, 'canShare', {
        value: opts.canShare,
        configurable: true,
      });
    }
    if (opts.share) {
      Object.defineProperty(navigator, 'share', {
        value: opts.share,
        configurable: true,
      });
    }
  }

  it('ファイル共有可能なら navigator.share を呼び "shared" を返す', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stubNavigator({ canShare: () => true, share });

    const result = await shareOrDownloadImage(blob, 'card.png', { title: 't' });

    expect(result).toBe('shared');
    expect(share).toHaveBeenCalledOnce();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('canShare が false ならダウンロードして "downloaded" を返す', async () => {
    const share = vi.fn();
    stubNavigator({ canShare: () => false, share });

    const result = await shareOrDownloadImage(blob, 'card.png');

    expect(result).toBe('downloaded');
    expect(share).not.toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });

  it('共有シートをユーザーが閉じた(AbortError)場合はダウンロードせず "cancelled"', async () => {
    const abort = Object.assign(new Error('canceled'), { name: 'AbortError' });
    const share = vi.fn().mockRejectedValue(abort);
    stubNavigator({ canShare: () => true, share });

    const result = await shareOrDownloadImage(blob, 'card.png');

    expect(result).toBe('cancelled');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('共有が AbortError 以外で失敗したらダウンロードにフォールバック', async () => {
    const share = vi.fn().mockRejectedValue(new Error('share failed'));
    stubNavigator({ canShare: () => true, share });

    const result = await shareOrDownloadImage(blob, 'card.png');

    expect(result).toBe('downloaded');
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });

  it('navigator.share 未対応ならダウンロード', async () => {
    // share/canShare を生やさない
    const result = await shareOrDownloadImage(blob, 'card.png');

    expect(result).toBe('downloaded');
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });
});
