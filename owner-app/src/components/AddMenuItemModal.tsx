import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ItemType } from '../types';

interface AddMenuItemModalProps {
  onClose: () => void;
  onAdd: (item: {
    name: string;
    type: ItemType;
    price: number;
    isInstant: boolean;
    preparationTime: number;
    imageUrl?: string;
  }) => void;
}

export default function AddMenuItemModal({ onClose, onAdd }: AddMenuItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Breakfast' as ItemType,
    price: '',
    isInstant: false,
    imageUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = parseFloat(formData.price || '0');

    if (!formData.name.trim()) {
      alert('Please enter item name.');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid positive price (> 0).');
      return;
    }

    const newItemPayload = {
      name: formData.name.trim(),
      type: formData.type,
      price: priceNum,
      isInstant: formData.isInstant,
      // If instant, prep time 0, otherwise default 0 (you can add input for this later)
      preparationTime: formData.isInstant ? 0 : 0,
      imageUrl: formData.imageUrl || '',
    };

    onAdd(newItemPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add New Menu Item</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ItemType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Snacks">Snacks</option>
              <option value="Juice">Juice</option>
              <option value="Chats">Chats</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={formData.price}
              onChange={(e) => {
                const val = e.target.value;
                // allow empty string (so user can clear) or non-negative
                if (val === '' || Number(val) >= 0) {
                  setFormData({ ...formData, price: val });
                }
              }}
              onKeyDown={(e) => {
                // prevent negative sign and exponential notation entry
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                  e.preventDefault();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isInstant}
                onChange={(e) => setFormData({ ...formData, isInstant: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Instantly Available</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
