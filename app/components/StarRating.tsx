// 星の評価表示コンポーネント
export function StarRating({ rating, size = 'text-3xl' }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${size} ${
            star <= rating
              ? 'text-[#ffd966]'
              : 'text-gray-300 opacity-30'
          }`}
        >
          {star <= rating ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}
