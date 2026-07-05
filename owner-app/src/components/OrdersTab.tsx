import { Search, X, Clock, ShoppingBag } from 'lucide-react';
import { Order } from '../types';
import React from 'react';

interface OrdersTabProps {
  orders: Order[];
  orderSearchQuery: string;
  setOrderSearchQuery: (query: string) => void;
  onCancelOrder: (orderId: string) => void;
  onMarkItemComplete: (orderId: string, itemId: string) => void;
}

export default function OrdersTab({
  orders,
  orderSearchQuery,
  setOrderSearchQuery,
  onCancelOrder,
  onMarkItemComplete
}: OrdersTabProps) {
  const pendingOrders = orders.filter(order => order.status === 'pending');

  const filteredOrders = pendingOrders.filter(order => {
    if (!orderSearchQuery.trim()) return true;

    const query = orderSearchQuery.toLowerCase();

    if ((order.studentToken || "").toLowerCase().includes(query)) return true;
    if ((order.studentName || "").toLowerCase().includes(query)) return true;
    if ((order.id || "").toLowerCase().includes(query)) return true;

    return order.items.some(item =>
      (item.name || "").toLowerCase().includes(query)
    );
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const timeA = (a as any).timestampDate ? (a as any).timestampDate.getTime() : new Date(`${a.date} ${a.time}`).getTime();
    const timeB = (b as any).timestampDate ? (b as any).timestampDate.getTime() : new Date(`${b.date} ${b.time}`).getTime();
    return timeB - timeA;
  });

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = (text || '').split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span>
      ) : part
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by token number, student name, order ID, or item name..."
            value={orderSearchQuery}
            onChange={(e) => setOrderSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          {orderSearchQuery && (
            <button
              onClick={() => setOrderSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {orderSearchQuery && (
          <div className="mt-2 text-sm text-gray-600">
            Found {sortedOrders.length} token{sortedOrders.length !== 1 ? 's' : ''} matching "{orderSearchQuery}"
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {sortedOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-gray-900">
                  Token: {highlightText(order.studentToken || "", orderSearchQuery)}
                </span>
                <span className="text-sm text-gray-600">
                  {highlightText(order.studentName || "", orderSearchQuery)}
                </span>
                <span className="text-sm text-gray-500">{order.time}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-gray-900">₹{(order.total || 0).toFixed(2)}</span>
                <button
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium"
                  onClick={() => onCancelOrder(order.id)}
                >
                  Cancel Order
                </button>
              </div>
            </div>

            {order.items.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Items to Prepare:</h4>
                <div className="space-y-2">
                  {order.items.map((item) => {
                    const shouldHighlight = !orderSearchQuery.trim() ||
                      (item.name || "").toLowerCase().includes(orderSearchQuery.toLowerCase());
                    return (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.isInstant ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">
                            {shouldHighlight ? highlightText(item.name || "", orderSearchQuery) : item.name}
                          </span>
                          <span className="text-xs text-gray-500">x{item.quantity}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isInstant ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {item.category}
                          </span>
                          <span className="text-xs text-gray-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.preparationTime} min
                          </span>
                        </div>
                        <button
                          onClick={() => onMarkItemComplete(order.id, item.id)}
                          disabled={Boolean(item.completed)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            item.completed
                              ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed'
                              : item.isInstant
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {item.completed ? 'Ready' : 'Mark Ready'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        {sortedOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">
              {orderSearchQuery ? 'No orders match your search' : 'No pending orders'}
            </p>
            <p className="text-sm">
              {orderSearchQuery ? 'Try a different search term' : 'New orders will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
