// 星の評価表示コンポーネント
export function StarRating({ rating, size = 'text-3xl' }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${size} ${
            star <= rating
              ? 'text-[#ffd700] drop-shadow-sm'
              : 'text-gray-400 dark:text-gray-500 opacity-50'
          }`}
          style={star <= rating ? {} : { 
            textShadow: '0 0 1px rgba(0,0,0,0.2)'
          }}
        >
          {star <= rating ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}
