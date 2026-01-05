import { getStreamingServiceStyle } from '@/app/constants/streamingServices';

type Props = {
  service: string;
  size?: 'sm' | 'md';
};

export function StreamingBadge({ service, size = 'sm' }: Props) {
  const style = getStreamingServiceStyle(service);
  const sizeClasses = size === 'sm' 
    ? 'px-1.5 py-0.5 text-xs' 
    : 'px-2 py-1 text-sm';

  return (
    <span
      className={`${sizeClasses} ${style.bg} ${style.darkBg} ${style.text} ${style.darkText} rounded`}
    >
      {service}
    </span>
  );
}

