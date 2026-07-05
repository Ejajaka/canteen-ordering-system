// src/components/PopularFood.tsx
import React from 'react';
import { Heart, Plus, Minus } from 'lucide-react';

interface FoodItem {
  id: number;
  docId?: string;
  name: string;
  price: number;
  image: string;
  isFavorite: boolean;
  category?: string;
  /** ✅ drives grey-out/disable */
  availability?: boolean;
}

interface CartItem {
  id: number;
  quantity: number;
  dishDocId?: string;
}

interface PopularFoodProps {
  foods: FoodItem[];
  onToggleFavorite: (idOrDocId: number | string) => void;
  onAddToCart: (id: number) => void;
  searchQuery?: string;
  cartItems?: CartItem[];
  onUpdateQuantity?: (id: number, qty: number) => void;
  onTransientNotification?: (msg: string) => void; // not used for favs
}

export const PopularFood: React.FC<PopularFoodProps> = ({
  foods,
  onToggleFavorite,
  onAddToCart,
  searchQuery,
  cartItems = [],
  onUpdateQuantity,
}) => {
  const filteredFoods = (searchQuery?.trim()
    ? foods.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : foods
  ).slice(0, 10);

  const getQty = (id: number) => {
    const it = cartItems.find((c) => c.id === id);
    return it ? it.quantity : 0;
  };

  return (
    <div className="px-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Popular Food</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {filteredFoods.map((food) => {
          const qty = getQty(food.id);
          const isUnavailable = food.availability === false;

          return (
            <div
              key={food.docId ?? food.id}
              className={`flex-shrink-0 w-48 bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200 ${
                isUnavailable ? 'opacity-60 grayscale' : ''
              }`}
            >
              {/* Image + Heart */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={food.image || '/placeholder.png'}
                  alt={food.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                  }}
                />

                {/* Unavailable badge */}
                {isUnavailable && (
                  <div className="absolute top-3 left-3 bg-gray-800 text-white text-[11px] font-semibold px-2 py-1 rounded-md">
                    Unavailable
                  </div>
                )}

                {/* Heart button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(food.docId ?? food.id);
                  }}
                  aria-pressed={food.isFavorite}
                  aria-label={food.isFavorite ? 'Unfavorite' : 'Favorite'}
                  className={`absolute top-3 right-3 p-2 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 transition-all duration-200 ${
                    food.isFavorite ? 'bg-red-500' : 'bg-white/90'
                  }`}
                  style={{ zIndex: 10 }}
                >
                  <Heart
                    className="w-4 h-4"
                    fill={food.isFavorite ? 'white' : 'none'}
                    stroke={food.isFavorite ? 'white' : '#374151'}
                    strokeWidth={2}
                  />
                </button>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2 text-sm leading-tight">
                  {food.name}
                </h3>

                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    ₹{Number(food.price).toFixed(0)}
                  </span>

                  {/* Right side actions */}
                  {isUnavailable ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
                    >
                      Unavailable
                    </button>
                  ) : qty > 0 ? (
                    <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-xl">
                      <button
                        onClick={() =>
                          onUpdateQuantity?.(food.id, Math.max(0, qty - 1))
                        }
                        aria-label="decrease"
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="px-3 py-1 font-medium">{qty}</div>
                      <button
                        onClick={() => onUpdateQuantity?.(food.id, qty + 1)}
                        aria-label="increase"
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onAddToCart(food.id);
                      }}
                      className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PopularFood;