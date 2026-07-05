// Food item type from menu
export interface FoodItem {
  id: number;            // stable local ID (hash of docId)
  docId?: string;        // Firestore document ID
  name: string;
  price: number;
  image: string;
  isFavorite: boolean;
  prepTime?: string | number;
  category?: string;
  subcategory?: string;
  availability?: boolean; // false => disable add/controls
  isInstant?: boolean;
}

// Cart item (snapshot of a food at add-to-cart time)
export interface CartItem {
  id: number;
  name: string;
  price: number;          // keep as number; UI formats to ₹
  image: string;
  quantity: number;
  dishDocId?: string;     // Firestore link to /menu/{docId}
}

// Order history entry
export interface OrderHistoryEntry {
  orderId: string;
  token: string;
  total: number;
  status:
    | 'pending'
    | 'accepted'
    | 'preparing'
    | 'ready'
    | 'completed'
    | 'done'
    | 'cancelled';
  timestamp: any;         // Firestore Timestamp
  items: CartItem[];
}

// For “Recent Orders” carousel/cards on Home
export interface RecentOrderItem {
  id: number;             // stable numeric id (hash of dishDocId)
  dishDocId?: string;     // Firestore menu doc id (if known)
  name: string;
  price: number;
  image: string;
  lastOrdered: string;    // ISO string
  prepTime?: string | number;
  category?: string;
  quantity?: number;
  token?: string;
}
