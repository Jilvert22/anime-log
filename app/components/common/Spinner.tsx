// アプリ共通のローディングスピナー。
// 以前は border-t-transparent 版と border-b-2 版の2系統が散在していたため、
// ブランドピンクの細い円弧スピナー（border-b-2）1系統に統一する。
// 文言は label prop で呼び出し側から渡す。

type SpinnerProps = {
  // スピナー下に表示する文言（「読み込み中...」「検索中...」等）。省略時はスピナーのみ。
  label?: string;
  size?: 'sm' | 'md';
  // 中央寄せコンテナへ追加するクラス（余白の調整など）
  className?: string;
};

export function Spinner({ label, size = 'md', className = '' }: SpinnerProps) {
  const dimension = size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';

  return (
    <div
      className={`flex flex-col items-center gap-3 ${className}`}
      role="status"
      aria-label={label ? undefined : '読み込み中'}
    >
      <div
        className={`${dimension} border-b-2 border-[#e879d4] rounded-full animate-spin`}
        aria-hidden="true"
      />
      {label && <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>}
    </div>
  );
}
