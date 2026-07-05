// src/hooks/useCrossDeviceCart.ts
import { useEffect, useRef } from 'react';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  getDoc,
  Firestore,
} from 'firebase/firestore';
import type { CartItem } from '../types';

type FireCartDoc = {
  items: CartItem[];
  updatedAt?: any; // Firestore Timestamp
};

const normalize = (items: CartItem[] | any): CartItem[] =>
  Array.isArray(items)
    ? items
        .map((i) => ({
          ...i,
          quantity: Number(i?.quantity) || 0,
          price: Number(i?.price) || 0,
        }))
        .filter((i) => i.quantity > 0)
    : [];

export function mergeCarts(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<number, CartItem>();
  [...a, ...b].forEach((it) => {
    const prev = map.get(it.id);
    if (!prev) {
      map.set(it.id, {
        ...it,
        quantity: Number(it.quantity) || 0,
        price: Number(it.price) || 0,
      });
    } else {
      map.set(it.id, {
        ...prev,
        name: prev.name || it.name,
        image: prev.image || it.image,
        dishDocId: prev.dishDocId || it.dishDocId,
        price: prev.price || it.price,
        quantity: (Number(prev.quantity) || 0) + (Number(it.quantity) || 0),
      });
    }
  });
  return [...map.values()].filter((x) => x.quantity > 0);
}

