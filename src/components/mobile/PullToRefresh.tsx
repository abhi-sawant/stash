import { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (refreshing || startY.current === 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      setPulling(true);
      setPullDistance(Math.min(distance, threshold * 1.5));

      if (distance > threshold / 2) {
        hapticFeedback.light();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold) {
      setRefreshing(true);
      hapticFeedback.medium();

      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
        setPulling(false);
        startY.current = 0;
      }
    } else {
      setPullDistance(0);
      setPulling(false);
      startY.current = 0;
    }
  };

  const progress = Math.min((pullDistance / threshold) * 100, 100);

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100dvh-130px)] overflow-y-auto overscroll-contain pb-16"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 right-0 left-0 flex items-center justify-center transition-all"
        style={{
          height: `${pullDistance}px`,
          opacity: pulling || refreshing ? 1 : 0,
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <RefreshCw
            className={`text-primary h-6 w-6 ${refreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${progress * 3.6}deg)`,
            }}
          />
          <span className="text-xs text-gray-500">
            {refreshing
              ? 'Refreshing...'
              : pullDistance >= threshold
                ? 'Release to refresh'
                : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pulling || refreshing ? pullDistance : 0}px)`,
          transition: pulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
