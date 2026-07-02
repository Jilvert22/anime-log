import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import type { ReactElement } from 'react';

/**
 * 与えられた時間でPromiseを打ち切る（解決値は問わない）。
 * 壊れた1枚の画像がdecode()でハングしてもカード生成全体を止めないために使う。
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | void> {
  return Promise.race([promise, new Promise<void>((resolve) => setTimeout(resolve, ms))]);
}

/**
 * オフスクリーンにカードを描画し、html2canvasでPNG Blobに変換する。
 *
 * - flushSync で同期的にコミットしてDOM確定を保証する（固定setTimeout待ちを排除）。
 * - 固定待ちで撮影すると画像未読込の「空カード」になり得るため、撮影前に各 <img> の
 *   decode() 完了を待つ（1枚のハング/失敗は無視）。
 * - メモリ肥大を避けるため toDataURL ではなく toBlob を使う。
 */
export async function renderCardToBlob(element: ReactElement): Promise<Blob> {
  if (typeof document === 'undefined') {
    throw new Error('renderCardToBlob はブラウザ環境でのみ利用できます');
  }

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    // 同期的にレンダー＆コミットしてDOMを確定させる
    flushSync(() => {
      root.render(element);
    });

    const node = container.firstElementChild as HTMLElement | null;
    if (!node) {
      throw new Error('カードのレンダリングに失敗しました');
    }

    // 画像のデコード完了を待つ（空カード対策）。1枚のハング/失敗は無視。
    const images = Array.from(node.querySelectorAll('img'));
    await Promise.all(
      images.map((img) =>
        withTimeout(
          img.decode().catch(() => undefined),
          4000
        )
      )
    );

    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
    });

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('画像の生成に失敗しました'));
      }, 'image/png');
    });
  } finally {
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/** 画像Blobを直接ダウンロードする (共有ダイアログを開かない) */
export function downloadImage(blob: Blob, fileName: string): void {
  downloadBlob(blob, fileName);
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // ダウンロード開始前に revoke されないよう遅延（即時 revoke は一部ブラウザで取りこぼす）
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 画像Blobを共有 or ダウンロードする。
 * - navigator.share がファイル共有に対応していれば1タップ共有（モバイルPWA想定）。
 * - ユーザーが共有シートを閉じた場合(AbortError)は 'cancelled'（呼び出し側はトーストを出さない）。
 * - 未対応 or 共有失敗(NotAllowedError等)時はダウンロードにフォールバック。
 *
 * 注: navigator.share は transient activation を要するため、画像生成に時間がかかると
 * 共有が弾かれてダウンロードに落ちることがある（=正常な劣化動作）。
 *
 * @returns 'shared' | 'downloaded' | 'cancelled'
 */
export async function shareOrDownloadImage(
  blob: Blob,
  fileName: string,
  shareMeta?: { title?: string; text?: string }
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
  ) {
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], ...shareMeta });
        return 'shared';
      } catch (error) {
        // ユーザーがシートを閉じただけ → ダウンロードもトーストもしない
        if (error instanceof Error && error.name === 'AbortError') {
          return 'cancelled';
        }
        // それ以外の共有失敗はダウンロードへフォールバック
      }
    }
  }

  downloadBlob(blob, fileName);
  return 'downloaded';
}
