// src/App.tsx
import React, { useEffect, useState, useRef } from "react";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import Sidebar from "./components/Sidebar";
import OrdersTab from "./components/OrdersTab";
import MenuTab from "./components/MenuTab";
import WalletTab from "./components/WalletTab";
import AnalyticsTab from "./components/AnalyticsTab";
import AddMenuItemModal from "./components/AddMenuItemModal";
import ScheduleModal from "./components/ScheduleModal";

import {
  TabType,
  Order,
  MenuItem,
  Student,
  AnalyticsData,
  RevenueFilter,
  ItemType,
  MenuItemSchedule,
  defaultSchedule,
} from "./types";

// ---------- Firebase ----------
import { auth, db } from "./firebaseconfig";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

// ---------- Helpers ----------
const OWNER_EMAIL = "hobbyhive52@gmail.com";

// convert firestore doc -> UI MenuItem with normalized fields
function normalizeMenuDoc(id: string, data: any): MenuItem {
  return {
    id,
    name: data.name ?? "Item",
    price: Number(data.price ?? 0),
    type: (data.type ?? data.category ?? "Lunch") as ItemType,
    available: data.available ?? data.availability ?? true,
    preparationTime: Number(data.preparationTime ?? data.prepTime ?? 0),
    isInstant: Boolean(data.isInstant),
    image: data.imageUrl || data.image || "",
    schedule: (data.schedule as MenuItemSchedule) ?? defaultSchedule,
    // new optional flag; keep it if present, default false
    // NOTE: MenuItem type might not include scheduleOverride; this is a permissive runtime shape
    scheduleOverride: data.scheduleOverride === true,
  } as MenuItem;
}

// convert UI payload -> firestore doc fields we want to store
function toFirestoreMenuDoc(payload: Partial<MenuItem>) {
  return {
    name: payload.name,
    price: payload.price,
    type: payload.type,
    category: payload.type,
    available: payload.available,
    availability: payload.available,
    preparationTime: payload.preparationTime,
    prepTime: payload.preparationTime,
    isInstant: payload.isInstant,
    image: payload.image ?? payload.imageUrl ?? "",
    imageUrl: payload.image ?? payload.imageUrl ?? "",
    schedule: payload.schedule ?? defaultSchedule,
    // when writing via schedule changes we'll clear scheduleOverride (owner intends schedule to control availability)
    // when writing via manual toggle callers will set scheduleOverride explicitly
    updatedAt: serverTimestamp(),
  };
}