export function useCrossDeviceCart(opts: {
  db: Firestore;
  userId: string | null;
  cartItems: CartItem[];
  setCartItems: (next: CartItem[] | ((cur: CartItem[]) => CartItem[])) => void;
  saveCart: (key: string, items: CartItem[]) => void;
  loadCart: (key: string) => CartItem[];
  clearCart: (key: string) => void;
  cartKeyForUser: (uid: string) => string;
  CART_GUEST_KEY: string;
}) {
  const {
    db,
    userId,
    cartItems,
    setCartItems,
    saveCart,
    loadCart,
    clearCart,
    cartKeyForUser,
    CART_GUEST_KEY,
  } = opts;

  const applyingRemoteRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const latestCartRef = useRef<CartItem[]>(cartItems);
  const hydratingRef = useRef(false); // block pushes until first server snapshot
  const lastLocalUpdateRef = useRef<number>(0); // ms since epoch

  // keep latestCartRef updated
  useEffect(() => {
    latestCartRef.current = cartItems;
  }, [cartItems]);

  // First mount: hydrate guest cart from localStorage
  useEffect(() => {
    if (userId) return;
    try {
      const guest = loadCart(CART_GUEST_KEY);
      if (guest && guest.length) {
        setCartItems(guest);
        lastLocalUpdateRef.current = Date.now();
      }
    } catch (e) {
      console.warn('Failed to load guest cart from localStorage', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Login / Logout boundaries
  useEffect(() => {
    // Login detected
    if (userId && lastUserIdRef.current !== userId) {
      lastUserIdRef.current = userId;
      hydratingRef.current = true;

      // clear guest local cache
      try {
        clearCart(CART_GUEST_KEY);
      } catch {}

      try {
        const userLocal = loadCart(cartKeyForUser(userId));
        setCartItems((cur) => {
          const chosen = cur && cur.length ? cur : userLocal;
          // mark local update time
          lastLocalUpdateRef.current = Date.now();
          return chosen;
        });
      } catch (e) {
        console.warn('Failed to load user-local cart cache', e);
      }

      // ensure remote doc exists (best-effort)
      (async () => {
        if (!db) return;
        const cartRef = doc(db, 'carts', userId);
        try {
          const snap = await getDoc(cartRef);
          if (!snap.exists()) {
            await setDoc(
              cartRef,
              { items: [], updatedAt: serverTimestamp() },
              { merge: true }
            );
          }
        } catch (err) {
          console.warn('Could not ensure remote cart doc exists (maybe permissions):', err);
        }
      })();
    }

    // Logout detected
    if (!userId && lastUserIdRef.current !== null) {
      lastUserIdRef.current = null;
      hydratingRef.current = false;
      try {
        clearCart(CART_GUEST_KEY);
      } catch {}
      setCartItems([]); // clear UI
      lastLocalUpdateRef.current = Date.now();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Live pull from Firestore carts/{uid}
  useEffect(() => {
    if (!userId || !db) return;

    const cartRef = doc(db, 'carts', userId);
    let unsub = () => {};
    try {
      unsub = onSnapshot(
        cartRef,
        (snap) => {
          try {
            const data = (snap.data() || {}) as FireCartDoc;
            const remoteItems = normalize(data.items || []);
            const remoteUpdatedAtTs = data.updatedAt?.toMillis?.() ?? 0;
            const remoteHasTimestamp =
              Boolean(data.updatedAt && typeof data.updatedAt.toMillis === 'function');

            // SAFER SNAPSHOT HANDLING:
            // - If remote has timestamp -> accept only if remote is newer than our last local update.
            // - If remote has NO timestamp -> accept ONLY if we're in hydration AND local is empty.
            // This prevents unsigned/older remote writes from stomping fresh local changes.

            if (remoteHasTimestamp) {
              if (remoteUpdatedAtTs <= lastLocalUpdateRef.current) {
                // remote is older or same as our last local update -> ignore
                hydratingRef.current = false;
                return;
              }
              // remote is newer -> accept
              applyingRemoteRef.current = true;
              setCartItems(remoteItems);
              try {
                saveCart(cartKeyForUser(userId), remoteItems);
              } catch {}
              lastLocalUpdateRef.current = remoteUpdatedAtTs;
              applyingRemoteRef.current = false;
              hydratingRef.current = false;
              return;
            }

            // remote has no timestamp
            const localEmpty = !latestCartRef.current || latestCartRef.current.length === 0;
            if (hydratingRef.current && localEmpty) {
              applyingRemoteRef.current = true;
              setCartItems(remoteItems);
              try {
                saveCart(cartKeyForUser(userId), remoteItems);
              } catch {}
              lastLocalUpdateRef.current = Date.now();
              applyingRemoteRef.current = false;
            }
            hydratingRef.current = false;
            return;
          } catch (errInSnap) {
            console.error('Error processing cart snapshot:', errInSnap);
          }
        },
        (err) => {
          console.warn('Cart onSnapshot error (permission/index?):', err);
          hydratingRef.current = false;
        }
      );
    } catch (e) {
      console.warn('Failed to subscribe to carts/{uid} (permissions?):', e);
      hydratingRef.current = false;
    }

    return () => {
      try {
        unsub();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, db]);

  // Push local changes to Firestore (cancellable debounce)
  useEffect(() => {
    if (!userId || !db) return;
    if (applyingRemoteRef.current) return;
    if (hydratingRef.current) return;

    // mark local update time immediately
    lastLocalUpdateRef.current = Date.now();

    let timeoutHandle: any = null;
    const push = async () => {
      try {
        const cartRef = doc(db, 'carts', userId);
        await setDoc(
          cartRef,
          { items: normalize(latestCartRef.current), updatedAt: serverTimestamp() },
          { merge: true }
        );
        // reflect that server should be considered no older than now
        lastLocalUpdateRef.current = Date.now();
      } catch (err) {
        console.warn('Failed to push cart to Firestore (ignored):', err);
      }
    };

    const schedule = () => {
      clearTimeout(timeoutHandle);
      timeoutHandle = setTimeout(push, 350);
    };

    schedule();

    // cancel scheduled push on cleanup (logout/unmount)
    return () => {
      clearTimeout(timeoutHandle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, userId, db]);

  // Mirror to local cache
  useEffect(() => {
    try {
      if (userId) {
        saveCart(cartKeyForUser(userId), cartItems);
      } else {
        saveCart(CART_GUEST_KEY, cartItems);
      }
      lastLocalUpdateRef.current = Date.now();
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, userId]);
}