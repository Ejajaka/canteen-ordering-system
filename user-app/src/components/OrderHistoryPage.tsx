import React from 'react';
import { OrderHistoryEntry } from '../types';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';

type Props = {
  orderHistory: OrderHistoryEntry[];
  onReorderFromHistory: (order: OrderHistoryEntry) => void;
  onCancelOrder?: (orderId: string) => void;
  onBack?: () => void; // added for ProfilePage compatibility
};

function fmt(ts: any) {
  try {
    const d = ts?.toDate?.() ?? new Date();
    return d.toLocaleString();
  } catch {
    return '';
  }
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-rose-100 text-rose-800',
};

function iconFor(status: string) {
  if (status === 'completed') return <CheckCircle className="w-5 h-5 text-gray-700" />;
  if (status === 'cancelled') return <XCircle className="w-5 h-5 text-rose-600" />;
  if (status === 'preparing') return <Package className="w-5 h-5 text-blue-600" />;
  if (status === 'ready') return <Clock className="w-5 h-5 text-emerald-600" />;
  return <Clock className="w-5 h-5 text-yellow-600" />; // pending
}

const OrderHistoryPage: React.FC<Props> = ({ orderHistory, onReorderFromHistory, onCancelOrder, onBack }) => {
  if (!orderHistory.length) {
    return (
      <div className="p-4">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Back
          </button>
        )}
        <div className="text-center text-gray-500">No orders yet.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          Back
        </button>
      )}
      {orderHistory.map((o) => (
        <div key={o.orderId} className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Token: {o.token}</div>
            <div className={`px-2 py-1 rounded-full text-xs ${statusColor[o.status] || 'bg-gray-100 text-gray-700'}`}>
              <div className="flex items-center gap-1">
                {iconFor(o.status)}
                <span className="capitalize">{o.status}</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500">{fmt(o.timestamp)}</div>

          <div className="mt-3 divide-y">
            {o.items.map((it, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-gray-500">Qty: {it.quantity}</div>
                </div>
                <div className="font-semibold">₹{(it.price * it.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="text-gray-700 font-semibold">Total: ₹{o.total.toFixed(2)}</div>
            <div className="flex gap-2">
              
                
              
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderHistoryPage;