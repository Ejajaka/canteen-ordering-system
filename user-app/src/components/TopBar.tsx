import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Wallet, ShoppingCart, Bell, X, Volume2, VolumeX } from 'lucide-react';
import logo from '../assets/image.png';

type NotifType = 'accepted' | 'cancelled' | 'completed' | 'item';

interface Notification {
  id: string;
  message: string;
  type: NotifType;
  read: boolean;
  timestamp: any; // Firestore Timestamp or Date
}

interface TopBarProps {
  balance: number;
  cartCount: number;
  onCartClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  notifications?: Notification[];
  onClearNotifications?: () => void;
}

// only keep sounds for types we actually want to play
const SOUND_FILES: Partial<Record<NotifType, string>> = {
  cancelled: '/sounds/notify_cancelled.mp3',
  completed: '/sounds/notify_completed.mp3',
};

const MUTED_KEY = 'notifSoundMuted_v1';

export const TopBar: React.FC<TopBarProps> = ({
  balance,
  cartCount,
  onCartClick,
  searchQuery = '',
  onSearchChange,
  notifications = [],
  onClearNotifications,
}) => {
  const [showWallet, setShowWallet] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MUTED_KEY) === '1';
    } catch {
      return false;
    }
  });

  // audio map (only for keys present in SOUND_FILES)
  const audioMapRef = useRef<Partial<Record<NotifType, HTMLAudioElement | null>>>({
    cancelled: null,
    completed: null,
  });

  // prev seen IDs for detecting new notifications
  const prevNotifIds = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.read).length;

  // normalize Firestore timestamp to Date
  const tsToDate = (t: any): Date => {
    try {
      if (!t) return new Date();
      if (typeof t.toDate === 'function') return t.toDate();
      if (t instanceof Date) return t;
      return new Date(t);
    } catch {
      return new Date();
    }
  };

  // Preload audio files into HTMLAudioElement (best-effort)
  useEffect(() => {
    try {
      (Object.keys(SOUND_FILES) as NotifType[]).forEach((type) => {
        const src = SOUND_FILES[type];
        if (!src) return;
        try {
          const a = new Audio(src);
          a.preload = 'auto';
          a.load();
          audioMapRef.current[type] = a;
        } catch (e) {
          audioMapRef.current[type] = null;
        }
      });
    } catch (e) {
      // noop
    }
    return () => {
      Object.values(audioMapRef.current).forEach((a) => {
        try {
          if (a) {
            a.pause();
            // @ts-ignore
            a.src = '';
          }
        } catch {}
      });
    };
  }, []);

  // play sound when truly-new notification(s) arrive — ONLY for cancelled/completed
  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));
    const prevIds = prevNotifIds.current;
    const newlyAdded = [...currentIds].filter((id) => !prevIds.has(id));

    if (newlyAdded.length > 0 && !muted) {
      const newlyNotifs = newlyAdded
        .map((id) => notifications.find((n) => n.id === id))
        .filter(Boolean) as Notification[];

      // filter to only completed or cancelled — ignore accepted/item for sound
      const audible = newlyNotifs.filter((n) => n.type === 'cancelled' || n.type === 'completed');

      audible.forEach((notif, idx) => {
        const type = notif.type as NotifType;
        const audio = audioMapRef.current[type];
        if (audio) {
          setTimeout(() => {
            audio
              .play()
              .catch(() => {
                /* ignore play failures (browser autoplay restrictions) */
              });
          }, idx * 60);
        }
      });
    }

    prevNotifIds.current = currentIds;
  }, [notifications, muted]);

  useEffect(() => {
    if (showNotifications && onClearNotifications) onClearNotifications();
  }, [showNotifications, onClearNotifications]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(MUTED_KEY, next ? '1' : '0');
    } catch {}
  };

  // Renders the notification dropdown via portal at top of DOM
  const NotificationPortal = showNotifications
    ? createPortal(
        <div
          className="fixed top-20 right-6 w-80 max-h-[480px] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-[2147483647]"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="p-3 border-b font-semibold text-gray-800 sticky top-0 bg-white z-[2147483647] flex items-center justify-between">
            <div>Notifications</div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-1 rounded hover:bg-gray-100"
                title={muted ? 'Unmute notifications' : 'Mute notifications'}
                aria-pressed={muted}
              >
                {muted ? <VolumeX className="w-4 h-4 text-gray-600" /> : <Volume2 className="w-4 h-4 text-gray-600" />}
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-3 text-gray-500 text-sm text-center">No notifications yet</div>
          ) : (
            notifications
              .slice()
              .sort((a, b) => tsToDate(b.timestamp).getTime() - tsToDate(a.timestamp).getTime())
              .map((n) => {
                const tone =
                  n.type === 'accepted'
                    ? 'bg-green-50 text-green-700'
                    : n.type === 'cancelled'
                    ? 'bg-red-50 text-red-700'
                    : n.type === 'completed'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-purple-50 text-purple-700';
                const ts = tsToDate(n.timestamp);
                return (
                  <div key={n.id} className={`p-3 text-sm border-b ${tone}`}>
                    <div className="break-words">{n.message}</div>
                    <div className="text-xs text-gray-500 mt-1">{ts.toLocaleString()}</div>
                  </div>
                );
              })
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="bg-white shadow-lg p-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img src={logo} alt="Logo" className="h-10 w-auto" />
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="search food"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Wallet */}
          <div className="relative">
            <button
              onClick={() => setShowWallet(!showWallet)}
              className="p-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Wallet className="w-5 h-5" />
            </button>
            {showWallet && (
              <div className="absolute right-0 top-14 bg-white rounded-xl shadow-2xl border p-4 w-48 z-[9999]">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-800 mb-2">Current Balance</h3>
                  <div className="text-2xl font-bold text-green-600">₹{balance.toFixed(0)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications((s) => !s)}
              className="p-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 relative"
              aria-expanded={showNotifications}
              aria-haspopup="dialog"
              aria-label="Open notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-white text-red-600 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Cart */}
          <div className="relative">
            <button
              onClick={onCartClick}
              className="p-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Portal dropdown */}
      {NotificationPortal}
    </>
  );
};
