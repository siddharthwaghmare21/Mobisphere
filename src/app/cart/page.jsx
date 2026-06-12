"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // पेज लोड झाल्यावर Local Storage मधून कार्टचा डेटा वाचतो
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('mobisphereCart') || '[]');
    setCartItems(storedCart);
    setIsHydrated(true);
  }, []);

  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('mobisphereCart', JSON.stringify(items));
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    const updated = cartItems.map(item => 
      item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
    );
    saveCart(updated);
  };

  const removeItem = (cartItemId) => {
    const updated = cartItems.filter(item => item.cartItemId !== cartItemId);
    saveCart(updated);
  };

  if (!isHydrated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-bold text-slate-500">
        Loading your cart...
      </div>
    );
  }

  // एकूण रक्कम कॅल्क्युलेट करतो
  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.price || 0) * (item.quantity || 1)), 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 rounded-[2rem] bg-white p-8 shadow-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Your Shopping Cart</h1>
          <p className="text-sm text-slate-500 mt-2">Review your selected items and proceed to checkout.</p>
        </div>
        <div className="px-5 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm">
          {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
        </div>
      </header>

      {cartItems.length === 0 ? (
        <div className="bg-white p-16 rounded-[2rem] border border-slate-100 shadow-sm text-center flex flex-col items-center">
          <div className="text-6xl mb-4 opacity-80">🛒</div>
          <h2 className="text-2xl font-black text-slate-900">Your cart is empty</h2>
          <p className="text-slate-500 mt-2 mb-8 font-medium">Looks like you haven't added any products to your cart yet.</p>
          <Link href="/product" className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold shadow-md hover:bg-emerald-700 transition">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 🛒 Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.cartItemId} className="bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 transition hover:shadow-md">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 rounded-2xl flex-shrink-0 p-2 overflow-hidden shadow-inner flex items-center justify-center">
                  <img src={item.image || '/images/IPhone 16 Pro Max.png'} alt={item.title} className="w-full h-full object-cover rounded-xl" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                  <p className="text-sm font-bold text-emerald-600 mt-1">₹{Number(item.price || 0).toLocaleString()}</p>
                  
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4">
                    <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 overflow-hidden shadow-sm">
                      <button onClick={() => updateQuantity(item.cartItemId, (item.quantity || 1) - 1)} className="px-4 py-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 font-black transition">-</button>
                      <span className="px-4 py-1.5 font-bold text-sm bg-white border-x border-slate-200">{item.quantity || 1}</span>
                      <button onClick={() => updateQuantity(item.cartItemId, (item.quantity || 1) + 1)} className="px-4 py-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 font-black transition">+</button>
                    </div>
                    <button onClick={() => removeItem(item.cartItemId)} className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:underline transition">Remove</button>
                  </div>
                </div>
                <div className="text-right hidden sm:block border-l border-slate-100 pl-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Total</p>
                  <p className="text-xl font-black text-slate-900">₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 🧾 Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl sticky top-28">
              <h3 className="text-xl font-black text-slate-900 mb-6">Order Summary</h3>
              <div className="space-y-4 text-sm font-semibold text-slate-600 border-b border-slate-100 pb-6 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-black uppercase">Free</span>
                </div>
              </div>
              <div className="flex justify-between items-end mb-8">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Amount</span>
                <span className="text-3xl font-black text-slate-900">₹{subtotal.toLocaleString()}</span>
              </div>
              <button onClick={() => router.push('/checkout')} className="w-full py-4 bg-slate-900 text-white rounded-full font-black text-sm hover:bg-slate-800 hover:-translate-y-0.5 transition-all shadow-lg active:scale-95">
                Proceed to Checkout
              </button>
              <div className="mt-4 text-center">
                <Link href="/product" className="text-xs font-bold text-slate-500 hover:text-slate-900 hover:underline transition">
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}