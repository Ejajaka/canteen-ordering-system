import { Plus, Check, Ban, Search, CreditCard as Edit3, Trash2 } from 'lucide-react';
import { MenuItem, ItemType } from '../types';

interface MenuTabProps {
  menuItems: MenuItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddMenuItem: () => void;
  onMakeAllAvailable: () => void;
  onMakeAllUnavailable: () => void;
  onMakeCategoryAvailable: (category: ItemType) => void;
  onMakeCategoryUnavailable: (category: ItemType) => void;
  onToggleAvailability: (itemId: string) => void;
  onEditSchedule: (itemId: string) => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (itemId: string) => void;
  editingItem: string | null;
  editFormData: {
    name: string;
    type: ItemType;
    price: string;
    preparationTime: string;
    isInstant: boolean;
    imageUrl: string;
  };
  setEditFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      type: ItemType;
      price: string;
      preparationTime: string;
      isInstant: boolean;
      imageUrl: string;
    }>
  >;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export default function MenuTab({
  menuItems,
  searchTerm,
  setSearchTerm,
  onAddMenuItem,
  onMakeAllAvailable,
  onMakeAllUnavailable,
  onMakeCategoryAvailable,
  onMakeCategoryUnavailable,
  onToggleAvailability,
  onEditSchedule,
  onEditItem,
  onDeleteItem,
  editingItem,
  editFormData,
  setEditFormData,
  onSaveEdit,
  onCancelEdit,
}: MenuTabProps) {
  const categories: ItemType[] = ['Breakfast', 'Lunch', 'Snacks', 'Juice', 'Chats'];
  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={onMakeAllAvailable}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Check className="w-4 h-4 mr-2" />
            Make All Available
          </button>
          <button
            onClick={onMakeAllUnavailable}
            className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
          >
            <Ban className="w-4 h-4 mr-2" />
            Make All Unavailable
          </button>
          <button
            onClick={onAddMenuItem}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((category) => {
          const categoryItems = filteredMenuItems.filter((item) => item.type === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onMakeCategoryAvailable(category)}
                    className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
                  >
                    Enable All
                  </button>
                  <button
                    onClick={() => onMakeCategoryUnavailable(category)}
                    className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors text-sm font-medium"
                  >
                    Disable All
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {categoryItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    {editingItem === item.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          {editFormData.imageUrl && (
                            <img
                              src={editFormData.imageUrl}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Item name"
                            />
                            <div className="flex space-x-2">
                              <select
                                value={editFormData.type}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, type: e.target.value as ItemType })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                <option value="Breakfast">Breakfast</option>
                                <option value="Lunch">Lunch</option>
                                <option value="Snacks">Snacks</option>
                                <option value="Juice">Juice</option>
                                <option value="Chats">Chats</option>
                              </select>

                              {/* PRICE - guarded to prevent negatives */}
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                inputMode="decimal"
                                value={editFormData.price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || Number(val) >= 0) {
                                    setEditFormData({ ...editFormData, price: val });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                                    e.preventDefault();
                                  }
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Price"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <input
                            type="url"
                            value={editFormData.imageUrl}
                            onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Image URL"
                          />

                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editFormData.isInstant}
                                onChange={(e) => setEditFormData({ ...editFormData, isInstant: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-sm font-medium text-gray-700">Instantly Available</span>
                            </label>

                            {!editFormData.isInstant && (
                              <input
                                type="number"
                                value={editFormData.preparationTime}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, preparationTime: e.target.value })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Prep time (min)"
                              />
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={onCancelEdit}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={onSaveEdit}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs">
                              No Image
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                              {item.isInstant && (
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                                  Instant
                                </span>
                              )}
                            </div>
                            <p className="text-xl font-bold mb-2 text-gray-900">₹{item.price.toFixed(2)}</p>
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center cursor-pointer relative">
                                <input type="checkbox" checked={item.available} onChange={() => onToggleAvailability(item.id)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                <span className="ml-2 text-sm text-gray-600">Available</span>
                              </label>
                              <button onClick={() => onEditSchedule(item.id)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                Edit Schedule
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
