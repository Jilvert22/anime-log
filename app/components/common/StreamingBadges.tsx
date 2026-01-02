'use client';

type Props = {
  services: string[];
  maxDisplay?: number;
};

export function StreamingBadges({ services, maxDisplay = 3 }: Props) {
  if (!services || services.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {services.slice(0, maxDisplay).map((service, idx) => (
        <span
          key={idx}
          className="px-1.5 py-0.5 text-xs bg-[#e879d4]/20 text-[#e879d4] dark:bg-[#e879d4]/30 dark:text-[#e879d4] rounded-full font-medium"
        >
          {service}
        </span>
      ))}
      {services.length > maxDisplay && (
        <span className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400">
          +{services.length - maxDisplay}
        </span>
      )}
    </div>
  );
}

