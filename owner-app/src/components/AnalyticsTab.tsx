import { IndianRupee, Users, Package, ArrowLeft } from 'lucide-react';
import { AnalyticsData, RevenueFilter, Order } from '../types';

interface AnalyticsTabProps {
  analyticsData: AnalyticsData;
  revenueFilter: RevenueFilter;
  setRevenueFilter: (filter: RevenueFilter) => void;
  orderHistory: Order[];
  orders: Order[];
  showAllOrders: boolean;
  setShowAllOrders: (show: boolean) => void;
  allStudentOrders: Array<{
    id: string;
    studentId: string;
    studentName: string;
    items: string;
    total: number;
    time: string;
    status: string;
  }>;
}

export default function AnalyticsTab({
  analyticsData,
  revenueFilter,
  setRevenueFilter,
  orderHistory,
  orders,
  showAllOrders,
  setShowAllOrders,
  allStudentOrders,
}: AnalyticsTabProps) {
  // ✅ Only completed orders contribute to revenue
  const completedOrders = orders.filter((o) => o.status === 'completed');

  const revenueByPeriod = completedOrders.reduce(
    (acc, o) => {
      const ts =
        (o as any).timestampDate instanceof Date
          ? (o as any).timestampDate
          : new Date();
      const now = new Date();

      const isSameDay =
        ts.getFullYear() === now.getFullYear() &&
        ts.getMonth() === now.getMonth() &&
        ts.getDate() === now.getDate();

      const diffDays = (now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24);

      if (isSameDay) acc.day += Number(o.total ?? 0);
      if (diffDays <= 7) acc.week += Number(o.total ?? 0);
      if (
        ts.getFullYear() === now.getFullYear() &&
        ts.getMonth() === now.getMonth()
      ) {
        acc.month += Number(o.total ?? 0);
      }

      return acc;
    },
    { day: 0, week: 0, month: 0 }
  );

  // ===================== View: All Orders =====================
  if (showAllOrders) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAllOrders(false)}
              className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              All Student Orders
            </h1>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allStudentOrders.map((order, idx) => {
                  const key = `${order.studentId}_${order.id}_${idx}`;
                  return (
                    <tr key={key} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.studentName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {order.items}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ===================== Dashboard View =====================
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h2>
        <div className="flex space-x-2">
          {(['day', 'week', 'month'] as RevenueFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setRevenueFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                revenueFilter === filter
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue / Orders / Students */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 mb-1">
                Revenue ({revenueFilter})
              </p>
              <p className="text-3xl font-bold">
                ₹{revenueByPeriod[revenueFilter].toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <IndianRupee className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sky-100 mb-1">Total Orders</p>
              <p className="text-3xl font-bold">{analyticsData.totalOrders}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <Package className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Active Students */}
        <div className="bg-gradient-to-r from-indigo-800 to-slate-800 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 mb-1">Active Students</p>
              <p className="text-3xl font-bold">{analyticsData.totalStudents}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Most Ordered Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Most Ordered Items
        </h3>
        <div className="space-y-4">
          {analyticsData.mostOrdered.map((item, index) => (
            <div
              key={`${item.name}_${index}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.count} orders</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  ₹{item.revenue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Revenue</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order History</h3>
        <div className="space-y-3">
          {(() => {
            const merged = [
              ...orderHistory,
              ...orders.filter((o) => o.status === 'completed'),
            ] as Order[];

            const map = new Map<string, Order>();
            for (const o of merged) {
              const ts =
                (o as any).timestampDate instanceof Date
                  ? (o as any).timestampDate.getTime()
                  : 0;
              map.set(`${o.id}_${ts}`, o);
            }

            const uniqueOrders = Array.from(map.values()).sort((a, b) => {
              const tA =
                (a as any).timestampDate instanceof Date
                  ? (a as any).timestampDate.getTime()
                  : 0;
              const tB =
                (b as any).timestampDate instanceof Date
                  ? (b as any).timestampDate.getTime()
                  : 0;
              return tB - tA;
            });

            return uniqueOrders.map((order) => {
              const ts =
                (order as any).timestampDate instanceof Date
                  ? (order as any).timestampDate.getTime()
                  : 0;
              const key = `${order.id}_${ts}`;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-gray-900">#{order.id}</span>
                    <span className="text-sm text-gray-600">{order.studentName}</span>
                    <span className="text-sm text-gray-500">Token: {order.studentToken}</span>
                    <span className="text-sm text-gray-500">{order.time}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{(order.total || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(order.items || []).length} items
                    </p>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAllOrders(true)}
            className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            View More
          </button>
        </div>
      </div>
    </div>
  );
}
