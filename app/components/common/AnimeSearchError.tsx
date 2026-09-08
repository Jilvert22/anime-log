interface AnimeSearchErrorProps {
  message: string;
  onRetry: () => void;
}

export function AnimeSearchError({ message, onRetry }: AnimeSearchErrorProps) {
  return (
    <div
      role="alert"
      className="my-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-lg border border-current px-4 py-2 font-medium"
      >
        再試行
      </button>
    </div>
  );
}
