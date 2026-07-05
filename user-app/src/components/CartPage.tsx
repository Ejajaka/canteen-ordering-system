// src/components/CartPage.tsx
import React, { useState } from 'react';
import { Wallet, Minus, Plus, ArrowLeft } from 'lucide-react';

import { CartItem } from '../types';

interface CartPageProps {
  balance: number;
  cartItems: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  // Accept a function that returns the created token (string) when successful
  onPlaceOrder: (totalAmount: number) => Promise<string | undefined>;
  onBack: () => void;
  onClearCart?: () => void; // optional clear cart handler
}

export const CartPage: React.FC<CartPageProps> = ({
  balance,
  cartItems,
  onUpdateQuantity,
  onPlaceOrder,
  onBack,
  onClearCart,
}) => {
  const [showWallet, setShowWallet] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [tokenNumber, setTokenNumber] = useState('');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleQuantityChange = (id: number, change: number) => {
    const item = cartItems.find((item) => item.id === id);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + change);
      if (newQuantity === 0) {
        onUpdateQuantity(id, 0); // remove item from cart
      } else {
        onUpdateQuantity(id, newQuantity);
      }
    }
  };

  /**
   * IMPORTANT UX CHANGE:
   * Show the modal immediately (optimistic feedback) and then wait for the parent
   * onPlaceOrder Promise to resolve. Update the modal when the real token or error arrives.
   */
  const handlePlaceOrderClick = async () => {
    if (cartItems.length === 0) {
      setPopupMessage('Your cart is empty');
      setTokenNumber('');
      setShowPopup(true);
      return;
    }

    // show the modal right away so the user gets instant feedback
    setPopupMessage('Placing order…');
    setTokenNumber('');
    setShowPopup(true);
    setIsPlacing(true);

    try {
      const token = await onPlaceOrder(totalAmount);

      if (token) {
        // update UI with authoritative token from backend
        setTokenNumber(token);
        setPopupMessage('Order Placed Successfully!');
        setShowPaymentSuccess(true);
        // briefly show success toast
        setTimeout(() => {
          setShowPaymentSuccess(false);
        }, 2600);
      } else {
        // token undefined → insufficient funds or other server-side rejection
        setTokenNumber('');
        setPopupMessage('Insufficient Balance');
      }
    } catch (err: any) {
      console.error('CartPage place order error', err);
      setTokenNumber('');
      setPopupMessage(err?.message || 'Order failed');
    } finally {
      setIsPlacing(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    if (tokenNumber) {
      // If order succeeded, navigate back (same behavior as before)
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white">
      {/* Top Bar */}
      <div className="bg-white shadow-lg p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>

            <h1 className="text-xl font-bold text-gray-800">My Cart List</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Clear Cart button (visible only if handler provided and cart has items) */}
            {onClearCart && cartItems.length > 0 && (
              <button
                onClick={() => onClearCart()}
                className="px-3 py-2 rounded-xl bg-white border shadow-sm hover:bg-gray-50 text-sm"
              >
                Clear
              </button>
            )}

            {/* Wallet Icon */}
            <div className="relative">
              <button
                onClick={() => setShowWallet(!showWallet)}
                className="p-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <Wallet className="w-5 h-5" />
              </button>

              {showWallet && (
                <div className="absolute right-0 top-14 bg-white rounded-xl shadow-2xl border p-4 w-48 z-10">
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-800 mb-2">Current Balance</h3>
                    <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                      ₹{balance.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cart Items Section */}
      <div className="p-4 pb-32">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Your Cart is Empty</h2>
            <p className="text-gray-500">Add some delicious items to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4"
              >
                {/* Food Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Food Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">{item.name}</h3>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() =>
                        item.quantity === 1
                          ? onUpdateQuantity(item.id, 0) // remove item directly
                          : handleQuantityChange(item.id, -1)
                      }
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>

                    <span className="font-semibold text-lg min-w-[2rem] text-center">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-8 h-8 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    ₹{(item.price * item.quantity).toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-500">₹{item.price.toFixed(0)} each</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Summary Section */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Total Amount</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                ₹{totalAmount.toFixed(0)}
              </div>
            </div>

            <button
              onClick={handlePlaceOrderClick}
              disabled={isPlacing}
              className="flex-1 bg-yellow-400 text-black font-bold py-4 px-6 rounded-xl text-lg hover:bg-yellow-500 transition-colors hover:shadow-lg disabled:opacity-60"
            >
              {isPlacing ? 'Placing...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            {tokenNumber ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-2xl">✅</div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{popupMessage}</h3>
                <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl p-4 mb-4">
                  <div className="text-sm opacity-90 mb-1">Your Token Number</div>
                  <div className="text-2xl font-bold">#{tokenNumber}</div>
                </div>
                <p className="text-gray-600 mb-4">Please wait for your order to be prepared</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {/* show spinner-like indicator while placing */}
                  <div className="animate-pulse text-2xl">⏳</div>
                </div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    popupMessage === 'Insufficient Balance' ? 'text-red-600' : 'text-gray-800'
                  }`}
                >
                  {popupMessage}
                </h3>
                <p className="text-gray-600 mb-4">
                  Your current balance: ₹{balance.toFixed(0)}
                  <br />
                  Required amount: ₹{totalAmount.toFixed(0)}
                </p>
              </>
            )}

            <button
              onClick={closePopup}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all"
            >
              {tokenNumber ? 'Continue' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* Payment Success Notification */}
      {showPaymentSuccess && (
        <div className="fixed bottom-20 left-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="font-medium">Payment Successful!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
