// src/components/RecentOrders.tsx
import React, { useEffect, useState, memo } from 'react';
import { Clock, Plus, Minus } from 'lucide-react';

const PLACEHOLDER = '/placeholder.png';

/** Types (keep in sync with your project types) */
interface RecentOrderItem {
  id: number;
  name: string;
  price: number;
  image: string;
  lastOrdered?: string;
  availability?: boolean;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  dishDocId?: string;
}

interface RecentOrdersProps {
  recentItems: RecentOrderItem[];
  cartItems: CartItem[]; // single source of truth
  onUpdateQuantity: (id: number, quantity: number) => void;
  onTransientNotification?: (msg: string) => void;
}

/**
 * ImageWithFallback
 * - keeps an internal src state to avoid flicker when parent briefly passes empty/placeholder
 * - only updates to a new meaningful src
 */
function ImageWithFallback({
  src,
  alt,
  className,
  width,
  height,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}) {
  const [currentSrc, setCurrentSrc] = useState<string>(() =>
    src && String(src).trim() ? src : PLACEHOLDER
  );
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const incoming = src && String(src).trim() ? src : PLACEHOLDER;
    if (incoming === currentSrc) return;
    if (errored && incoming === PLACEHOLDER) return;
    setCurrentSrc(incoming);
    setErrored(false);
  }, [src, currentSrc, errored]);

  return (
    <img
      src={currentSrc}
      alt={alt || ''}
      width={width}
      height={height}
      decoding="async"
      loading="lazy"
      className={className}
      onError={(e) => {
        if (!errored) {
          setErrored(true);
          (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
          setCurrentSrc(PLACEHOLDER);
        }
      }}
      style={{
        width: typeof width === 'number' ? `${width}px` : width || '100%',
        height: typeof height === 'number' ? `${height}px` : height || '100%',
        objectFit: 'cover',
        display: 'block',
      }}
    />
  );
}

/** Single card memoized to reduce re-renders */
const RecentOrderCard = memo(function RecentOrderCard({
  item,
  qty,
  isUnavailable,
  onInc,
  onDec,
  onTransientNotification,
}: {
  item: RecentOrderItem;
  qty: number;
  isUnavailable: boolean;
  onInc: (id: number) => void;
  onDec: (id: number) => void;
  onTransientNotification?: (msg: string) => void;
}) {
  return (
    <div
      key={item.id}
      className={`flex-shrink-0 w-48 bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200 ${
        isUnavailable ? 'opacity-60 grayscale' : ''
      }`}
      aria-hidden={isUnavailable}
    >
      {/* Image */}
      <div className="relative h-32 overflow-hidden bg-gray-100">
        <ImageWithFallback
          src={item.image || PLACEHOLDER}
          alt={item.name}
          width="100%"
          height="100%"
          className="w-full h-full object-cover"
        />

        {isUnavailable && (
          <div className="absolute top-3 left-3 bg-gray-800 text-white text-[11px] font-semibold px-2 py-1 rounded-md">
            Unavailable
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-2 text-sm leading-tight line-clamp-2">
          {item.name}
        </h3>

        <div className="flex justify-between items-center">
          <span className="text-lg font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            ₹{Number(item.price).toFixed(0)}
          </span>

          {/* Right Side */}
          {isUnavailable ? (
            <button
              disabled
              className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
            >
              Unavailable
            </button>
          ) : qty === 0 ? (
            <button
              onClick={() => {
                onInc(item.id);
                onTransientNotification?.('Added to cart!');
              }}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Reorder
            </button>
          ) : (
            <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl px-3 py-2 shadow-inner">
              <button
                onClick={() => onDec(item.id)}
                className="px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="w-6 text-center font-medium select-none">{qty}</span>

              <button
                onClick={() => {
                  onInc(item.id);
                  onTransientNotification?.('Added to cart!');
                }}
                className="px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
RecentOrderCard.displayName = 'RecentOrderCard';

export const RecentOrders: React.FC<RecentOrdersProps> = ({
  recentItems,
  cartItems,
  onUpdateQuantity,
  onTransientNotification,
}) => {
  const getQty = (id: number) => cartItems.find((c) => c.id === id)?.quantity ?? 0;

  const inc = (id: number) => {
    const current = getQty(id);
    onUpdateQuantity(id, current + 1);
  };

  const dec = (id: number) => {
    const current = getQty(id);
    const next = Math.max(0, current - 1);
    onUpdateQuantity(id, next);
  };

  // If parent accidentally passes duplicates, do a quick dedupe for safety on render
  const deduped = (() => {
    const seen = new Set<number>();
    const out: RecentOrderItem[] = [];
    for (const it of recentItems) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      out.push(it);
    }
    return out;
  })();

  return (
    <div className="px-4 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
        </div>
      </div>

      {/* Cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {deduped.map((item) => {
          const qty = getQty(item.id);
          const isUnavailable = item.availability === false;

          return (
            <RecentOrderCard
              key={item.id}
              item={item}
              qty={qty}
              isUnavailable={isUnavailable}
              onInc={inc}
              onDec={dec}
              onTransientNotification={onTransientNotification}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RecentOrders;
