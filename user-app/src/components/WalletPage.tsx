// src/pages/WalletPage.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDocs,
  startAfter,
  limit as fbLimit,
  QueryDocumentSnapshot,
} from "firebase/firestore";

interface WalletPageProps {
  onBack: () => void;
  userId: string;
}

interface Transaction {
  id: string;
  type: "order" | "refund" | string;
  amount: number;
  balanceAfter: number;
  timestamp: any;
  orderId?: string;
}

/**
 * Behavior:
 * - Live subscription for the most recent RECENT_PAGE_SIZE transactions (onSnapshot).
 * - If user's balance changes, trigger a one-off refresh of the recent page using getDocs
 *   to cover edge cases where ordering/timestamps cause the snapshot-limited query to lag.
 * - Determine credit vs debit for display by comparing balanceAfter with next (older) record.
 */

const RECENT_PAGE_SIZE = 20;

export const WalletPage: React.FC<WalletPageProps> = ({ onBack, userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Keep reference to last visible doc for pagination (QueryDocumentSnapshot)
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);

  // avoid calling refresh repeatedly while snapshots settle
  const lastRefreshedAt = useRef<number>(0);

  // Live balance subscription (cheap)
  useEffect(() => {
    if (!userId) return;
    const userRef = doc(db, "users", userId);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const newBal = Number(snap.data().walletBalance || 0);
        // update balance
        setBalance(newBal);
      }
    });
    return () => unsub();
  }, [userId]);

  // Helper to map snapshot documents -> Transaction[]
  const docsToTransactions = (docs: QueryDocumentSnapshot[]) =>
    docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        type: data.type,
        amount: Number(data.amount ?? 0),
        balanceAfter: Number(data.balanceAfter ?? 0),
        timestamp: data.timestamp,
        orderId: data.orderId,
      } as Transaction;
    });

  // Function to refresh recent page via getDocs (one-off)
  const refreshRecent = useCallback(async () => {
    if (!userId) return;
    const now = Date.now();
    // throttle refreshes to at most once per 2 seconds to avoid churn
    if (now - lastRefreshedAt.current < 2000) return;
    lastRefreshedAt.current = now;

    try {
      const txCol = collection(db, "transactions");
      const qRef = query(
        txCol,
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        fbLimit(RECENT_PAGE_SIZE)
      );
      const snap = await getDocs(qRef);
      const list = docsToTransactions(snap.docs as QueryDocumentSnapshot[]);
      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
      setTransactions(list);
      setHasMore(snap.docs.length === RECENT_PAGE_SIZE);
      setLoadingRecent(false);
    } catch (e) {
      console.error("refreshRecent failed:", e);
    }
  }, [userId]);

  // Live subscription for most recent RECENT_PAGE_SIZE transactions.
  useEffect(() => {
    if (!userId) return;
    setLoadingRecent(true);

    const txCol = collection(db, "transactions");
    const qRef = query(
      txCol,
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      fbLimit(RECENT_PAGE_SIZE)
    );

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const list = docsToTransactions(snap.docs as QueryDocumentSnapshot[]);
        // track last doc for pagination (oldest doc in this page)
        lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        setTransactions(list);
        setHasMore(snap.docs.length === RECENT_PAGE_SIZE);
        setLoadingRecent(false);
      },
      (err) => {
        console.error("Wallet recent snapshot error:", err);
        setLoadingRecent(false);
      }
    );

    return () => unsub();
  }, [userId]);

  // If balance changes (owner deposited/updated), refresh the recent page once to make sure
  // the transactions list reflects the same ordering and picks up the newest doc.
  useEffect(() => {
    if (!userId) return;
    // only refresh when not currently loading the recent page
    if (!loadingRecent) {
      refreshRecent().catch((e) => {
        /* already logged inside refreshRecent */
      });
    }
  }, [balance, userId, loadingRecent, refreshRecent]);

  // Load older transactions (page)
  const loadMore = async () => {
    if (!userId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const txCol = collection(db, "transactions");
      const baseQuery = query(
        txCol,
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        fbLimit(RECENT_PAGE_SIZE)
      );

      // If we have a lastDocRef, fetch after it to get the next page
      const pagedQuery = lastDocRef.current
        ? query(baseQuery, startAfter(lastDocRef.current))
        : baseQuery;

      const snap = await getDocs(pagedQuery);
      if (snap.empty) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const nextList = docsToTransactions(snap.docs as QueryDocumentSnapshot[]);

      // append to existing list (keep ordering descending)
      setTransactions((prev) => [...prev, ...nextList]);

      // update lastDocRef to the last doc we fetched
      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? lastDocRef.current;

      // if we fetched less than a full page, there's no more data
      if (snap.docs.length < RECENT_PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Failed to load more transactions:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  // Render helper: determine whether a tx is credit by comparing this tx.balanceAfter with the next (older) tx.balanceAfter
  // transactions[] is sorted descending by timestamp (newest first).
  const isCreditAtIndex = (index: number) => {
    const tx = transactions[index];
    if (!tx) return false;
    const older = transactions[index + 1];
    const olderBalance = older ? Number(older.balanceAfter ?? 0) : 0;
    // if this tx leaves a higher balance than the older record, it's a credit
    return Number(tx.balanceAfter ?? 0) > olderBalance;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white">
      {/* Top Nav */}
      <div className="bg-white shadow-sm p-4 flex items-center">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 mr-4">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold text-gray-800 pr-12">
          My Wallet
        </h1>
      </div>

      {/* Balance */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Current Balance</p>
          <h2 className="text-3xl font-bold">₹{Number(balance || 0).toFixed(0)}</h2>
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4 pb-6 space-y-3">
        {loadingRecent ? (
          // lightweight skeleton / placeholder while first page lands
          <>
            <p className="text-gray-500">Loading transactions…</p>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-sm p-4 flex justify-between items-center animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="space-y-1">
                      <div className="w-40 h-3 bg-gray-200 rounded" />
                      <div className="w-24 h-2 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="w-16 h-4 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </>
        ) : transactions.length === 0 ? (
          <p className="text-gray-500">No transactions found</p>
        ) : (
          <>
            {transactions.map((tx, idx) => {
              const credit = isCreditAtIndex(idx);
              const displayAmount = Math.abs(Math.round(Number(tx.amount ?? 0)));
              const tsString =
                tx.timestamp?.toDate?.()?.toLocaleString?.() ||
                (tx.timestamp ? String(tx.timestamp) : "");
              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl shadow-lg p-4 flex justify-between items-center"
                >
                  {/* Icon + Info */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        credit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {credit ? <Plus className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {credit ? "Credit" : "Debit"}
                      </h3>
                      {tx.orderId && (
                        <p className="text-xs text-gray-500">Order ID: {tx.orderId}</p>
                      )}
                      <p className="text-xs text-gray-400">{tsString}</p>
                    </div>
                  </div>
                  {/* Amount */}
                  <div
                    className={`font-bold text-lg ${credit ? "text-green-600" : "text-red-600"}`}
                  >
                    {credit ? "+" : "-"}₹{displayAmount}
                  </div>
                </div>
              );
            })}

            <div className="flex justify-center mt-2">
              {hasMore ? (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 bg-white border rounded-xl shadow-sm hover:bg-gray-50"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              ) : (
                <div className="text-xs text-gray-400 py-2">No more transactions</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletPage;