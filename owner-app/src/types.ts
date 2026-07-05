export type TabType = 'orders' | 'menu' | 'wallet' | 'analytics';
export type OrderStatus = 'pending' | 'completed';
export type ItemType = 'Breakfast' | 'Lunch' | 'Snacks' | 'Juice' | 'Chats'; // <-- Drinks -> Juice
export type RevenueFilter = 'day' | 'week' | 'month';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  completed: boolean;
  category: ItemType;
  preparationTime: number;
  isInstant: boolean;
}

export interface Order {
  id: string;
  studentToken: string;
  studentName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  time: string;
  date: string;
}

export interface MenuItemSchedule {
  monday: { start: string; end: string; enabled: boolean };
  tuesday: { start: string; end: string; enabled: boolean };
  wednesday: { start: string; end: string; enabled: boolean };
  thursday: { start: string; end: string; enabled: boolean };
  friday: { start: string; end: string; enabled: boolean };
  saturday: { start: string; end: string; enabled: boolean };
  sunday: { start: string; end: string; enabled: boolean };
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  type: ItemType;
  available: boolean;
  preparationTime: number;
  isInstant: boolean;
  image?: string;
  schedule: MenuItemSchedule;
}

export interface Student {
  id: string;
  name: string;
  walletBalance: number;
  email: string;
}

export interface AnalyticsData {
  mostOrdered: { name: string; count: number; revenue: number }[];
  revenue: { day: number; week: number; month: number };
  totalOrders: number;
  totalStudents: number;
}

export const defaultSchedule: MenuItemSchedule = {
  monday: { start: '09:00', end: '17:00', enabled: true },
  tuesday: { start: '09:00', end: '17:00', enabled: true },
  wednesday: { start: '09:00', end: '17:00', enabled: true },
  thursday: { start: '09:00', end: '17:00', enabled: true },
  friday: { start: '09:00', end: '17:00', enabled: true },
  saturday: { start: '10:00', end: '16:00', enabled: true },
  sunday: { start: '10:00', end: '16:00', enabled: false }
};