import React, { useState } from 'react';
import { User, Clock, Lock, LogOut, Wallet as WalletIcon } from 'lucide-react';
import { ChangePasswordPage } from './ChangePasswordPage';
import OrderHistoryPage from './OrderHistoryPage';
import { WalletPage } from './WalletPage';
import { EditProfilePage } from './EditProfilePage';
import { OrderHistoryEntry } from '../types';
import { TopBar } from './TopBar';

interface Notification {
  id: string;
  message: string;
  type: 'accepted' | 'cancelled' | 'completed' | 'item';
  read: boolean;
  timestamp: Date;
}

interface ProfilePageProps {
  balance: number;
  cartCount: number;
  userName: string;
  userId: string;
  onCartClick: () => void;
  orderHistory?: OrderHistoryEntry[];
  onReorderFromHistory?: (orderEntry: OrderHistoryEntry) => void;
  onLogout?: () => void;
  // 🔴 new: accept shared notifications so TopBar is in sync
  notifications?: Notification[];
  onClearNotifications?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  balance,
  cartCount,
  userName,
  userId,
  onCartClick,
  orderHistory = [],
  onReorderFromHistory,
  onLogout,
  notifications = [],
  onClearNotifications,
}) => {
  const [activeSection, setActiveSection] = useState<
    'main' | 'wallet' | 'orders' | 'edit' | 'password'
  >('main');

  if (activeSection === 'wallet') {
    return <WalletPage userId={userId} onBack={() => setActiveSection('main')} />;
  }

  if (activeSection === 'edit') {
    return (
      <EditProfilePage
        userName={userName}
        userId={userId}
        onBack={() => setActiveSection('main')}
      />
    );
  }

  if (activeSection === 'orders') {
    return (
      <OrderHistoryPage
        orderHistory={orderHistory}
        onReorderFromHistory={onReorderFromHistory || (() => {})}
        onBack={() => setActiveSection('main')}
      />
    );
  }

  if (activeSection === 'password') {
    return <ChangePasswordPage onBack={() => setActiveSection('main')} />;
  }

  // === Main Profile Page ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white pb-20">
      {/* 🔹 Shared TopBar: synced notifications & cart */}
      <TopBar
        balance={balance}
        cartCount={cartCount}
        onCartClick={onCartClick}
        notifications={notifications}
        onClearNotifications={onClearNotifications}
        // no search on profile; TopBar handles empty search gracefully
      />

      <div className="p-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{userName}</h1>
            <p className="text-gray-500">ID: {userId}</p>
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          <button
            onClick={() => setActiveSection('edit')}
            className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-800">Edit Profile</h3>
              <p className="text-sm text-gray-500">Update your personal information</p>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('orders')}
            className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-800">Order History</h3>
              <p className="text-sm text-gray-500">View your past orders</p>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('wallet')}
            className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl flex items-center justify-center">
              <WalletIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-800">Wallet</h3>
              <p className="text-sm text-gray-500">Balance & transactions</p>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('password')}
            className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-800">Change Password</h3>
              <p className="text-sm text-gray-500">Update your login credentials</p>
            </div>
          </button>

          <button
            onClick={onLogout}
            className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4 hover:shadow-xl transition-all duration-200 hover:bg-red-50"
          >
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-red-600">Log Out</h3>
              <p className="text-sm text-gray-500">Exit your account</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
