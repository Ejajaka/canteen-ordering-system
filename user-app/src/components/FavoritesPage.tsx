import React, { useState } from 'react';
import { ShoppingCart, Heart, Plus, Minus } from 'lucide-react';
import { TopBar } from './TopBar';
import { FoodItem } from '../types';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  dishDocId?: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'accepted' | 'cancelled' | 'completed' | 'item';
  read: boolean;
  timestamp: Date;
}

interface FavoritesPageProps {
  balance: number;
  cartCount: number;
  cartItems: CartItem[];
  foods: FoodItem[]; // assumes FoodItem has optional `availability?: boolean`
  onToggleFavorite: (id: number) => void;
  onAddToCart: (id: number) => void;
  onUpdateQuantity: (id: number, newQuantity: number) => void;
  onCartClick: () => void;
  onTransientNotification?: (msg: string) => void;

  notifications?: Notification[];
  onClearNotifications?: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  balance,
  cartCount,
  cartItems,
  foods,
  onToggleFavorite,
  onAddToCart,
  onUpdateQuantity,
  onCartClick,
  onTransientNotification,

  notifications = [],
  onClearNotifications,
}) => {
  // 🆕 Local state for search
  const [searchQuery, setSearchQuery] = useState('');

  const favoriteItems = foods.filter((food) => food.isFavorite);
  const filteredFavorites = favoriteItems.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCartQty = (id: number) => {
    const it = cartItems.find((ci) => ci.id === id);
    return it ? it.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white">
      <TopBar
        balance={balance}
        cartCount={cartCount}
        searchQuery={searchQuery} // ✅ connected search
        onSearchChange={setSearchQuery}
        onCartClick={onCartClick}
        notifications={notifications}
        onClearNotifications={onClearNotifications}
      />

      <div className="p-6">
        {filteredFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <Heart className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">
              {favoriteItems.length === 0
                ? 'No Favorites Yet'
                : 'No matches for your search'}
            </h2>
            <p className="text-gray-500">
              {favoriteItems.length === 0
                ? 'Start adding items to your favorites to see them here!'
                : 'Try a different search keyword.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Your Favorites
              </h1>
              
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFavorites.map((item) => {
                const qty = getCartQty(item.id);
                const isUnavailable = (item as any).availability === false;

                return (
                  <div
                    key={item.id}
                    className={`relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200 ${
                      isUnavailable ? 'opacity-60 grayscale' : ''
                    }`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.image || '/placeholder.png'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) =>
                          ((e.currentTarget as HTMLImageElement).src =
                            '/placeholder.png')
                        }
                      />

                      {isUnavailable && (
                        <div className="absolute top-3 left-3 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-md">
                          Unavailable
                        </div>
                      )}

                      <button
                        onClick={() => onToggleFavorite(item.id)}
                        className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all duration-200 ${
                          item.isFavorite ? 'bg-red-500' : 'bg-white/90'
                        }`}
                        aria-label={
                          item.isFavorite ? 'Unfavorite' : 'Favorite'
                        }
                      >
                        <Heart
                          className="w-4 h-4"
                          fill={item.isFavorite ? 'white' : 'none'}
                          stroke={item.isFavorite ? 'white' : '#374151'}
                          strokeWidth={2}
                        />
                      </button>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                        {item.name}
                      </h3>

                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                          ₹{Number(item.price).toFixed(0)}
                        </span>

                        {isUnavailable ? (
                          <button
                            disabled
                            className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
                          >
                            Unavailable
                          </button>
                        ) : qty > 0 ? (
                          <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg">
                            <button
                              onClick={() =>
                                onUpdateQuantity(item.id, Math.max(0, qty - 1))
                              }
                              className="p-1 rounded-lg hover:bg-gray-100"
                              aria-label="decrease"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="px-3 py-1 font-medium">{qty}</div>
                            <button
                              onClick={() =>
                                onUpdateQuantity(item.id, qty + 1)
                              }
                              className="p-1 rounded-lg hover:bg-gray-100"
                              aria-label="increase"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              onAddToCart(item.id);
                              onTransientNotification?.('Added to cart!');
                            }}
                            className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Order Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
