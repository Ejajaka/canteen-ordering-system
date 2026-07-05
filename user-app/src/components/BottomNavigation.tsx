// src/components/BottomNavigation.tsx
import React from 'react';
import { Home, Menu, Heart, User } from 'lucide-react';

type TabId = 'home' | 'menu' | 'favourites' | 'profile';

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabId; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'menu', label: 'Menu', icon: Menu },
    { id: 'favourites', label: 'Favourites', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 shadow-2xl z-50">
      <div className="flex justify-around">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            aria-label={label}
            data-tab={id}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 ${
              activeTab === id
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-500 hover:text-red-600'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;