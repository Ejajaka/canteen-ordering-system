// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  FoodItem,
  RecentOrderItem,
  CartItem,
  OrderHistoryEntry,
  Notification,
} from './types';

import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import { TopBar } from './components/TopBar';
import { BannerSection } from './components/BannerSection';
import { PopularFood } from './components/PopularFood';
import { RecentOrders } from './components/RecentOrders';
import { BottomNavigation } from './components/BottomNavigation';
import { MenuPage } from './components/MenuPage';
import { FavoritesPage } from './components/FavoritesPage';
import { ProfilePage } from './components/ProfilePage';
import { CartPage } from './components/CartPage';
import OrderHistoryPage from './components/OrderHistoryPage';

import { db, auth } from './firebaseConfig';
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit as fbLimit,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';

// helper: convert string doc.id -> stable number id
function hashStringToNumber(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** ---------- CART PERSISTENCE HELPERS ---------- **/
const cartKeyForUser = (uid: string) => `cart:${uid}`;

function loadCart(key: string): CartItem[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return (parsed || [])
      .map((it) => ({
        ...it,
        quantity: Number(it?.quantity) || 0,
        price: Number(it?.price) || 0,
      }))
      .filter((it) => it.quantity > 0);
  } catch {
    return [];
  }
}
function saveCart(key: string, items: CartItem[]) {
  try {
    const clean = (items || [])
      .map((it) => ({
        ...it,
        quantity: Number(it.quantity) || 0,
        price: Number(it.price) || 0,
      }))
      .filter((it) => it.quantity > 0);
    localStorage.setItem(key, JSON.stringify(clean));
  } catch {}
}
function clearCart(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState<'login' | 'signup' | 'reset'>('login');

  // Auth form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Current user identity
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  // App UI state
  const [activeTab, setActiveTab] =
    useState<'home' | 'menu' | 'favourites' | 'profile'>('home');
  const [balance, setBalance] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [tokens, setTokens] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [homeSearchQuery, setHomeSearchQuery] = useState('');

  // Menu from Firestore
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  // Recently added foods (detected new docs)
  const [recentlyAddedFoods, setRecentlyAddedFoods] = useState<FoodItem[]>([]);
  const seenMenuIdsRef = useRef<Set<string>>(new Set());
  const initialMenuLoadedRef = useRef(false);

  // Favourites (doc IDs)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const favoriteIdsRef = useRef<string[]>([]);

  // Order history (live)
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>([]);

  // Single source of truth cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Recent Orders
  const [recentOrders, setRecentOrders] = useState<RecentOrderItem[]>([]);

  // Notification read-memory
  const READ_KEY = 'readNotifIds';
  const readIdsRef = useRef<Set<string>>(new Set());

  // avoid re-refunding same order in-session
  const processingRefundsRef = useRef<Set<string>>(new Set());

  // prevent duplicate payments on fast taps
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // SYNCHRONOUS GUARDS (fix double-click/race)
  const placingRef = useRef<boolean>(false); // immediate re-entry guard
  const freezeCartSyncRef = useRef<boolean>(false); // pass into cart hook if you extend it

  useEffect(() => {
    try {
      const raw = localStorage.getItem(READ_KEY);
      if (raw) readIdsRef.current = new Set(JSON.parse(raw));
    } catch {}
  }, []);

  const persistReadIds = () => {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...readIdsRef.current]));
    } catch {}
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => {
        if (!n.read) readIdsRef.current.add(n.id);
        return { ...n, read: true };
      });
      persistReadIds();
      return next;
    });
  };

  // Auth listener (cart sync handled by hook)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setIsAuthenticated(true);
        setUserId(u.uid);

        // seed from auth immediately to avoid nulls/flicker
        setUserName(u.displayName || u.email?.split('@')[0] || 'Student');

        // ensure user doc exists; prefer Firestore's fullName when present (prevents flicker)
        const uref = doc(db, 'users', u.uid);
        const snap = await getDoc(uref);
        if (!snap.exists()) {
          await setDoc(
            uref,
            {
              fullName: u.displayName || '',
              email: u.email || '',
              phone: phone || '',
              walletBalance: 0,
              favoriteDocIds: [],
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          const d = snap.data() as any;
          if (d?.fullName && String(d.fullName).trim().length > 0) {
            setUserName(String(d.fullName));
          }
        }
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setUserName('');
        setTokens([]);
        setBalance(0);
        setFavoriteIds([]);
        setOrderHistory([]);
        setNotifications([]);
        seenMenuIdsRef.current = new Set();
        initialMenuLoadedRef.current = false;
        setRecentlyAddedFoods([]);
        setAuthPage('login');

        // clear in-memory cart for logged-out UI
        setCartItems([]);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live user doc (wallet + favourites)
  useEffect(() => {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data() as any;
        setBalance(Number(d.walletBalance || 0));
        const favs = Array.isArray(d.favoriteDocIds) ? d.favoriteDocIds : [];
        favoriteIdsRef.current = favs;
        setFavoriteIds(favs);

        // prefer Firestore fullName when present so UI doesn't flip
        if (d.fullName && String(d.fullName).trim().length > 0) {
          setUserName(String(d.fullName));
        }
      }
    });
    return () => unsub();
  }, [userId]);

  // Reflect favorites into food arrays
  useEffect(() => {
    if (!favoriteIds) return;
    setFoods((prev) =>
      prev.map((f) =>
        f.docId ? { ...f, isFavorite: favoriteIds.includes(f.docId) } : f
      )
    );
    setRecentlyAddedFoods((prev) =>
      prev.map((f) =>
        f.docId ? { ...f, isFavorite: favoriteIds.includes(f.docId) } : f
      )
    );
  }, [favoriteIds]);

  // Live menu
  useEffect(() => {
    setMenuLoading(true);
    setMenuError(null);

    const ref = collection(db, 'menu');
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        const favs = favoriteIdsRef.current || [];
        const items: FoodItem[] = snapshot.docs.map((d) => {
          const x = d.data() as any;
          const docId = d.id;
          return {
            id: hashStringToNumber(docId),
            docId,
            name: x.name ?? 'Unnamed Item',
            price: Number(x.price ?? 0),
            image: x.imageUrl || x.image || '/placeholder.png',
            isFavorite: favs.includes(docId),
            prepTime: x.prepTime ?? '',
            category: x.category ?? 'other',
            subcategory: x.subcategory ?? '',
            availability:
              typeof x.availability === 'boolean' ? x.availability : true,
            isInstant: !!x.isInstant,
            createdAt: x.createdAt ?? null,
          };
        });

        // update foods to reflect current menu (this removes deleted docs)
        setFoods(items);
        setMenuLoading(false);

        const seenSet = seenMenuIdsRef.current;

        // === CLEAN recentlyAddedFoods: remove entries no longer in the menu ===
        const currentDocIds = new Set(items.map((i) => i.docId));
        setRecentlyAddedFoods((prev) => {
          // keep only those recentlyAdded entries that still exist in current menu
          const filtered = prev
            .map((p) => {
              const fresh = items.find((i) => i.docId === p.docId);
              return fresh ? { ...p, ...fresh } : null;
            })
            .filter(Boolean) as FoodItem[];
          return filtered;
        });

        // re-sync existing recentlyAddedFoods with freshest data from items
        setRecentlyAddedFoods((prev) =>
          prev.map((p) => {
            const fresh = items.find((i) => i.docId === p.docId);
            return fresh ? { ...p, ...fresh } : p;
          })
        );

        if (!initialMenuLoadedRef.current) {
          // mark all currently visible items as seen so they're not "new"
          for (const it of items) seenSet.add(it.docId!);
          initialMenuLoadedRef.current = true;

          const sortedByCreated = [...items].sort((a, b) => {
            const aCreated = (a as any).createdAt;
            const bCreated = (b as any).createdAt;
            const ta =
              aCreated && typeof aCreated.toDate === 'function'
                ? aCreated.toDate().getTime()
                : aCreated instanceof Date
                ? (aCreated as Date).getTime()
                : 0;
            const tb =
              bCreated && typeof bCreated.toDate === 'function'
                ? bCreated.toDate().getTime()
                : bCreated instanceof Date
                ? (bCreated as Date).getTime()
                : 0;
            return tb - ta;
          });
          setRecentlyAddedFoods(sortedByCreated.slice(0, 12));
        } else {
          // detect brand new items (docIds not seen before)
          const newItems: FoodItem[] = [];
          for (const it of items) {
            if (!seenSet.has(it.docId!)) {
              seenSet.add(it.docId!);
              newItems.push(it);
            }
          }
          if (newItems.length > 0) {
            setRecentlyAddedFoods((prev) => [...newItems, ...prev].slice(0, 50));
            for (const ni of newItems) {
              const notifId = `item|${ni.docId}|${Date.now()}`;
              setNotifications((prev) => [
                ...prev,
                {
                  id: notifId,
                  message: `New item added: ${ni.name} — ₹${ni.price}`,
                  type: 'item',
                  read: readIdsRef.current.has(notifId),
                  timestamp: new Date(),
                },
              ]);
            }
          }
        }
      },
      (err) => {
        console.error('Error loading menu:', err);
        setMenuError(err.message || 'Failed to load menu');
        setMenuLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // ====== NOTIFICATION + CART HANDLERS ======
  const showTransientNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 1200);
  };

  const handleAddToCart = (id: number) => {
    const food = foods.find((f) => f.id === id);
    if (!food) return;
    if (food.availability === false) {
      showTransientNotification('This item is currently unavailable');
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            id,
            name: food.name,
            price: food.price,
            image: food.image,
            quantity: 1,
            dishDocId: food.docId,
          },
        ];
      }
    });
    showTransientNotification('Added to cart!');
  };

  const handleUpdateQuantity = (id: number, newQuantity: number) => {
    setCartItems((prev) => {
      const existing = prev.find((pi) => pi.id === id);
      if (!existing && newQuantity > 0) {
        const menuMeta = foods.find((f) => f.id === id);
        if (menuMeta?.availability === false) {
          showTransientNotification('This item is currently unavailable');
          return prev;
        }
        return [
          ...prev,
          {
            id,
            name: menuMeta?.name || 'Item',
            price: menuMeta?.price || 0,
            image: menuMeta?.image || '/placeholder.png',
            quantity: newQuantity,
            dishDocId: menuMeta?.docId,
          },
        ];
      } else if (existing) {
        if (newQuantity <= 0) {
          return prev.filter((pi) => pi.id !== id);
        } else {
          return prev.map((pi) =>
            pi.id === id ? { ...pi, quantity: newQuantity } : pi
          );
        }
      }
      return prev;
    });
  };

  const handleReorder = (item: RecentOrderItem) => {
    const menuMeta =
      foods.find((f) => f.id === item.id) ||
      foods.find((f) => f.docId === (item as any).dishDocId);

    if (menuMeta?.availability === false) {
      showTransientNotification('This item is currently unavailable');
      return;
    }

    const newItem: CartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      dishDocId: (item as any).dishDocId,
    };

    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, newItem];
    });

    showTransientNotification('Added to cart!');
  };
  // ====== /NOTIFICATION + CART HANDLERS ======

  // Merge helper (sums quantities for same dishDocId or id)
  function mergeCarts(base: CartItem[], incoming: CartItem[]) {
    const map = new Map<string | number, CartItem>();
    const keyOf = (it: CartItem) => it.dishDocId ?? it.id;
    for (const it of base) map.set(keyOf(it), { ...it });
    for (const it of incoming) {
      const k = keyOf(it);
      const existing = map.get(k);
      if (existing) {
        map.set(k, { ...existing, quantity: existing.quantity + it.quantity });
      } else {
        map.set(k, { ...it });
      }
    }
    return Array.from(map.values()).filter((i) => Number(i.quantity || 0) > 0);
  }

  // When userId becomes available -> load cart (local first, then best-effort remote) and merge
  useEffect(() => {
    let cancelled = false;
    if (!userId) return;
    (async () => {
      try {
        const localKey = cartKeyForUser(userId);
        const local = loadCart(localKey); // your existing loadCart helper

        // best-effort remote read
        let remote: CartItem[] = [];
        try {
          const cartRef = doc(db, 'carts', userId);
          const snap = await getDoc(cartRef);
          if (snap.exists()) {
            const data = snap.data() as any;
            remote = Array.isArray(data.items) ? data.items : [];
          }
        } catch (e) {
          console.warn('Could not load remote cart (best-effort):', e);
        }

        // merge remote <- local  (local additions take precedence)
        const merged = mergeCarts(remote, local);

        if (!cancelled) {
          setCartItems(merged);
        }

        // persist merged locally & remotely (best-effort)
        try {
          saveCart(localKey, merged);
        } catch (e) {
          console.warn('Failed to save merged cart locally:', e);
        }
        try {
          const cartRef = doc(db, 'carts', userId);
          await setDoc(cartRef, { items: merged, updatedAt: serverTimestamp() }, { merge: true });
        } catch (e) {
          console.warn('Failed to write merged cart to Firestore (best-effort):', e);
        }
      } catch (e) {
        console.error('Error loading/merging cart for user:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Persist cartItems to per-user localStorage and Firestore whenever it changes
  useEffect(() => {
    try {
      if (!userId) return; // only keep per-user persisted cart
      const key = cartKeyForUser(userId);
      saveCart(key, cartItems);
    } catch (e) {
      console.warn('Failed to save cart locally:', e);
    }

    // best-effort remote write (do not block UI)
    (async () => {
      if (!userId) return;
      try {
        const cartRef = doc(db, 'carts', userId);
        await setDoc(cartRef, { items: cartItems, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {
        // ignore - non-fatal
        console.warn('Failed to persist cart to Firestore (best-effort):', e);
      }
    })();
  }, [cartItems, userId]);

  // NEW: Clear entire cart (local + remote best-effort)
  const handleClearEntireCart = async (confirmBefore = true) => {
    try {
      if (confirmBefore) {
        const ok = window.confirm('Clear entire cart? This will remove all items.');
        if (!ok) return;
      }

      // prevent race with place order flow
      if (placingRef.current) {
        showTransientNotification('Unable to clear cart while placing order');
        return;
      }

      if (userId) {
        try {
          const cartRef = doc(db, 'carts', userId);
          await setDoc(cartRef, { items: [], updatedAt: serverTimestamp() }, { merge: true });
        } catch (e) {
          console.warn('Failed to clear remote cart:', e);
        }
        // also clear saved per-user local storage
        try {
          saveCart(cartKeyForUser(userId), []);
        } catch {}
      } else {
        // if somehow no userId, just clear in-memory
      }

      // clear in-memory and show feedback
      setCartItems([]);
      showTransientNotification('Cart cleared');
    } catch (e) {
      console.error('Clear cart failed', e);
      alert('Failed to clear cart');
    }
  };

  // Refund helper — credit wallet + add transaction exactly once (deterministic ID)
  const processRefundIfNeeded = async (orderId: string, total: number) => {
    try {
      if (!userId) return;

      if (processingRefundsRef.current.has(orderId)) return;
      processingRefundsRef.current.add(orderId);

      const amount = Math.round(Number(total || 0));
      if (amount <= 0) return;

      const userRef = doc(db, 'users', userId);
      const refundRef = doc(db, 'transactions', `refund_${orderId}`);

      await runTransaction(db, async (tx) => {
        const refundSnap = await tx.get(refundRef);
        if (refundSnap.exists()) return;

        const ordRef = doc(db, 'order', orderId);
        const ordSnap = await tx.get(ordRef);
        if (ordSnap.exists()) {
          const o = ordSnap.data() as any;
          if (o.userId !== userId || String(o.status) !== 'cancelled') {
            return;
          }
        }

        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error('User not found');
        const currentBalance = Number(userSnap.data()?.walletBalance ?? 0);
        const newBalance = currentBalance + amount;

        tx.update(userRef, { walletBalance: newBalance });

        tx.set(refundRef, {
          userId,
          type: 'refund',
          amount,
          balanceAfter: newBalance,
          orderId,
          timestamp: serverTimestamp(),
        });
      });
    } catch (e) {
      console.error('Refund processing failed for order', orderId, e);
    } finally {
      processingRefundsRef.current.delete(orderId);
    }
  };

  // Live order history + active tokens + notifications
  useEffect(() => {
    if (!userId) return;
    const qRef = query(
      collection(db, 'order'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      fbLimit(50)
    );

    const unsub = onSnapshot(qRef, async (snapshot) => {
      const list: OrderHistoryEntry[] = snapshot.docs.map((d) => {
        const x = d.data() as any;
        const items: CartItem[] = (x.items || []).map((it: any) => ({
          id: hashStringToNumber(it.dishId || it.name || d.id),
          name: it.name,
          price: Number(it.price ?? 0),
          image: it.imageUrl || '/placeholder.png',
          quantity: Number(it.quantity ?? 1),
          dishDocId: it.dishId,
        }));
        return {
          orderId: d.id,
          token: x.token || '-',
          total: Number(x.total || 0),
          status: x.status || 'pending',
          timestamp: x.timestamp,
          items,
        };
      });

      setOrderHistory(list);

      const active = list
        .filter((o) => ['pending', 'preparing', 'ready'].includes(String(o.status)))
        .map((o) => o.token)
        .filter(Boolean);

      // De-dupe tokens so they never appear twice
      setTokens(Array.from(new Set(active)));

      for (const d of snapshot.docs) {
        try {
          const data = d.data() as any;
          const id = d.id;
          const status = String(data.status || 'pending');
          const tokenLabel = data.token || '-';
          const total = Number(data.total || 0);
          const notifId = id + '|' + status;

          const already = notifications.find((n) => n.id === notifId);
          if (!already) {
            if (status === 'accepted') {
              setNotifications((prev) => [
                ...prev,
                {
                  id: notifId,
                  message: `Order ${tokenLabel} has been accepted.`,
                  type: 'accepted',
                  read: readIdsRef.current.has(notifId),
                  timestamp: new Date(),
                },
              ]);
            } else if (['completed', 'ready', 'done'].includes(status)) {
              setNotifications((prev) => [
                ...prev,
                {
                  id: notifId,
                  message: `Order ${tokenLabel} is ready for pickup.`,
                  type: 'completed',
                  read: readIdsRef.current.has(notifId),
                  timestamp: new Date(),
                },
              ]);
            } else if (status === 'cancelled') {
              setNotifications((prev) => [
                ...prev,
                {
                  id: notifId,
                  message: `Order ${tokenLabel} was cancelled. ₹${Math.round(
                    total
                  )} will be refunded to your wallet.`,
                  type: 'cancelled',
                  read: readIdsRef.current.has(notifId),
                  timestamp: new Date(),
                },
              ]);
            }
          }

          if (status === 'cancelled') {
            processRefundIfNeeded(id, total);
          }
        } catch (e) {
          console.error('Notification/refund handling error for order doc:', d.id, e);
        }
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, notifications]);

  // keep cartCount in sync
  useEffect(() => {
    const sum = cartItems.reduce((s, it) => s + it.quantity, 0);
    setCartCount(sum);
  }, [cartItems]);

  // auth handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      alert(err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDATIONS: don't allow empty username, require 10-digit phone, strong password.
    if (!fullName || String(fullName).trim().length === 0) {
      alert('Full name is required');
      return;
    }
    if (!/^\d{10}$/.test(String(phone || '').trim())) {
      alert('Phone must be 10 digits');
      return;
    }
    // industry standard-ish checks: min 8 chars, at least 1 number, 1 special char
    const pwd = String(signupPassword || '');
    if (pwd.length < 8 || !/[0-9]/.test(pwd) || !/[^A-Za-z0-9]/.test(pwd)) {
      alert('Password must be at least 8 characters and include a number and a special character');
      return;
    }

    try {
      if (signupPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      setIsLoading(true);
      const cred = await createUserWithEmailAndPassword(
        auth,
        signupEmail,
        signupPassword
      );
      if (fullName) {
        await updateProfile(cred.user, { displayName: fullName });
      }
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          fullName: fullName || '',
          email: signupEmail,
          phone: phone || '',
          walletBalance: 0,
          favoriteDocIds: [],
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err: any) {
      alert(err?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // clear in-memory cart (we keep persisted per-user cart in localStorage so it will be restored on next login)
      setCartItems([]);
    } catch (err: any) {
      alert(err?.message || 'Logout failed');
    }
  };

  // favorites toggle
  const handleToggleFavorite = async (idOrDocId: number | string) => {
    const targetFood =
      typeof idOrDocId === 'string'
        ? foods.find((v) => v.docId === idOrDocId)
        : foods.find((v) => v.id === idOrDocId);

    if (!targetFood || !targetFood.docId || !userId) return;
    const docId = targetFood.docId;

    setFoods((prev) =>
      prev.map((food) =>
        food.docId === docId ? { ...food, isFavorite: !food.isFavorite } : food
      )
    );
    setRecentlyAddedFoods((prev) =>
      prev.map((food) =>
        food.docId === docId ? { ...food, isFavorite: !food.isFavorite } : food
      )
    );

    const uRef = doc(db, 'users', userId);
    try {
      const has = favoriteIdsRef.current.includes(docId);
      if (has) {
        await updateDoc(uRef, { favoriteDocIds: arrayRemove(docId) });
        favoriteIdsRef.current = favoriteIdsRef.current.filter(
          (x) => x !== docId
        );
      } else {
        await updateDoc(uRef, { favoriteDocIds: arrayUnion(docId) });
        favoriteIdsRef.current = [...favoriteIdsRef.current, docId];
      }
      setFavoriteIds([...favoriteIdsRef.current]);
    } catch (e) {
      console.error('Favorite toggle failed:', e);
      // rollback UI
      setFoods((prev) =>
        prev.map((food) =>
          food.docId === docId ? { ...food, isFavorite: !food.isFavorite } : food
        )
      );
      setRecentlyAddedFoods((prev) =>
        prev.map((food) =>
          food.docId === docId ? { ...food, isFavorite: !food.isFavorite } : food
        )
      );
      alert('Failed to update favourites');
    }
  };

  // Place Order — (now with synchronous guard + orderRef created inside transaction)
  const handlePlaceOrder = async (
    totalAmount: number
  ): Promise<string | undefined> => {
    // synchronous re-entry guard (prevents multiple rapid clicks)
    if (placingRef.current) {
      console.log('Order already in progress - ignoring duplicate click');
      return;
    }
    placingRef.current = true;
    setIsPlacingOrder(true);
    // optionally freeze cross-device cart sync (hook must honor this ref)
    freezeCartSyncRef.current = true;

    try {
      if (!userId) {
        alert('Please sign in first.');
        return;
      }
      if (cartItems.length === 0) {
        alert('Your cart is empty.');
        return;
      }

      const userRef = doc(db, 'users', userId);
      const tokenRef = doc(db, 'settings', 'tokens');

      // Run the transaction and create orderRef INSIDE tx to avoid race conditions
      const tokenStr = await runTransaction(db, async (tx) => {
        // create order doc id inside tx
        const newOrderRef = doc(collection(db, 'order'));
        const paymentRef = doc(db, 'transactions', `pay_${newOrderRef.id}`); // idempotent

        // idempotency: if payment exists, don't charge again
        const paySnap = await tx.get(paymentRef);
        if (paySnap.exists()) {
          const existing = paySnap.data() as any;
          return existing?.token || '(paid)';
        }

        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error('User not found');
        const currentBalance = Number(userSnap.data()?.walletBalance ?? 0);

        const amount = Math.round(Number(totalAmount || 0));
        if (isNaN(currentBalance) || currentBalance < amount) {
          throw new Error('INSUFFICIENT_FUNDS');
        }

        // token bump
        const tokenSnap = await tx.get(tokenRef);
        const lastToken = tokenSnap.exists()
          ? Number(tokenSnap.data()?.lastToken || 0)
          : 0;
        const nextToken = lastToken + 1;
        tx.set(tokenRef, { lastToken: nextToken }, { merge: true });
        const tokenLabel = 'A' + String(nextToken).padStart(3, '0');

        // order items
        const itemsForOrder = cartItems.map((ci) => {
          const menuMeta = foods.find((f) => f.docId === ci.dishDocId);
          return {
            dishId: ci.dishDocId ?? String(ci.id),
            name: ci.name,
            price: Math.round(ci.price),
            quantity: ci.quantity,
            imageUrl: ci.image || menuMeta?.image || '/placeholder.png',
            prepTime: String(menuMeta?.prepTime ?? ''),
            category: String(menuMeta?.category ?? ''),
            isInstant: Boolean(menuMeta?.isInstant ?? false),
            completed: false,
          };
        });

        // debit once
        const newBalance = Math.max(0, currentBalance - amount);
        tx.update(userRef, { walletBalance: newBalance });

        // create order (paid)
        tx.set(newOrderRef, {
          userId,
          studentName: userName || 'Student',
          items: itemsForOrder,
          total: amount,
          status: 'pending',
          token: tokenLabel,
          paid: true,
          timestamp: serverTimestamp(),
        });

        // create payment transaction with fixed ID
        tx.set(paymentRef, {
          userId,
          type: 'order',
          amount,
          balanceAfter: newBalance,
          orderId: newOrderRef.id,
          token: tokenLabel,
          timestamp: serverTimestamp(),
        });

        return tokenLabel;
      });

      // ✅ EMPTY CART AFTER SUCCESSFUL ORDER (remote + local + memory)
      try {
        const cartRef = doc(db, 'carts', userId);
        await setDoc(
          cartRef,
          { items: [], updatedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (e) {
        console.warn('Could not clear remote cart:', e);
      }
      setCartItems([]);
      try {
        saveCart(cartKeyForUser(userId), []);
      } catch {}

      // No manual setTokens here — the orders snapshot will update tokens
      setShowCart(false);
      showTransientNotification(`Order placed! Token ${tokenStr}`);
      return tokenStr;
    } catch (err: any) {
      console.error('Place order failed:', err);
      if (String(err?.message) === 'INSUFFICIENT_FUNDS') {
        alert('Insufficient wallet balance.');
        return undefined;
      }
      alert(`Order failed: ${err?.message ?? err}`);
      return undefined;
    } finally {
      // always clear guards
      placingRef.current = false;
      setIsPlacingOrder(false);
      freezeCartSyncRef.current = false;
    }
  };

  // --- REPLACED "Build Recent Orders" useEffect: dedupe across snapshot and resolve images ---
  useEffect(() => {
    if (!userId) {
      setRecentOrders([]);
      return;
    }

    const ordersRef = query(
      collection(db, 'order'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      fbLimit(50)
    );

    const storageImageCache = new Map<string, string>(); // cache resolved download URLs

    const tryResolveImage = async (raw: any) => {
      // raw might be: http(s) url, gs:// url, storage path (folder/name.jpg), or undefined
      if (!raw) return '/placeholder.png';
      const s = String(raw).trim();
      if (!s) return '/placeholder.png';
      if (/^https?:\/\//i.test(s)) return s;
      // if gs:// or contains firebase storage host or is a path, try to call getDownloadURL
      try {
        // lazy import to avoid adding storage if not used
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { getStorage, ref: storageRef, getDownloadURL } = require('firebase/storage');
        const storage = getStorage();
        // gs://bucket/path -> convert to storage ref path (strip bucket)
        let path = s;
        if (s.startsWith('gs://')) {
          const withoutPrefix = s.replace('gs://', '');
          const parts = withoutPrefix.split('/');
          parts.shift(); // remove bucket
          path = parts.join('/');
        }
        // caching
        if (storageImageCache.has(s)) return storageImageCache.get(s)!;
        const ref = storageRef(storage, path);
        const url = await getDownloadURL(ref);
        storageImageCache.set(s, url);
        return url;
      } catch (e) {
        // failed to resolve storage path; fallback to placeholder
        return '/placeholder.png';
      }
    };

    const unsub = onSnapshot(
      ordersRef,
      async (snap) => {
        try {
          // collect unique dish-level items (dedupe across orders)
          const seenDishIds = new Set<string>();
          const flat: RecentOrderItem[] = [];

          // iterate ordered by timestamp desc so most recent items appear first
          for (const d of snap.docs) {
            const o = { id: d.id, ...(d.data() as any) };
            const orderTs: Date = o?.timestamp?.toDate?.() ?? new Date();

            (o?.items || []).forEach((it: any, idx: number) => {
              const dishIdRaw = it?.dishId ?? `__order_${o.id}_idx_${idx}`;
              const dishId = String(dishIdRaw);
              if (seenDishIds.has(dishId)) return; // skip duplicates across orders
              seenDishIds.add(dishId);

              // IMPORTANT: skip items that no longer exist in the current menu (deleted)
              const menuMeta = foods.find((f) => f.docId === dishId) || null;
              if (!menuMeta) {
                // item removed from menu -> skip it entirely so deleted items don't appear
                return;
              }

              // prefer current menu values so renames/images reflect immediately
              const rawImage = menuMeta?.image ?? it?.imageUrl ?? '/placeholder.png';
              const name = menuMeta?.name ?? it?.name ?? 'Item';
              const price = Number(menuMeta?.price ?? it?.price ?? 0);

              flat.push({
                id: hashStringToNumber(dishId),
                name,
                price,
                image: rawImage,
                lastOrdered: orderTs.toISOString(),
                availability: menuMeta?.availability === false ? false : true,
              } as RecentOrderItem);
            });
          }

          // set immediate (fast) so UI shows items quickly using whatever image fields exist
          setRecentOrders(flat.slice(0, 8));

          // Now resolve any images that are not http(s) to download URLs and update the list
          const needsResolve = flat
            .map((it) => it.image)
            .filter((x) => x && !/^https?:\/\//i.test(String(x)));

          // unique
          const toResolve = Array.from(new Set(needsResolve));

          if (toResolve.length > 0) {
            const resolvedMap = new Map<string, string>();
            await Promise.all(
              toResolve.map(async (raw) => {
                const resolved = await tryResolveImage(raw);
                resolvedMap.set(raw, resolved);
              })
            );

            // map resolved urls back into recentItems
            setRecentOrders((prev) =>
              prev.map((it) => {
                const current = String(it.image || '');
                if (resolvedMap.has(current)) {
                  return { ...it, image: resolvedMap.get(current)! };
                }
                return it;
              })
            );
          }
        } catch (e) {
          console.error('Failed to build/resolve recent orders:', e);
          setRecentOrders([]);
        }
      },
      (err) => {
        console.error('Recent orders snapshot error:', err);
        setRecentOrders([]);
      }
    );

    return () => unsub();
    // include foods so menuMeta resolution is up-to-date
  }, [userId, foods]);

  // derived list for PopularFood
  const popularFoods = useMemo(() => {
    if (recentlyAddedFoods.length === 0) return foods;
    const byDoc = new Map<string | undefined, FoodItem>(
      foods.map((f) => [f.docId, f])
    );
    // Only return recentlyAdded entries that still exist in 'foods'
    return recentlyAddedFoods
      .map((p) => {
        const fresh = byDoc.get(p.docId);
        return fresh ? { ...p, ...fresh } : null;
      })
      .filter(Boolean) as FoodItem[];
  }, [foods, recentlyAddedFoods]);

  // -------------- RENDER --------------
  if (!isAuthenticated) {
    if (authPage === 'login') {
      return (
        <LoginForm
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          isLoading={isLoading}
          onSubmit={handleLoginSubmit}
          onSwitchToSignup={() => setAuthPage('signup')}
          onForgotPassword={() => setAuthPage('reset')}
        />
      );
    }

    if (authPage === 'signup') {
      return (
        <SignupForm
          signupEmail={signupEmail}
          setSignupEmail={setSignupEmail}
          signupPassword={signupPassword}
          setSignupPassword={setSignupPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          fullName={fullName}
          setFullName={setFullName}
          phone={phone}
          setPhone={setPhone}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          isLoading={isLoading}
          onSubmit={handleSignupSubmit}
          onSwitchToLogin={() => setAuthPage('login')}
        />
      );
    }

    return (
      <ForgotPasswordPage onBack={() => setAuthPage('login')} prefillEmail={loginEmail} />
    );
  }

  if (showCart) {
    return (
      <CartPage
        cartItems={cartItems}
        balance={balance}
        onUpdateQuantity={handleUpdateQuantity}
        onPlaceOrder={handlePlaceOrder}
        onBack={() => setShowCart(false)}
        onClearCart={() => handleClearEntireCart(true)} // confirm by default
      />
    );
  }

  if (showOrderHistory) {
    return (
      <div className="fixed inset-0 bg-white z-50">
        <div className="bg-white shadow-lg p-4 flex items-center">
          <button
            onClick={() => setShowOrderHistory(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="flex-1 text-center text-xl font-semibold text-gray-800 pr-12">
            Order History
          </h1>
        </div>
        <div className="p-4">
          <OrderHistoryPage
            orderHistory={orderHistory}
            onReorderFromHistory={(order) => {
              order.items.forEach((it) =>
                handleReorder({
                  id: it.id,
                  name: it.name,
                  price: it.price,
                  image: it.image,
                  lastOrdered: '',
                } as any)
              );
            }}
            onCancelOrder={() => {}}
          />
        </div>
      </div>
    );
  }

  if (activeTab === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white pb-20">
        {menuLoading ? (
          <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
            Loading menu…
          </div>
        ) : menuError ? (
          <div className="min-h-[50vh] flex items-center justify-center text-red-600">
            Failed to load menu: {menuError}
          </div>
        ) : (
          <MenuPage
            balance={balance}
            cartCount={cartCount}
            cartItems={cartItems}
            foods={foods}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onCartClick={() => setShowCart(true)}
            onTransientNotification={(msg) => setNotification(msg)}
            notifications={notifications}
            onClearNotifications={markAllAsRead}
          />
        )}
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {notification && (
          <div className="fixed bottom-24 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="font-medium">{notification}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'favourites') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white pb-20">
        {menuLoading ? (
          <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
            Loading menu…
          </div>
        ) : menuError ? (
          <div className="min-h-[50vh] flex items-center justify-center text-red-600">
            Failed to load menu: {menuError}
          </div>
        ) : (
          <FavoritesPage
            balance={balance}
            cartCount={cartCount}
            cartItems={cartItems}
            foods={foods}
            onToggleFavorite={handleToggleFavorite as any}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onCartClick={() => setShowCart(true)}
            onTransientNotification={(msg) => setNotification(msg)}
            notifications={notifications}
            onClearNotifications={markAllAsRead}
          />
        )}
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {notification && (
          <div className="fixed bottom-24 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="font-medium">{notification}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white pb-20">
        <ProfilePage
          balance={balance}
          cartCount={cartCount}
          onCartClick={() => setShowCart(true)}
          userName={userName}
          userId={userId || ''}
          orderHistory={orderHistory}
          onReorderFromHistory={() => {}}
          onLogout={handleLogout}
          notifications={notifications}
          onClearNotifications={markAllAsRead}
        />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  // Home
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white pb-20 relative">
      <div className="relative z-10">
        <TopBar
          balance={balance}
          cartCount={cartCount}
          searchQuery={homeSearchQuery}
          onSearchChange={setHomeSearchQuery}
          onCartClick={() => setShowCart(true)}
          notifications={notifications}
          onClearNotifications={markAllAsRead}
        />
      </div>

      <BannerSection tokens={tokens} />

      {menuLoading ? (
        <div className="px-4 py-6 text-gray-500">Loading menu…</div>
      ) : menuError ? (
        <div className="px-4 py-6 text-red-600">Failed to load menu: {menuError}</div>
      ) : (
        <PopularFood
          foods={popularFoods}
          searchQuery={homeSearchQuery}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
        />
      )}

      <RecentOrders
        recentItems={recentOrders as any}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onTransientNotification={showTransientNotification}
      />

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {notification && (
        <div className="fixed bottom-24 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="font-medium">{notification}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
