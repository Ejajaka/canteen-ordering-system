import React, { useMemo, useState } from 'react';
import {
  Utensils,
  Coffee,
  Sandwich,
  GlassWater,
  Heart,
  Plus,
  Minus,
} from 'lucide-react';
import { TopBar } from './TopBar';

interface FoodItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category?: string;
  subcategory?: string;
  isFavorite: boolean;
  prepTime?: any;
  docId?: string;
  /** 🔹 added: drives gray-out/disable */
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

interface Notification {
  id: string;
  message: string;
  type: 'accepted' | 'cancelled' | 'completed' | 'item';
  read: boolean;
  timestamp: Date;
}

interface MenuPageProps {
  balance: number;
  cartCount: number;
  cartItems: CartItem[];
  foods: FoodItem[];
  onCartClick: () => void;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (id: number) => void;
  onUpdateQuantity: (id: number, newQuantity: number) => void;
  onTransientNotification?: (msg: string) => void;

  notifications?: Notification[];
  onClearNotifications?: () => void;
}

function norm(s?: string) {
  return String(s || '').trim().toLowerCase();
}
function mapToGroup(raw?: string): {
  group: 'main-course' | 'snacks' | 'chats' | 'juice' | 'other';
  sub?: 'breakfast' | 'lunch';
} {
  const v = norm(raw);
  if (v === 'breakfast') return { group: 'main-course', sub: 'breakfast' };
  if (v === 'lunch') return { group: 'main-course', sub: 'lunch' };
  if (v === 'snack' || v === 'snacks') return { group: 'snacks' };
  if (v === 'chat' || v === 'chats' || v === 'chaat' || v === 'chaats') return { group: 'chats' };
  if (v === 'juice' || v === 'juices') return { group: 'juice' };
  return { group: 'other' };
}
function pretty(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export const MenuPage: React.FC<MenuPageProps> = ({
  balance,
  cartCount,
  cartItems,
  foods,
  onCartClick,
  onToggleFavorite,
  onAddToCart,
  onUpdateQuantity,
  onTransientNotification,

  notifications = [],
  onClearNotifications,
}) => {
  const decoratedFoods = useMemo(() => {
    return foods.map((f) => {
      const { group, sub } = mapToGroup(f.category || f.subcategory);
      return { ...f, _group: group, _sub: sub } as FoodItem & {
        _group: 'main-course' | 'snacks' | 'chats' | 'juice' | 'other';
        _sub?: 'breakfast' | 'lunch';
      };
    });
  }, [foods]);

  const categories = [
    { id: 'all', name: 'All Items', icon: Utensils },
    { id: 'main-course', name: 'Main Course', icon: Utensils, subcategories: ['breakfast', 'lunch'] as const },
    { id: 'snacks', name: 'Snacks', icon: Coffee },
    { id: 'chats', name: 'Chats', icon: Sandwich },
    { id: 'juice', name: 'Juice', icon: GlassWater },
  ] as const;

  const [selectedCategory, setSelectedCategory] =
    useState<(typeof categories)[number]['id']>('all');
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<'breakfast' | 'lunch'>('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  const filteredItems = useMemo(() => {
    let items = decoratedFoods;
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'main-course') {
        items = items.filter(
          (i) => i._group === 'main-course' && (!selectedSubcategory || i._sub === selectedSubcategory)
        );
      } else {
        items = items.filter((i) => i._group === selectedCategory);
      }
    }
    if (searchQuery.trim()) {
      const q = norm(searchQuery);
      items = items.filter((i) => norm(i.name).includes(q));
    }
    return items;
  }, [decoratedFoods, selectedCategory, selectedSubcategory, searchQuery]);

  const getCartQty = (id: number) => {
    const it = cartItems.find((ci) => ci.id === id);
    return it ? it.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white">
      <TopBar
        balance={balance}
        cartCount={cartCount}
        onCartClick={onCartClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        notifications={notifications}
        onClearNotifications={onClearNotifications}
      />

      {/* Mobile category picker toggle (now with dropdown) */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 relative">
        <button
          onClick={() => setShowCategories((v) => !v)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl"
        >
          <span className="font-medium text-gray-800">
            {categories.find((c) => c.id === selectedCategory)?.name}
            {selectedCategory === 'main-course' && ` - ${pretty(selectedSubcategory)}`}
          </span>
          <div className={`transform transition-transform ${showCategories ? 'rotate-180' : ''}`}>▼</div>
        </button>

        {showCategories && (
          <div className="absolute left-4 right-4 top-[calc(100%+8px)] z-40">
            <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-2 max-h-80 overflow-auto">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.id;
                return (
                  <div key={cat.id} className="mb-1 last:mb-0">
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        if (cat.id === 'main-course' && selectedCategory !== 'main-course') {
                          setSelectedSubcategory('breakfast');
                        }
                        setShowCategories(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                        active
                          ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{cat.name}</span>
                    </button>

                    {cat.id === 'main-course' && active && (
                      <div className="ml-10 mt-1 mb-1 space-y-1">
                        {cat.subcategories?.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => {
                              setSelectedSubcategory(sub);
                              setShowCategories(false);
                            }}
                            className={`w-full text-left p-2 rounded-md text-sm capitalize transition-all ${
                              selectedSubcategory === sub
                                ? 'bg-red-100 text-red-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Left categories (desktop) */}
        <aside className="hidden md:block w-64 bg-white shadow-lg min-h-screen p-4">
          <div className="space-y-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const active = selectedCategory === cat.id;
              return (
                <div key={cat.id}>
                  <button
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      if (cat.id === 'main-course' && selectedCategory !== 'main-course') {
                        setSelectedSubcategory('breakfast');
                      }
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      active
                        ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{cat.name}</span>
                  </button>

                  {cat.id === 'main-course' && active && (
                    <div className="ml-8 mt-2 space-y-1">
                      {cat.subcategories?.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setSelectedSubcategory(sub)}
                          className={`w-full text-left p-2 rounded-lg text-sm capitalize transition-all ${
                            selectedSubcategory === sub
                              ? 'bg-red-100 text-red-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Grid */}
        <main className="flex-1 p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredItems.map((item) => {
              const qty = getCartQty(item.id);
              const isUnavailable = item.availability === false;

              return (
                <div
                  key={item.id}
                  className={`relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 ${
                    isUnavailable ? 'opacity-60 grayscale' : ''
                  }`}
                >
                  <div className="relative h-40 sm:h-48 overflow-hidden bg-gray-100">
                    <img
                      src={item.image || '/placeholder.png'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/placeholder.png')}
                    />

                    {/* Unavailable badge */}
                    {isUnavailable && (
                      <div className="absolute top-3 left-3 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-md">
                        Unavailable
                      </div>
                    )}

                    {/* Favorite button still allowed */}
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all duration-200 ${
                        item.isFavorite ? 'bg-red-500' : 'bg-white/90'
                      }`}
                      aria-label={item.isFavorite ? 'Unfavorite' : 'Favorite'}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={item.isFavorite ? 'white' : 'none'}
                        stroke={item.isFavorite ? 'white' : '#374151'}
                        strokeWidth={2}
                      />
                    </button>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="text-xs text-gray-500 mb-1">
                      {item.category ? pretty(item.category) : 'Item'}
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base leading-tight">
                      {item.name}
                    </h3>

                    <div className="flex justify-between items-center">
                      <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                        ₹{Number(item.price).toFixed(0)}
                      </span>

                      {/* Controls */}
                      {isUnavailable ? (
                        <button
                          disabled
                          className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
                        >
                          Unavailable
                        </button>
                      ) : qty > 0 ? (
                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg">
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.max(0, qty - 1))}
                            className="p-1 rounded-lg hover:bg-gray-100"
                            aria-label="decrease"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="px-3 py-1 font-medium">{qty}</div>
                          <button
                            onClick={() => onUpdateQuantity(item.id, qty + 1)}
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
                          className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span className="hidden sm:inline">Order Now</span>
                          <span className="sm:hidden">Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Utensils className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-600 mb-2">No Items Found</h2>
              <p className="text-gray-500">Try adjusting your search or category filter</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
