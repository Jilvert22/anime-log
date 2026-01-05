import { StreamingBadge } from './StreamingBadge';

export type StreamingBadgesProps = {
  services: string[] | null | undefined;
  maxDisplay?: number;
  size?: 'sm' | 'md';
};

export function StreamingBadges({ services, maxDisplay = 3, size = 'sm' }: StreamingBadgesProps) {
  if (!services || services.length === 0) return null;

  const displayServices = services.slice(0, maxDisplay);
  const remaining = services.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayServices.map((service, idx) => (
        <StreamingBadge key={idx} service={service} size={size} />
      ))}
      {remaining > 0 && (
        <span
          className={`${size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}