function App() {
  // -------- Auth UI state --------
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // -------- App UI state --------
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [revenueFilter, setRevenueFilter] = useState<RevenueFilter>("day");
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [editFormData, setEditFormData] = useState<{
    name: string;
    type: ItemType;
    price: string;
    preparationTime: string;
    isInstant: boolean;
    imageUrl: string;
  }>(/* initial */ {
    name: "",
    type: "Breakfast",
    price: "",
    preparationTime: "",
    isInstant: false,
    imageUrl: "",
  });

  // -------- Data state (live) --------
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // additional analytics helper arrays
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [allStudentOrders, setAllStudentOrders] = useState<
    Array<{
      id: string;
      studentId: string;
      studentName: string;
      items: string;
      total: number;
      time: string;
      status: string;
    }>
  >([]);

  // ================= AUTH =================
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user?.email === OWNER_EMAIL) {
        setIsAuthenticated(true);
      } else {
        if (user) await signOut(auth);
        setIsAuthenticated(false);
        setAuthPage("login");
      }
    });
    return () => unsub();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );
      if (cred.user.email !== OWNER_EMAIL) {
        alert("Unauthorized! Only HobbyHive owner account can log in.");
        await signOut(auth);
        return;
      }
      setIsAuthenticated(true);
    } catch (err: any) {
      alert(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Signup disabled for owner. Use the HobbyHive account.");
    setAuthPage("login");
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
    setLoginEmail("");
    setLoginPassword("");
    setActiveTab("orders");
  };

  // ================= FIRESTORE LISTENERS =================
  // Orders
  useEffect(() => {
    const q = query(collection(db, "order"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orderData = snapshot.docs.map((d) => {
          const data = d.data() as any;

          // try to resolve Firestore Timestamp -> Date, or use fallback
          let tsDate: Date;
          try {
            if (data.timestamp && typeof data.timestamp.toDate === "function") {
              tsDate = data.timestamp.toDate();
            } else if (data.timestamp instanceof Date) {
              tsDate = data.timestamp;
            } else {
              tsDate = new Date();
            }
          } catch {
            tsDate = new Date();
          }

          // Normalize items stored as array OR map/object
          let normalizedItems: any[] = [];
          if (Array.isArray(data.items)) {
            normalizedItems = data.items;
          } else if (typeof data.items === "object" && data.items !== null) {
            normalizedItems = [data.items];
          } else {
            normalizedItems = [];
          }

          // Map to consistent shape and force not completed initially
          const items = normalizedItems.map((it: any, idx: number) => ({
            id: it.id || it.dishID || `${d.id}-item-${idx}`,
            name: it.name || "Item",
            quantity: Number(it.quantity ?? it.qty ?? 1),
            price: Number(it.price ?? 0),
            completed: Boolean(it.completed ?? false),
            category: it.category ?? "Snacks",
            preparationTime: Number(it.preparationTime ?? it.prepTime ?? 0),
            isInstant: Boolean(it.isInstant),
          }));

          const mapped: any = {
            id: d.id,
            studentToken: data.token || data.studentToken || "",
            studentName: data.StudentName || data.studentName || "",
            items,
            total: Number(data.total ?? 0),
            status: data.status ?? "pending",
            time: tsDate.toLocaleTimeString(),
            date: tsDate.toLocaleDateString(),
            // keep raw Date for analytics
            timestampDate: tsDate,
            raw: data,
          };

          return mapped as Order;
        });
        setOrders(orderData);
      },
      (error) => {
        console.error("Orders listener error:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Menu
  useEffect(() => {
    const q = query(collection(db, "menu"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => normalizeMenuDoc(d.id, d.data()));
      setMenuItems(items);
    });
    return () => unsubscribe();
  }, []);

  // Users
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rows = snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.fullName || data.name || d.id,
          walletBalance: Number(data.walletBalance ?? data.balance ?? 0),
          email: data.email ?? "",
        } as Student;
      });
      setStudents(rows);
    });
    return () => unsubscribe();
  }, []);

  // ================= ORDERS: FIRESTORE ACTIONS =================
  const cancelOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "order", orderId), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Cancel order failed:", err);
    }
  };

  /**
   * IMPORTANT:
   * - Do NOT touch wallet here.
   * - Only update items and status.
   * - Guard: if all items done but order is not paid, block completion.
   */
  const markItemComplete = async (orderId: string, itemId: string) => {
    try {
      const ref = doc(db, "order", orderId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const order = snap.data() as any;

      // Normalize items from DB (array or object)
      let rawItems: any[] = [];
      if (Array.isArray(order.items)) {
        rawItems = order.items;
      } else if (typeof order.items === "object" && order.items !== null) {
        rawItems = [order.items];
      } else {
        rawItems = [];
      }

      // Normalize and ensure stable ids
      const normalizedItems = rawItems.map((it: any, idx: number) => ({
        id: it.id || it.dishID || `${orderId}-item-${idx}`,
        name: it.name || "Item",
        quantity: Number(it.quantity ?? it.qty ?? 1),
        price: Number(it.price ?? 0),
        completed: Boolean(it.completed),
        category: it.category ?? "Snacks",
        preparationTime: Number(it.preparationTime ?? it.prepTime ?? 0),
        isInstant: Boolean(it.isInstant),
      }));

      // Mark the item as completed
      const updatedItems = normalizedItems.map((it: any) =>
        it.id === itemId || it.dishID === itemId ? { ...it, completed: true } : it
      );

      const allCompleted = updatedItems.every((it: any) => it.completed);
      const prevStatus = order.status ?? "pending";

      if (allCompleted) {
        // Only allow completion if already paid at placement
        if (order.paid !== true) {
          alert("This order is not paid yet. Ask the student to place the order again.");
          // Save item progress, do not mark completed
          await updateDoc(ref, {
            items: updatedItems,
            updatedAt: serverTimestamp(),
          });
          return;
        }

        // Mark completed
        await updateDoc(ref, {
          items: updatedItems,
          status: "completed",
          updatedAt: serverTimestamp(),
        });
      } else {
        // Partially complete -> just save items
        await updateDoc(ref, {
          items: updatedItems,
          updatedAt: serverTimestamp(),
        });
      }

      // CREATE per-item notification in Firestore for the student
      try {
        // try to resolve a user id field (support multiple possible field names)
        const userIdFromOrder =
          order.UserID ||
          order.userId ||
          order.user ||
          order.studentId ||
          (order.raw && order.raw.userId) ||
          null;

        if (userIdFromOrder) {
          // find the completed item
          const completedItem = updatedItems.find((it: any) => it.id === itemId || it.dishID === itemId);
          if (completedItem) {
            const notifId = `itemready_${orderId}_${itemId}`;
            const notifRef = doc(db, 'notifications', notifId);
            const payload = {
              userId: userIdFromOrder,
              orderId,
              itemId,
              message: `Your item "${completedItem.name}" is ready for pickup (Order ${order.token || ''}).`,
              type: "item_ready",
              read: false,
              timestamp: serverTimestamp(),
            };
            // write only if not exists (idempotent)
            const nSnap = await getDoc(notifRef);
            if (!nSnap.exists()) {
              await setDoc(notifRef, payload, { merge: true });
            }
          }
        }
      } catch (e) {
        console.warn("Failed to write notification for item ready:", e);
      }

      // NOTE: No wallet deduction or transaction creation here.
      // The charge is done ONCE at order placement in the student app
      // using a deterministic transaction id (pay_<orderId>).
    } catch (err) {
      console.error("Mark item complete failed:", err);
    }
  };

  // ================= WALLET (owner view) =================

  // SEARCH by the email prefix (everything before '@')
  const searchStudent = () => {
    if (!searchQuery || searchQuery.trim() === "") {
      setSelectedStudent(null);
      return;
    }

    const qLower = searchQuery.trim().toLowerCase();
    let found: Student | undefined;

    // prefer exact prefix or startsWith
    found = students.find((u) => {
      const email = (u as any).email || "";
      if (!email) return false;
      const prefix = email.split("@")[0] || "";
      return prefix.toLowerCase() === qLower || prefix.toLowerCase().startsWith(qLower);
    });

    // fallback: includes anywhere in prefix
    if (!found) {
      found = students.find((u) => {
        const email = (u as any).email || "";
        if (!email) return false;
        const prefix = email.split("@")[0] || "";
        return prefix.toLowerCase().includes(qLower);
      });
    }

    setSelectedStudent(found || null);
  };

  // Use the searchStudent function whenever searchQuery changes
  useEffect(() => {
    searchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, students]);

  // DEPOSIT to wallet (owner)
  const depositToStudent = async () => {
    if (!selectedStudent) return;
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) {
      alert("Enter a valid amount greater than 0");
      return;
    }

    try {
      const userRef = doc(db, "users", selectedStudent.id);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        alert("User not found in Firestore");
        return;
      }

      const userData = userSnap.data() as any;
      const currentBal = Number(userData.walletBalance ?? userData.balance ?? 0);
      const newBalance = currentBal + amt;

      // update users doc
      await updateDoc(userRef, {
        walletBalance: newBalance,
        balance: newBalance,
        updatedAt: serverTimestamp(),
      });

      // write transaction record (owner-side deposit)
      await addDoc(collection(db, "transactions"), {
        amount: amt,
        balanceAfter: newBalance,
        timestamp: serverTimestamp(),
        type: "deposit",
        userId: selectedStudent.id,
      });

      alert(`₹${amt} deposited successfully to ${selectedStudent.email || selectedStudent.id}`);
      setDepositAmount("");

      setSelectedStudent((prev) =>
        prev ? { ...prev, walletBalance: newBalance, balance: newBalance } : prev
      );

      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent.id
            ? { ...s, ...(s as any), walletBalance: newBalance, balance: newBalance }
            : s
        )
      );
    } catch (err) {
      console.error("Deposit failed:", err);
      alert("Failed to deposit money. See console for details.");
    }
  };

  // ================= MENU: FIRESTORE ACTIONS =================
  const menuCol = collection(db, "menu");

  const addMenuItem = async (item: {
    name: string;
    type: ItemType;
    price: number;
    isInstant: boolean;
    preparationTime: number;
    imageUrl?: string;
  }) => {
    await addDoc(menuCol, {
      ...toFirestoreMenuDoc({
        name: item.name,
        type: item.type,
        price: item.price,
        isInstant: item.isInstant,
        preparationTime: item.preparationTime,
        image: item.imageUrl ?? "",
        available: true,
        schedule: defaultSchedule,
      }),
      // new flag default: no manual override (schedule can control)
      scheduleOverride: false,
      createdAt: serverTimestamp(),
    });
  };

  const toggleAvailability = async (itemId: string) => {
    const current = menuItems.find((m) => m.id === itemId);
    if (!current) return;
    const next = !current.available;
    try {
      // When owner toggles, mark scheduleOverride true so schedule won't flip it back
      await updateDoc(doc(db, "menu", itemId), {
        available: next,
        availability: next,
        scheduleOverride: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("toggleAvailability error:", err);
    }
  };

  const bulkSetAvailability = async (value: boolean) => {
    const snap = await getDocs(menuCol);
    await Promise.all(
      snap.docs.map((d) =>
        updateDoc(d.ref, {
          available: value,
          availability: value,
          scheduleOverride: true, // bulk owner action -> manual override
          updatedAt: serverTimestamp(),
        })
      )
    );
  };

  const bulkSetAvailabilityForCategory = async (category: ItemType, value: boolean) => {
    const q1 = query(menuCol, where("type", "==", category));
    const q2 = query(menuCol, where("category", "==", category));
    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const all = [
      ...s1.docs,
      ...s2.docs.reduce(
        (acc, d) => (acc.some((x) => x.id === d.id) ? acc : [...acc, d]),
        [] as typeof s1.docs
      ),
    ];
    await Promise.all(
      all.map((d) =>
        updateDoc(d.ref, {
          available: value,
          availability: value,
          scheduleOverride: true,
          updatedAt: serverTimestamp(),
        })
      )
    );
  };

  const startEditItem = (item: MenuItem) => {
    setEditingItem(item.id);
    setEditFormData({
      name: item.name,
      type: item.type,
      price: String(item.price),
      preparationTime: item.isInstant ? "" : String(item.preparationTime || ""),
      isInstant: item.isInstant,
      imageUrl: item.image || "",
    });
  };

  const cancelEditItem = () => {
    setEditingItem(null);
    setEditFormData({
      name: "",
      type: "Breakfast",
      price: "",
      preparationTime: "",
      isInstant: false,
      imageUrl: "",
    });
  };

  const saveEditItem = async () => {
    if (!editingItem) return;
    const price = Number(editFormData.price || 0);
    const prep = editFormData.isInstant ? 0 : Number(editFormData.preparationTime || 0);
    const updatePayload = {
      ...toFirestoreMenuDoc({
        name: editFormData.name,
        type: editFormData.type,
        price,
        isInstant: editFormData.isInstant,
        preparationTime: prep,
        image: editFormData.imageUrl ?? "",
        available: true,
      }),
      updatedAt: serverTimestamp(),
    };
    try {
      // editing by owner -> treat as manual update: set scheduleOverride true so schedule won't immediately overwrite
      await updateDoc(doc(db, "menu", editingItem), {
        ...updatePayload,
        scheduleOverride: true,
        updatedAt: serverTimestamp(),
      });
      setEditingItem(null);
    } catch (err) {
      console.error("Error updating menu item:", err);
      alert("Failed to update item");
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    if (!confirm("Delete this item?")) return;
    await deleteDoc(doc(db, "menu", itemId));
  };

  // helper: parse "HH:MM" into minutes from midnight
  const hhmmToMinutes = (hhmm: string) => {
    const [hh, mm] = (hhmm || "00:00").split(":").map((x) => Number(x));
    return (isNaN(hh) ? 0 : hh) * 60 + (isNaN(mm) ? 0 : mm);
  };

  // ================= SCHEDULE PERIODIC CHECKER (only act on boundaries) =================
  // NOTE: reduced interval to 5s for higher precision.
  const scheduleStateRef = useRef<Record<string, boolean | undefined>>({});

  useEffect(() => {
    let mounted = true;
    const dayNames: (keyof MenuItemSchedule)[] = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const isItemCurrentlyInSchedule = (item: MenuItem) => {
      const today = new Date().getDay();
      const todayKey = dayNames[today];
      const sched = (item.schedule || defaultSchedule)[todayKey];
      if (!sched || !sched.enabled) return false;
      try {
        const now = new Date();
        const minutesNow = now.getHours() * 60 + now.getMinutes();
        const startMin = hhmmToMinutes(sched.start);
        const endMin = hhmmToMinutes(sched.end);
        if (endMin >= startMin) {
          return minutesNow >= startMin && minutesNow <= endMin;
        } else {
          // overnight
          return minutesNow >= startMin || minutesNow <= endMin;
        }
      } catch {
        return false;
      }
    };

    // initialize (record only)
    for (const it of menuItems || []) {
      scheduleStateRef.current[it.id] = isItemCurrentlyInSchedule(it);
    }

    const checkAndApplyScheduleBoundary = async () => {
      if (!mounted) return;
      if (!menuItems || menuItems.length === 0) return;

      const updates: Promise<any>[] = [];

      for (const item of menuItems) {
        try {
          // SKIP items that owner manually overridden recently
          if ((item as any).scheduleOverride === true) {
            // keep current value and do not auto-change
            scheduleStateRef.current[item.id] = undefined; // avoid repeatedly comparing
            continue;
          }

          const currentlyIn = isItemCurrentlyInSchedule(item);
          const prevIn = scheduleStateRef.current[item.id];

          if (typeof prevIn === "undefined") {
            scheduleStateRef.current[item.id] = currentlyIn;
            continue;
          }

          // Only act when schedule state changed (boundary crossing)
          if (prevIn !== currentlyIn) {
            scheduleStateRef.current[item.id] = currentlyIn;
            updates.push(
              updateDoc(doc(db, "menu", item.id), {
                available: currentlyIn,
                availability: currentlyIn,
                // when schedule drives the change, clear scheduleOverride (schedule is authoritative)
                scheduleOverride: false,
                updatedAt: serverTimestamp(),
              })
            );
          }
        } catch (err) {
          console.error("Error applying schedule boundary for item", item.id, err);
        }
      }

      if (updates.length > 0) {
        try {
          await Promise.all(updates);
        } catch (err) {
          console.error("Error applying schedule boundary updates", err);
        }
      }
    };

    // initial run
    checkAndApplyScheduleBoundary();

    const iv = setInterval(() => {
      checkAndApplyScheduleBoundary();
    }, 5 * 1000); // every 5s for precise boundaries

    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [menuItems]);

  // ================= SCHEDULE EDIT API =================
  // Optimistic update of a single day's field and write to Firestore.
  // After writing the schedule we immediately compute whether the item should be available and persist that too.
  const updateItemSchedule = async (
    itemId: string,
    day: keyof MenuItemSchedule,
    field: "start" | "end" | "enabled",
    value: string | boolean
  ) => {
    // find current item
    const current = menuItems.find((m) => m.id === itemId);
    if (!current) {
      console.warn("updateItemSchedule: item not found", itemId);
      return;
    }

    // create deep copy and apply change
    const newSchedule: MenuItemSchedule = {
      ...current.schedule,
      [day]: {
        ...current.schedule[day],
        ...(field === "enabled" ? { enabled: Boolean(value) } : {}),
        ...(field === "start" ? { start: String(value) } : {}),
        ...(field === "end" ? { end: String(value) } : {}),
      },
    };

    // optimistic local update
    setMenuItems((prev) =>
      prev.map((m) => (m.id === itemId ? { ...m, schedule: newSchedule } : m))
    );

    // helper to compute whether schedule indicates availability now
    const isNowInSchedule = (sched: MenuItemSchedule) => {
      const dayNames: (keyof MenuItemSchedule)[] = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const today = new Date().getDay();
      const todayKey = dayNames[today];
      const s = (sched || defaultSchedule)[todayKey];
      if (!s || !s.enabled) return false;
      try {
        const now = new Date();
        const minutesNow = now.getHours() * 60 + now.getMinutes();
        const startMin = hhmmToMinutes(s.start);
        const endMin = hhmmToMinutes(s.end);
        if (endMin >= startMin) return minutesNow >= startMin && minutesNow <= endMin;
        return minutesNow >= startMin || minutesNow <= endMin;
      } catch {
        return false;
      }
    };

    try {
      // commit schedule to Firestore and clear scheduleOverride so schedule controls availability
      await updateDoc(doc(db, "menu", itemId), {
        schedule: newSchedule,
        scheduleOverride: false, // since owner edited schedule, schedule should be authoritative
        updatedAt: serverTimestamp(),
      });

      // compute immediate availability and persist it immediately for precise behavior
      const shouldBeAvailableNow = isNowInSchedule(newSchedule);
      await updateDoc(doc(db, "menu", itemId), {
        available: shouldBeAvailableNow,
        availability: shouldBeAvailableNow,
        updatedAt: serverTimestamp(),
      });

      // update local copy (ensure UI matches server)
      setMenuItems((prev) =>
        prev.map((m) =>
          m.id === itemId ? { ...m, schedule: newSchedule, available: shouldBeAvailableNow, scheduleOverride: false } : m
        )
      );
    } catch (err) {
      console.error("Failed to update schedule in Firestore, rolling back:", err);
      // re-read authoritative doc and replace local item to rollback
      try {
        const snap = await getDoc(doc(db, "menu", itemId));
        if (snap.exists()) {
          const remote = normalizeMenuDoc(snap.id, snap.data());
          setMenuItems((prev) => prev.map((m) => (m.id === itemId ? remote : m)));
        }
      } catch (e) {
        console.error("Failed to rollback by refetching item:", e);
      }
      alert("Failed to save schedule. Changes were not persisted.");
    }
  };

  // ================= ANALYTICS (computed, realtime) =================
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isWithinLastNDays = (d: Date, n: number) => {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= n;
  };

  useEffect(() => {
    if (!orders) return;

    const mostOrderedMap: Record<string, { count: number; revenue: number }> = {};

    let revenueDay = 0;
    let revenueWeek = 0;
    let revenueMonth = 0;
    const now = new Date();

    for (const o of orders as any[]) {
      const ts: Date = (o as any).timestampDate ?? new Date();
      const orderTotal = Number(o.total ?? 0);
      if (isSameDay(ts, now)) revenueDay += orderTotal;
      if (isWithinLastNDays(ts, 7)) revenueWeek += orderTotal;
      if (ts.getFullYear() === now.getFullYear() && ts.getMonth() === now.getMonth())
        revenueMonth += orderTotal;

      for (const it of o.items || []) {
        const name = it.name || "Item";
        const qty = Number(it.quantity ?? it.qty ?? 1);
        const price = Number(it.price ?? 0);
        if (!mostOrderedMap[name]) mostOrderedMap[name] = { count: 0, revenue: 0 };
        mostOrderedMap[name].count += qty;
        mostOrderedMap[name].revenue += price * qty;
      }
    }

    const mostOrdered = Object.entries(mostOrderedMap)
      .map(([name, v]) => ({ name, count: v.count, revenue: v.revenue }))
      .sort((a, b) => b.count - a.count);

    const completedOrders = (orders as any[]).filter((o) => o.status === "completed");

    const studentOrders = (orders as any[]).map((o) => ({
      id: o.studentToken || o.id,
      studentId: o.id,
      studentName: o.studentName || "",
      items: (o.items || []).map((it: any) => `${it.name} x${it.quantity}`).join(", "),
      total: Number(o.total ?? 0),
      time: o.time || "",
      status: o.status || "",
    }));

    setOrderHistory(completedOrders);
    setAllStudentOrders(studentOrders);

    setAnalyticsData({
      mostOrdered,
      revenue: {
        day: revenueDay,
        week: revenueWeek,
        month: revenueMonth,
      },
      totalOrders: orders.length,
      totalStudents: students.length,
    } as AnalyticsData);
  }, [orders, students]);

  // ================= RENDER =================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-orange-50 to-pink-50">
        {/* Full-screen GIF grid background (2 cols × 4 rows) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="grid grid-cols-2 grid-rows-4 gap-4 w-full h-full p-4">
            <div className="flex items-center justify-center">
              <img src="/1.gif" alt="Campus 1" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
            </div>
            <div className="flex items-center justify-center">
              <img src="/Amv.gif" alt="Campus AMV" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
            </div>
            <div className="flex items-center justify-center">
              <img src="/Blr.gif" alt="Campus BLR" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
            </div>
            <div className="flex items-center justify-center">
              <img src="/Cbe.gif" alt="Campus CBE" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
            </div>
            <div className="flex items-center justify-center">
              <img src="/Chn.gif" alt="Campus CHN" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
            </div>
            <div className="flex items-center justify-center">
              <img src="/Fbd.gif" alt="Campus FBD" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
            </div>
            <div className="flex items-center justify-center">
              <img src="/Khi.gif" alt="Campus KHI" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
            </div>
            <div className="flex items-center justify-center">
              <img src="/Mys.gif" alt="Campus LKO" className="w-full h-full object-contain opacity-30 max-w-xs max-h-32" />
            </div>
          </div>
        </div>

        {/* Auth card */}
        <div className="relative w-full max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
            {authPage === "login" ? (
              <LoginForm
                loginEmail={loginEmail}
                setLoginEmail={setLoginEmail}
                loginPassword={loginPassword}
                setLoginPassword={setLoginPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                isLoading={isLoading}
                onSubmit={handleLoginSubmit}
                onSwitchToSignup={() => setAuthPage("signup")}
              />
            ) : (
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
                onSwitchToLogin={() => setAuthPage("login")}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <div className="ml-64 flex-1 p-8">
        {activeTab === "orders" && (
          <OrdersTab
            orders={orders}
            orderSearchQuery={orderSearchQuery}
            setOrderSearchQuery={setOrderSearchQuery}
            onCancelOrder={cancelOrder}
            onMarkItemComplete={markItemComplete}
          />
        )}

        {activeTab === "menu" && (
          <MenuTab
            menuItems={menuItems}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddMenuItem={() => setShowAddMenuItem(true)}
            onMakeAllAvailable={() => bulkSetAvailability(true)}
            onMakeAllUnavailable={() => bulkSetAvailability(false)}
            onMakeCategoryAvailable={(category) => bulkSetAvailabilityForCategory(category, true)}
            onMakeCategoryUnavailable={(category) => bulkSetAvailabilityForCategory(category, false)}
            onToggleAvailability={toggleAvailability}
            onEditSchedule={(itemId) => setEditingSchedule(itemId)}
            onEditItem={startEditItem}
            onDeleteItem={deleteMenuItem}
            editingItem={editingItem}
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            onSaveEdit={saveEditItem}
            onCancelEdit={cancelEditItem}
          />
        )}

        {activeTab === "wallet" && (
          <WalletTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedStudent={selectedStudent}
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            onSelectStudent={(student) => setSelectedStudent(student)}
            onDeposit={depositToStudent}
            allStudents={students}
          />
        )}

        {activeTab === "analytics" && analyticsData && (
          <AnalyticsTab
            analyticsData={analyticsData}
            revenueFilter={revenueFilter}
            setRevenueFilter={setRevenueFilter}
            orderHistory={orderHistory}
            orders={orders}
            showAllOrders={showAllOrders}
            setShowAllOrders={setShowAllOrders}
            allStudentOrders={allStudentOrders}
          />
        )}
      </div>

      {showAddMenuItem && (
        <AddMenuItemModal
          onClose={() => setShowAddMenuItem(false)}
          onAdd={async (item) => {
            await addMenuItem({
              name: item.name,
              type: item.type,
              price: Number(item.price),
              isInstant: Boolean(item.isInstant),
              preparationTime: Number(item.preparationTime || 0),
              imageUrl: item.imageUrl || "",
            });
            setShowAddMenuItem(false);
          }}
        />
      )}

      {/* Render ScheduleModal only when the menu item exists (prevents blank screen) */}
      {editingSchedule && (() => {
        const editingMenuItem = menuItems.find((m) => m.id === editingSchedule) || null;
        return (
          editingMenuItem && (
            <ScheduleModal
              item={editingMenuItem}
              onClose={() => setEditingSchedule(null)}
              onUpdateSchedule={updateItemSchedule}
            />
          )
        );
      })()}
    </div>
  );
}

export default App;
